import {pageEmployeeOptions} from '../src/modules/recursos-humanos/employeeOptions.js';
import {getUserModel} from '../src/modules/usuarios/models/User.js';
import {getDepartmentModel} from '../src/modules/empresas/models/Department.js';
import {createAuditedEmployee} from '../src/modules/recursos-humanos/employeeService.js';
import {getEmployeeModel} from '../src/modules/recursos-humanos/models/Employee.js';
import {pageEmployees} from '../src/modules/recursos-humanos/employeeService.js';
import {pageAuditEventsForTenant} from '../src/audit/auditLogger.js';
import {createAuditedSale,createAuditedPurchaseOrder,updateAuditedSaleStatus,updateAuditedPurchaseOrderStatus} from '../src/core/commercialCreation.js';
import {createSale} from '../src/modules/ventas/saleService.js';
import {createPurchaseOrder} from '../src/modules/compras/purchaseOrderService.js';
import {getCustomerModel} from '../src/modules/clientes/models/Customer.js';
import {getSupplierModel} from '../src/modules/proveedores/models/Supplier.js';
import {getModuleConfigModel,listModuleConfigs,getModuleConfig,updateInventoryConfig} from '../src/modules/configuracion/configService.js';
import {getAuditEventModel} from '../src/modules/auditoria/models/AuditEvent.js';
import {settleCommercial,getSettlementModel,findCommercialSettlement} from '../src/modules/ventas/commercialSettlement.js';
import {getSaleModel} from '../src/modules/ventas/models/Sale.js';
import {getPurchaseOrderModel} from '../src/modules/compras/models/PurchaseOrder.js';
import {recordCommercialStock,recordAuditedStock} from '../src/modules/inventario/stockService.js';
import {getBankAccountModel,getCashMovementModel} from '../src/modules/finanzas/models/FinanceModels.js';
import {pageBankAccounts,createBankAccount,createAuditedBankAccount} from '../src/modules/finanzas/bankAccountService.js';
import {pageCashMovements,createCashMovement,createAuditedCashMovement} from '../src/modules/finanzas/cashMovementService.js';
import { getCategoryModel } from '../src/modules/productos/models/Category.js';
import { updateCategoryCode } from '../src/modules/productos/categoryService.js';
import { updateWarehouseCode } from '../src/modules/inventario/warehouseService.js';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWarehouseModel } from '../src/modules/inventario/models/Warehouse.js';
import { getProductModel } from '../src/modules/productos/models/Product.js';
import { getStockMovementModel } from '../src/modules/inventario/models/StockMovement.js';
import { getStockLockModel } from '../src/modules/inventario/models/StockLock.js';
import { issueStock, listStock, pageStock, pageStockAlerts, receiveStock, transferStock } from '../src/modules/inventario/stockService.js';
import { listStockHistory } from '../src/modules/inventario/stockHistoryService.js';

// Deliberately do not load .env. Require an explicit local test replica set;
// forbid remote hosts, credentials and database names supplied by callers.
const uri = process.env.STOCK_TEST_MONGODB_URI;
const databaseName = `codex_stock_test_${randomUUID().replaceAll('-', '')}`;
let ownsDatabase = false;
let fixture: { companyId: string; branchId: string; warehouseId: string; destinationWarehouseId: string; productId: string; userId: string };
const movement = (reference: string, quantity: number) => ({
  companyId: fixture.companyId, branchId: fixture.branchId,
  warehouseId: fixture.warehouseId, productId: fixture.productId,
  userId: fixture.userId, reference, quantity
});
async function quantityAt(warehouseId: string) {
  const rows = await listStock(fixture.companyId, fixture.branchId);
  return rows.find((row) => row.warehouseId === warehouseId && row.productId === fixture.productId)?.quantity ?? 0;
}

describe('stock against a real local MongoDB replica set', () => {
  beforeAll(async () => {
    if (!uri || !/^mongodb:\/\/(?:127\.0\.0\.1|localhost):\d+\/?(?:\?[^\s]*)?$/.test(uri)) {
      throw new Error('Set STOCK_TEST_MONGODB_URI to a dedicated local replica set, for example mongodb://127.0.0.1:27017/?replicaSet=rs0. Remote hosts and database names are not allowed.');
    }
    await mongoose.connect(uri, { dbName: databaseName, serverSelectionTimeoutMS: 5000, autoIndex: true });
    const db = mongoose.connection.db;
    if (!db || db.databaseName !== databaseName) throw new Error('Unexpected test database; refusing writes.');
    ownsDatabase = true;
    const hello = await db.admin().command({ hello: 1 });
    if (!hello.setName) throw new Error('A MongoDB replica set is required; standalone servers are not supported.');
    await Promise.all([getBankAccountModel().init(),getCashMovementModel().init(),getCategoryModel().init(), getWarehouseModel().init(), getProductModel().init(), getStockMovementModel().init(), getStockLockModel().init()]);
  });
  afterAll(async () => {
    try {
      const db = mongoose.connection.db;
      // Only delete this run's generated test database, never a caller's target.
      if (ownsDatabase && db?.databaseName === databaseName && /^codex_stock_test_[a-f0-9]{32}$/.test(databaseName)) {
        await db.dropDatabase();
      }
    } finally { await mongoose.disconnect(); }
  });
  beforeEach(async () => {
    const suffix = randomUUID();
    const companyId = `test-company-${suffix}`;
    const branchId = `test-branch-${suffix}`;
    const [source, destination] = await getWarehouseModel().create([
      { companyId, branchId, name: 'Source', code: 'SOURCE' },
      { companyId, branchId, name: 'Destination', code: 'DESTINATION' }
    ]);
    const product = await getProductModel().create({ companyId, categoryId: 'test-category', name: 'Product', sku: 'PRODUCT', price: 1 });
    fixture = { companyId, branchId, warehouseId: String(source._id), destinationWarehouseId: String(destination._id), productId: String(product._id), userId: 'test-user' };
    await receiveStock(movement('opening', 10));
  });
  it('pages real financial records without leaking other branches or regex search',async()=>{
    const {companyId,branchId}=fixture;
    const account=await createBankAccount({companyId,branchId,name:'Operating A+B',bankName:'Test bank',iban:'LOCAL-001'});
    await createBankAccount({companyId,branchId:'foreign',name:'Foreign',bankName:'Test bank',iban:'LOCAL-002'});
    expect((await pageBankAccounts(companyId,branchId,{search:'A+B',limit:20})).items.map(row=>row.id)).toEqual([account.id]);
    expect((await pageBankAccounts(companyId,branchId,{search:'.*',limit:20})).items).toHaveLength(0);
    for(const type of ['INFLOW','OUTFLOW'] as const) await createCashMovement({companyId,branchId,accountId:account.id,concept:'Local cash',amount:1,type,date:'2026-10-04'});
    await getCashMovementModel().create({companyId,branchId:'foreign',accountId:account.id,concept:'Foreign cash',amount:9,type:'INFLOW',date:'2026-10-04'});
    const first=await pageCashMovements(companyId,branchId,{search:'',limit:1});expect(first.items).toHaveLength(1);expect(first.nextCursor).toBeTruthy();
    const second=await pageCashMovements(companyId,branchId,{search:'',limit:1,cursor:first.nextCursor!});expect(second.items).toHaveLength(1);expect(second.nextCursor).toBeNull();expect(second.items[0].id).not.toBe(first.items[0].id);
    expect((await pageCashMovements(companyId,branchId,{search:'',limit:20,type:'OUTFLOW',accountId:account.id})).items).toHaveLength(1);
  });
  it('changes codes atomically without altering stock or allowing scoped duplicates', async () => {
    const {companyId,branchId,warehouseId}=fixture;
    await expect(updateWarehouseCode(warehouseId,companyId,branchId,'SOURCE','DESTINATION')).rejects.toMatchObject({statusCode:409});
    const changed=await updateWarehouseCode(warehouseId,companyId,branchId,'SOURCE',' new-source ');
    expect(changed.code).toBe('NEW-SOURCE'); expect(changed.id).toBe(warehouseId); expect(changed.name).toBe('Source'); expect(await quantityAt(warehouseId)).toBe(10);
    await expect(updateWarehouseCode(warehouseId,companyId,branchId,'SOURCE','OTHER')).rejects.toMatchObject({statusCode:409});
    await expect(updateWarehouseCode(warehouseId,companyId,'foreign','NEW-SOURCE','OTHER')).rejects.toMatchObject({statusCode:409});
    const [category]=await getCategoryModel().create([{companyId,name:'Original category',code:'CAT-OLD'},{companyId,name:'Other category',code:'CAT-OTHER'}]);
    const id=String(category._id);
    await expect(updateCategoryCode(id,companyId,'CAT-OLD','CAT-OTHER')).rejects.toMatchObject({statusCode:409});
    const results=await Promise.allSettled([updateCategoryCode(id,companyId,'CAT-OLD','CAT-NEW'),updateCategoryCode(id,companyId,'CAT-OLD','CAT-SECOND')]);
    expect(results.filter(row=>row.status==='fulfilled')).toHaveLength(1);
    expect(results.find(row=>row.status==='rejected')).toMatchObject({reason:{statusCode:409}});
    expect((await getCategoryModel().findById(id).lean())?.name).toBe('Original category');
  });
  it('pages actual balances including transfers and searches names without leaking tenant names', async () => {
    await transferStock({ ...movement('page-transfer', 4), destinationWarehouseId: fixture.destinationWarehouseId });
    const all = await pageStock(fixture.companyId, fixture.branchId, { search: '', limit: 20 });
    expect(all.items).toHaveLength(2); expect(all.items.map(row => row.quantity).sort()).toEqual([4, 6]);
    expect(all.items.every(row => row.productName === 'Product')).toBe(true);
    const first = await pageStock(fixture.companyId, fixture.branchId, { search: '', limit: 1 });
    expect(first.nextCursor).toBeTruthy();
    const second = await pageStock(fixture.companyId, fixture.branchId, { search: '', limit: 1, cursor: first.nextCursor! });
    expect([...first.items, ...second.items]).toEqual(all.items); expect(second.nextCursor).toBeNull();
    const destination = await pageStock(fixture.companyId, fixture.branchId, { search: 'Destination', limit: 20 });
    expect(destination.items).toHaveLength(1); expect(destination.items[0].quantity).toBe(4);
    expect((await pageStock(fixture.companyId, fixture.branchId, { search: '.*', limit: 20 })).items).toEqual([]);
    expect((await pageStock('foreign-company', fixture.branchId, { search: '', limit: 20 })).items).toEqual([]);
    expect((await pageStock(fixture.companyId, 'foreign-branch', { search: '', limit: 20 })).items).toEqual([]);
  });
  it('allows only one of two simultaneous withdrawals exceeding the balance', async () => {
    const results = await Promise.allSettled([issueStock(movement('issue-a', 7)), issueStock(movement('issue-b', 7))]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({ reason: { statusCode: 409 } });
    expect(await quantityAt(fixture.warehouseId)).toBe(3);
    expect(await getStockMovementModel().countDocuments({ companyId: fixture.companyId })).toBe(2);
  });
  it('enforces duplicate references with the real unique index', async () => {
    const results = await Promise.allSettled([receiveStock(movement('same-reference', 2)), receiveStock(movement('same-reference', 2))]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({ reason: { statusCode: 409 } });
    expect(await quantityAt(fixture.warehouseId)).toBe(12);
  });
  it('credits the destination and makes the transferred stock withdrawable', async () => {
    await transferStock({ ...movement('transfer', 4), destinationWarehouseId: fixture.destinationWarehouseId });
    expect(await quantityAt(fixture.warehouseId)).toBe(6);
    expect(await quantityAt(fixture.destinationWarehouseId)).toBe(4);
    await issueStock({ ...movement('destination-issue', 3), warehouseId: fixture.destinationWarehouseId });
    expect(await quantityAt(fixture.destinationWarehouseId)).toBe(1);
    await expect(transferStock({ ...movement('transfer', 4), destinationWarehouseId: fixture.destinationWarehouseId })).rejects.toMatchObject({ statusCode: 409 });
    expect(await quantityAt(fixture.warehouseId)).toBe(6);
    expect(await quantityAt(fixture.destinationWarehouseId)).toBe(1);
  });
  it('serializes a transfer competing with a withdrawal', async () => {
    const results = await Promise.allSettled([
      transferStock({ ...movement('competing-transfer', 7), destinationWarehouseId: fixture.destinationWarehouseId }),
      issueStock(movement('competing-issue', 7))
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await quantityAt(fixture.warehouseId)).toBe(3);
    expect(await quantityAt(fixture.destinationWarehouseId)).toBe(results[0].status === 'fulfilled' ? 7 : 0);
  });
  it('rolls back control updates when a duplicate write fails', async () => {
    const lockKey = JSON.stringify([fixture.companyId, fixture.branchId, fixture.warehouseId, fixture.productId]);
    const before = await getStockLockModel().findById(lockKey).lean();
    await expect(receiveStock(movement('opening', 1))).rejects.toMatchObject({ statusCode: 409 });
    const after = await getStockLockModel().findById(lockKey).lean();
    expect(after?.version).toBe(before?.version);
    expect(await quantityAt(fixture.warehouseId)).toBe(10);
  });
  it('rejects a destination belonging to another branch', async () => {
    const foreign = await getWarehouseModel().create({ companyId: fixture.companyId, branchId: 'other-branch', name: 'Other branch', code: 'FOREIGN' });
    await expect(transferStock({ ...movement('foreign-transfer', 2), destinationWarehouseId: String(foreign._id) })).rejects.toMatchObject({ statusCode: 400 });
    expect(await quantityAt(fixture.warehouseId)).toBe(10);
    expect(await getStockMovementModel().countDocuments({ reference: 'foreign-transfer', companyId: fixture.companyId })).toBe(0);
  });
  it('paginates without repeating rows and scopes exact reference searches', async () => {
    await receiveStock(movement('extra', 1));
    const first = await listStockHistory(fixture.companyId, fixture.branchId, { limit: 1 });
    expect(first.nextCursor).not.toBeNull();
    const second = await listStockHistory(fixture.companyId, fixture.branchId, { limit: 1, cursor: first.nextCursor! });
    expect(second.items).toHaveLength(1);
    expect(second.items[0].id).not.toBe(first.items[0].id);
    expect(second.nextCursor).toBeNull();
    expect((await listStockHistory(fixture.companyId, 'other-branch', { reference: 'opening' })).items).toEqual([]);
    expect((await listStockHistory(fixture.companyId, fixture.branchId, { reference: 'opening' })).items).toHaveLength(1);
  });
  it('rolls back stock and cash together when commercial work fails',async()=>{
    const session=await mongoose.startSession();
    try{
      await expect(session.withTransaction(async()=>{
        await recordCommercialStock(movement('commercial-rollback',3),'ISSUE',session);
        await getCashMovementModel().create([{companyId:fixture.companyId,branchId:fixture.branchId,accountId:'test-account',concept:'commercial-rollback',type:'INFLOW',amount:3,date:'2026-10-04'}],{session});
        throw new Error('force rollback');
      })).rejects.toThrow('force rollback');
    }finally{await session.endSession();}
    expect(await quantityAt(fixture.warehouseId)).toBe(10);
    expect(await getStockMovementModel().countDocuments({companyId:fixture.companyId,reference:'commercial-rollback'})).toBe(0);
    expect(await getCashMovementModel().countDocuments({companyId:fixture.companyId,concept:'commercial-rollback'})).toBe(0);
  });
  it('commits stock and cash together and rejects insufficient shared stock',async()=>{
    const session=await mongoose.startSession();
    try{
      await session.withTransaction(async()=>{
        await recordCommercialStock(movement('commercial-commit',3),'ISSUE',session);
        await getCashMovementModel().create([{companyId:fixture.companyId,branchId:fixture.branchId,accountId:'test-account',concept:'commercial-commit',type:'INFLOW',amount:3,date:'2026-10-04'}],{session});
      });
      await expect(session.withTransaction(()=>recordCommercialStock(movement('commercial-shortage',8),'ISSUE',session))).rejects.toMatchObject({statusCode:409});
    }finally{await session.endSession();}
    expect(await quantityAt(fixture.warehouseId)).toBe(7);
    expect(await getCashMovementModel().countDocuments({companyId:fixture.companyId,concept:'commercial-commit'})).toBe(1);
  });
  it('inventory preference updates reject stale versions and audit once per confirmed save',async()=>{
    const first=await updateInventoryConfig(fixture,{expectedVersion:null,stockAlertThreshold:10});expect(first.version).toBe(1);
    await getModuleConfigModel().updateOne({companyId:fixture.companyId,module:'inventario'},{$set:{'config.existingPreference':'keep'}});
    await expect(updateInventoryConfig(fixture,{expectedVersion:null,stockAlertThreshold:20})).rejects.toMatchObject({statusCode:409});
    const results=await Promise.allSettled([updateInventoryConfig(fixture,{expectedVersion:1,stockAlertThreshold:20}),updateInventoryConfig(fixture,{expectedVersion:1,stockAlertThreshold:30})]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    const saved=await getModuleConfig(fixture.companyId,'inventario');expect(saved.version).toBe(2);expect(saved.config.existingPreference).toBe('keep');
    expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'configuracion'})).toBe(2);
    await expect(updateInventoryConfig(fixture,{expectedVersion:2,stockAlertThreshold:10,companyId:'foreign'})).rejects.toMatchObject({statusCode:400});
  });
  it('stock alerts use company threshold and recorded branch balances before pagination',async()=>{
    const query={search:'',limit:20};expect((await pageStockAlerts(fixture.companyId,fixture.branchId,query)).configured).toBe(false);
    await updateInventoryConfig(fixture,{expectedVersion:null,stockAlertThreshold:10});expect((await pageStockAlerts(fixture.companyId,fixture.branchId,query)).items).toHaveLength(0);
    await issueStock(movement('alert-issue',2));const page=await pageStockAlerts(fixture.companyId,fixture.branchId,query);expect(page.threshold).toBe(10);expect(page.items).toHaveLength(1);expect(page.items[0].quantity).toBe(8);
    expect((await pageStockAlerts(fixture.companyId,'foreign',query)).items).toHaveLength(0);
    expect((await pageStockAlerts('foreign',fixture.branchId,query)).configured).toBe(false);
    await receiveStock({...movement('alert-destination',2),warehouseId:fixture.destinationWarehouseId});
    const first=await pageStockAlerts(fixture.companyId,fixture.branchId,{search:'',limit:1});expect(first.items).toHaveLength(1);expect(first.nextCursor).not.toBeNull();
    const second=await pageStockAlerts(fixture.companyId,fixture.branchId,{search:'',limit:1,cursor:first.nextCursor!});expect(second.items).toHaveLength(1);expect(second.nextCursor).toBeNull();expect([first.items[0].quantity,second.items[0].quantity].sort()).toEqual([2,8]);
    expect((await pageStockAlerts(fixture.companyId,fixture.branchId,{search:'Destination',limit:20})).items).toHaveLength(1);
    await updateInventoryConfig(fixture,{expectedVersion:1,stockAlertThreshold:0});expect((await pageStockAlerts(fixture.companyId,fixture.branchId,query)).items).toHaveLength(0);
  });
  it('configuration audit failure leaves no saved preference',async()=>{
    const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Config audit failure'));
    try{await expect(updateInventoryConfig(fixture,{expectedVersion:null,stockAlertThreshold:10})).rejects.toThrow('Config audit failure');}finally{spy.mockRestore();}
    expect(await getModuleConfigModel().countDocuments({companyId:fixture.companyId})).toBe(0);
  });
  it('module configuration persists with company isolation and a unique module',async()=>{
    const model=getModuleConfigModel();await model.init();
    await model.create({companyId:fixture.companyId,module:'sales',enabled:false,config:{}});
    await model.create({companyId:'foreign-'+fixture.companyId,module:'sales',enabled:true,config:{}});
    expect(await listModuleConfigs(fixture.companyId)).toHaveLength(1);
    expect((await getModuleConfig(fixture.companyId,'sales')).enabled).toBe(false);
    await expect(getModuleConfig('missing-'+fixture.companyId,'sales')).rejects.toMatchObject({statusCode:404});
    await expect(model.create({companyId:fixture.companyId,module:'sales',enabled:true,config:{}})).rejects.toMatchObject({code:11000});
  });
  it('settles sale once across inventory, cash and status; repeat returns same receipt',async()=>{
    const account=await getBankAccountModel().create({companyId:fixture.companyId,branchId:fixture.branchId,name:'Bank',bankName:'Bank',iban:'BANK',status:'ACTIVE'});
    const sale=await getSaleModel().create({companyId:fixture.companyId,branchId:fixture.branchId,customerId:'customer',productId:fixture.productId,quantity:3,unitPrice:2,total:6,status:'PENDIENTE'});
    const input={kind:'sales',sourceId:String(sale._id),warehouseId:fixture.warehouseId,accountId:String(account._id),date:'2026-10-04'};
    const receipt=await settleCommercial(fixture,input);const retry=await settleCommercial(fixture,input);
    expect(retry.id).toBe(receipt.id);expect(await quantityAt(fixture.warehouseId)).toBe(7);
    expect((await findCommercialSettlement(fixture,{kind:'sales',sourceId:String(sale._id)})).id).toBe(receipt.id);
    await expect(findCommercialSettlement({...fixture,branchId:'foreign'},{kind:'sales',sourceId:String(sale._id)})).rejects.toMatchObject({statusCode:404});
    await expect(findCommercialSettlement({...fixture,companyId:'foreign'},{kind:'sales',sourceId:String(sale._id)})).rejects.toMatchObject({statusCode:404});
    await expect(findCommercialSettlement(fixture,{kind:'sales',sourceId:String(sale._id),companyId:'foreign'})).rejects.toMatchObject({statusCode:400});
    expect((await getSaleModel().findById(sale._id))?.status).toBe('PAGADA');
    expect(await getCashMovementModel().countDocuments({companyId:fixture.companyId,concept:'SALE:'+sale._id})).toBe(1);
    await expect(settleCommercial(fixture,{...input,date:'2026-10-05'})).rejects.toMatchObject({statusCode:409});
    const events=await getAuditEventModel().find({companyId:fixture.companyId,entityId:String(sale._id)}).lean();expect(events).toHaveLength(1);expect(events[0]).toMatchObject({branchId:fixture.branchId,userId:fixture.userId,module:'ventas',previousState:{status:'PENDIENTE'},newState:{status:'PAGADA'},details:{settlementId:receipt.id,stockMovementId:receipt.stockMovementId,cashMovementId:receipt.cashMovementId}});
  });
  it('rolls back commercial status and cash when stock is insufficient or account is foreign',async()=>{
    const account=await getBankAccountModel().create({companyId:fixture.companyId,branchId:fixture.branchId,name:'Bank',bankName:'Bank',iban:'BANK',status:'ACTIVE'});
    const sale=await getSaleModel().create({companyId:fixture.companyId,branchId:fixture.branchId,customerId:'customer',productId:fixture.productId,quantity:11,unitPrice:2,total:22,status:'PENDIENTE'});
    const input={kind:'sales',sourceId:String(sale._id),warehouseId:fixture.warehouseId,accountId:String(account._id),date:'2026-10-04'};
    await expect(settleCommercial(fixture,input)).rejects.toMatchObject({statusCode:409});
    await expect(settleCommercial(fixture,{...input,accountId:new mongoose.Types.ObjectId().toString()})).rejects.toMatchObject({statusCode:400});
    expect((await getSaleModel().findById(sale._id))?.status).toBe('PENDIENTE');expect(await quantityAt(fixture.warehouseId)).toBe(10);
    expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId})).toBe(0);
    expect(await getCashMovementModel().countDocuments({companyId:fixture.companyId})).toBe(0);expect(await getSettlementModel().countDocuments({companyId:fixture.companyId})).toBe(0);
  });
  it('audit storage failure rolls back status, stock, cash and receipt',async()=>{
    const account=await getBankAccountModel().create({companyId:fixture.companyId,branchId:fixture.branchId,name:'Bank',bankName:'Bank',iban:'BANK',status:'ACTIVE'});
    const sale=await getSaleModel().create({companyId:fixture.companyId,branchId:fixture.branchId,customerId:'customer',productId:fixture.productId,quantity:3,unitPrice:2,total:6,status:'PENDIENTE'});
    const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Simulated audit storage failure'));
    try {await expect(settleCommercial(fixture,{kind:'sales',sourceId:String(sale._id),warehouseId:fixture.warehouseId,accountId:String(account._id),date:'2026-10-04'})).rejects.toThrow('Simulated audit storage failure');}finally{spy.mockRestore();}
    expect((await getSaleModel().findById(sale._id))?.status).toBe('PENDIENTE');expect(await quantityAt(fixture.warehouseId)).toBe(10);
    for(const model of [getAuditEventModel(),getCashMovementModel(),getSettlementModel()])expect(await model.countDocuments({companyId:fixture.companyId})).toBe(0);
    expect(await getStockMovementModel().countDocuments({companyId:fixture.companyId,reference:'SALE:'+sale._id})).toBe(0);
  });
  it('concurrent purchase settlement receives stock and pays exactly once',async()=>{
    const account=await getBankAccountModel().create({companyId:fixture.companyId,branchId:fixture.branchId,name:'Bank',bankName:'Bank',iban:'BANK',status:'ACTIVE'});
    const order=await getPurchaseOrderModel().create({companyId:fixture.companyId,branchId:fixture.branchId,supplierId:'supplier',productId:fixture.productId,quantity:4,unitCost:2,total:8,status:'APROBADA'});
    const input={kind:'purchase-orders',sourceId:String(order._id),warehouseId:fixture.warehouseId,accountId:String(account._id),date:'2026-10-04'};
    const results=await Promise.allSettled([settleCommercial(fixture,input),settleCommercial(fixture,input)]);
    expect(results.some(r=>r.status==='fulfilled')).toBe(true);expect(await quantityAt(fixture.warehouseId)).toBe(14);
    expect((await getPurchaseOrderModel().findById(order._id))?.status).toBe('RECIBIDA');
    expect(await getCashMovementModel().countDocuments({companyId:fixture.companyId,type:'OUTFLOW',amount:8})).toBe(1);
    expect(await getSettlementModel().countDocuments({companyId:fixture.companyId,sourceId:String(order._id)})).toBe(1);
    expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,entityId:String(order._id),module:'compras'})).toBe(1);
    await expect(settleCommercial({...fixture,branchId:'foreign'},input)).rejects.toMatchObject({statusCode:409});
  });
  it('manual cash movement and audit commit together and roll back on audit failure', async()=>{
    const account=await getBankAccountModel().create({companyId:fixture.companyId,branchId:fixture.branchId,name:'Bank',bankName:'Bank',iban:'MANUAL',status:'ACTIVE'});
    const input={companyId:fixture.companyId,branchId:fixture.branchId,accountId:String(account._id),concept:'Manual cash',type:'INFLOW' as const,amount:12.34,date:'2026-10-04'};
    const row=await createAuditedCashMovement(input,{userId:fixture.userId});
    expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,entityId:row.id,module:'finanzas.movimientos'})).toBe(1);
    const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Manual audit failure'));
    try{await expect(createAuditedCashMovement({...input,concept:'Must roll back'},{userId:fixture.userId})).rejects.toThrow('Manual audit failure');}finally{spy.mockRestore();}
    expect(await getCashMovementModel().countDocuments({companyId:fixture.companyId})).toBe(1);
    await expect(createAuditedCashMovement({...input,branchId:'foreign'},{userId:fixture.userId})).rejects.toMatchObject({statusCode:400});
    expect(await getCashMovementModel().countDocuments({companyId:fixture.companyId})).toBe(1);
  });

  it('bank account creation rolls back on audit failure and prevents normalized duplicates',async()=>{
    const input={companyId:fixture.companyId,branchId:fixture.branchId,name:' Account ',bankName:' Bank ',iban:' test 12345 '};
    const row=await createAuditedBankAccount(input,{userId:fixture.userId});
    expect(row).toMatchObject({name:'Account',bankName:'Bank',iban:'TEST12345',status:'ACTIVE'});
    expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,entityId:row.id,module:'finanzas.cuentas'})).toBe(1);
    await expect(createAuditedBankAccount(input,{userId:fixture.userId})).rejects.toMatchObject({statusCode:409});
    const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Account audit failure'));
    try{await expect(createAuditedBankAccount({...input,iban:'ROLLBACK123'},{userId:fixture.userId})).rejects.toThrow('Account audit failure');}finally{spy.mockRestore();}
    expect(await getBankAccountModel().countDocuments({companyId:fixture.companyId})).toBe(1);
    expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'finanzas.cuentas'})).toBe(1);
    const other=await createAuditedBankAccount({...input,branchId:'other-branch'},{userId:fixture.userId});expect(other.branchId).toBe('other-branch');
  });

  it('commercial creation rejects foreign-branch contacts while accepting the company product catalog',async()=>{
    const contact={companyId:fixture.companyId,branchId:'foreign-branch',name:'Contact',taxId:'CONTACT123',email:'test@example.com',status:'ACTIVE'};
    const customer=await getCustomerModel().create(contact),supplier=await getSupplierModel().create(contact);
    const common={companyId:fixture.companyId,branchId:fixture.branchId,productId:fixture.productId,quantity:1};
    await expect(createSale({...common,customerId:String(customer._id)})).rejects.toMatchObject({statusCode:400});
    await expect(createPurchaseOrder({...common,supplierId:String(supplier._id),unitCost:2})).rejects.toMatchObject({statusCode:400});
    expect(await getSaleModel().countDocuments({companyId:fixture.companyId})).toBe(0);expect(await getPurchaseOrderModel().countDocuments({companyId:fixture.companyId})).toBe(0);
    await getCustomerModel().updateOne({_id:customer._id},{$set:{branchId:fixture.branchId}});
    await getSupplierModel().updateOne({_id:supplier._id},{$set:{branchId:fixture.branchId}});
    expect((await createSale({...common,customerId:String(customer._id)})).status).toBe('PENDIENTE');
    expect((await createPurchaseOrder({...common,supplierId:String(supplier._id),unitCost:2})).status).toBe('PENDIENTE');
  });

  it('commercial document creation commits audit and rolls back when audit storage fails',async()=>{
    const contact={companyId:fixture.companyId,branchId:fixture.branchId,name:'Atomic contact',taxId:'ATOMIC123',email:'test@example.com',status:'ACTIVE'};
    const customer=await getCustomerModel().create(contact),supplier=await getSupplierModel().create(contact);
    const common={companyId:fixture.companyId,branchId:fixture.branchId,productId:fixture.productId,quantity:1};
    const operations=[()=>createAuditedSale({...common,customerId:String(customer._id)},{userId:fixture.userId}),()=>createAuditedPurchaseOrder({...common,supplierId:String(supplier._id),unitCost:2},{userId:fixture.userId})];
    for(const operation of operations){
      const row=await operation();expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,entityId:row.id,action:'CREATE'})).toBe(1);
      const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Commercial audit failure'));
      try{await expect(operation()).rejects.toThrow('Commercial audit failure');}finally{spy.mockRestore();}
    }
    expect(await getSaleModel().countDocuments({companyId:fixture.companyId})).toBe(1);expect(await getPurchaseOrderModel().countDocuments({companyId:fixture.companyId})).toBe(1);
    expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,action:'CREATE'})).toBe(2);
  });

  it('manual commercial status rolls back audit failure and permits only one concurrent transition',async()=>{
    const initialStock=await getStockMovementModel().countDocuments({companyId:fixture.companyId});
    const sale=await getSaleModel().create({companyId:fixture.companyId,branchId:fixture.branchId,customerId:'customer',productId:fixture.productId,quantity:1,unitPrice:2,total:2,status:'PENDIENTE'});
    const order=await getPurchaseOrderModel().create({companyId:fixture.companyId,branchId:fixture.branchId,supplierId:'supplier',productId:fixture.productId,quantity:1,unitCost:2,total:2,status:'PENDIENTE'});
    const changes=[{model:getSaleModel(),id:String(sale._id),run:()=>updateAuditedSaleStatus(String(sale._id),fixture.companyId,fixture.branchId,'PENDIENTE','CANCELADA',{userId:fixture.userId})},{model:getPurchaseOrderModel(),id:String(order._id),run:()=>updateAuditedPurchaseOrderStatus(String(order._id),fixture.companyId,fixture.branchId,'PENDIENTE','APROBADA',{userId:fixture.userId})}];
    for(const change of changes){
      const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Status audit failure'));
      try{await expect(change.run()).rejects.toThrow('Status audit failure');}finally{spy.mockRestore();}
      expect((await change.model.findById(change.id))?.status).toBe('PENDIENTE');
      const results=await Promise.allSettled([change.run(),change.run()]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(results.find(r=>r.status==='rejected')).toMatchObject({reason:{statusCode:409}});
      expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,entityId:change.id,action:'UPDATE'})).toBe(1);
    }
    expect(await getStockMovementModel().countDocuments({companyId:fixture.companyId})).toBe(initialStock);expect(await getCashMovementModel().countDocuments({companyId:fixture.companyId})).toBe(0);
  });

  it('overflowing commercial totals create neither documents nor audit events',async()=>{
    const contact={companyId:fixture.companyId,branchId:fixture.branchId,name:'Amount contact',taxId:'AMOUNT123',email:'test@example.com',status:'ACTIVE'};
    const customer=await getCustomerModel().create(contact),supplier=await getSupplierModel().create(contact);
    const common={companyId:fixture.companyId,branchId:fixture.branchId,productId:fixture.productId,quantity:1e100};
    await expect(createAuditedSale({...common,customerId:String(customer._id)},{userId:fixture.userId})).rejects.toMatchObject({statusCode:400});
    await expect(createAuditedPurchaseOrder({...common,supplierId:String(supplier._id),unitCost:1e100},{userId:fixture.userId})).rejects.toMatchObject({statusCode:400});
    expect(await getSaleModel().countDocuments({companyId:fixture.companyId})).toBe(0);expect(await getPurchaseOrderModel().countDocuments({companyId:fixture.companyId})).toBe(0);expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId})).toBe(0);
  });

  it('manual stock audits commit with each movement and audit failure preserves balances',async()=>{
    for(const kind of ['RECEIPT','ISSUE','TRANSFER'] as const){
      const input={...movement('AUDITED-'+kind,1),...(kind==='TRANSFER'?{destinationWarehouseId:fixture.destinationWarehouseId}:{})};
      const initial=await quantityAt(fixture.warehouseId);
      const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Stock audit failure'));
      try{await expect(recordAuditedStock(input,kind)).rejects.toThrow('Stock audit failure');}finally{spy.mockRestore();}
      expect(await quantityAt(fixture.warehouseId)).toBe(initial);expect(await getStockMovementModel().countDocuments({companyId:fixture.companyId,reference:input.reference})).toBe(0);
      const row=await recordAuditedStock(input,kind);expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,entityId:row.id,module:'inventario.movimientos'})).toBe(1);
      await expect(recordAuditedStock(input,kind)).rejects.toMatchObject({statusCode:409});expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,entityId:row.id})).toBe(1);
    }
  });

  it('audit pages isolate tenants and traverse filtered events without duplicates',async()=>{
    const common={companyId:fixture.companyId,branchId:fixture.branchId,userId:fixture.userId,action:'CREATE',module:'ventas'};
    await getAuditEventModel().create([common,common,common,{...common,branchId:'foreign'},{...common,companyId:'foreign'},{...common,module:'compras'},{...common,action:'UPDATE'}]);
    const first=await pageAuditEventsForTenant(fixture.companyId,fixture.branchId,{limit:2,module:'ventas',action:'CREATE'});
    expect(first.items).toHaveLength(2);expect(first.nextCursor).toBeTruthy();
    const second=await pageAuditEventsForTenant(fixture.companyId,fixture.branchId,{limit:2,module:'ventas',action:'CREATE',cursor:first.nextCursor!});expect(second.items).toHaveLength(1);expect(second.nextCursor).toBeNull();
    expect(new Set([...first.items,...second.items].map(r=>r.id)).size).toBe(3);
    for(const row of [...first.items,...second.items])expect(row).toMatchObject({companyId:fixture.companyId,branchId:fixture.branchId,module:'ventas',action:'CREATE'});
  });

  it('employee pages filter active staff and isolate company and branch',async()=>{
    const common={companyId:fixture.companyId,branchId:fixture.branchId,departmentId:'department',fullName:'Ana Test',position:'Operations',status:'ACTIVE'};
    await getEmployeeModel().create([{...common,userId:'one'},{...common,userId:'two'},{...common,userId:'three'},{...common,userId:'inactive',status:'INACTIVE'},{...common,userId:'foreign-branch',branchId:'foreign'},{...common,userId:'foreign-company',companyId:'foreign'}]);
    const first=await pageEmployees(fixture.companyId,fixture.branchId,{limit:2,search:'Ana',status:'ACTIVE'});expect(first.items).toHaveLength(2);expect(first.nextCursor).toBeTruthy();
    const last=await pageEmployees(fixture.companyId,fixture.branchId,{limit:2,search:'Ana',status:'ACTIVE',cursor:first.nextCursor!});expect(last.items).toHaveLength(1);expect(last.nextCursor).toBeNull();expect(new Set([...first.items,...last.items].map(r=>r.id)).size).toBe(3);
    for(const row of [...first.items,...last.items])expect(row).toMatchObject({companyId:fixture.companyId,branchId:fixture.branchId,status:'ACTIVE'});
  });

  it('employee creation validates department scope and rolls back audit failures',async()=>{
    const user=await getUserModel().create({companyId:fixture.companyId,branchId:fixture.branchId,email:'employee-'+randomUUID()+'@example.test',passwordHash:'isolated-test-placeholder',name:'Test employee',roleId:'test',isActive:true});
    const departmentId='department-'+randomUUID();await getDepartmentModel().create({_id:departmentId,companyId:fixture.companyId,branchId:fixture.branchId,name:'Operations',code:'OPS',status:'ACTIVE'});
    const input={companyId:fixture.companyId,branchId:fixture.branchId,userId:String(user._id),departmentId,fullName:'Employee',position:'Operations'};
    for(const change of [{branchId:'foreign'},{status:'INACTIVE'}]){await getDepartmentModel().updateOne({_id:departmentId},{$set:change});await expect(createAuditedEmployee(input,{userId:fixture.userId})).rejects.toMatchObject({statusCode:400});await getDepartmentModel().updateOne({_id:departmentId},{$set:{branchId:fixture.branchId,status:'ACTIVE'}});}
    const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Employee audit failure'));
    try{await expect(createAuditedEmployee(input,{userId:fixture.userId})).rejects.toThrow('Employee audit failure');}finally{spy.mockRestore();}
    expect(await getEmployeeModel().countDocuments({companyId:fixture.companyId})).toBe(0);
    const row=await createAuditedEmployee(input,{userId:fixture.userId});expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,entityId:row.id,module:'rrhh'})).toBe(1);
    await expect(createAuditedEmployee(input,{userId:fixture.userId})).rejects.toMatchObject({statusCode:409});expect(await getEmployeeModel().countDocuments({companyId:fixture.companyId})).toBe(1);
  });

  it('employee selectors return active scoped records and omit credentials and permissions',async()=>{
    const companyId=fixture.companyId,branchId=fixture.branchId;
    for(const [i,active,branch] of [[1,true,branchId],[2,true,branchId],[3,false,branchId],[4,true,'foreign']] as const)await getUserModel().create({companyId,branchId:branch,email:randomUUID()+'@example.test',passwordHash:'test-only-placeholder',name:'Selector '+i,roleId:'test',permissions:['secret'],isActive:active});
    const first=await pageEmployeeOptions(companyId,branchId,'users',{limit:1,search:'Selector'});expect(first.items).toHaveLength(1);expect(first.nextCursor).toBeTruthy();
    const next=await pageEmployeeOptions(companyId,branchId,'users',{limit:1,search:'Selector',cursor:first.nextCursor!});expect(next.items).toHaveLength(1);expect(next.nextCursor).toBeNull();
    for(const row of [...first.items,...next.items]){expect(row).not.toHaveProperty('passwordHash');expect(row).not.toHaveProperty('permissions');expect(row).not.toHaveProperty('email');expect(row).toMatchObject({companyId,branchId,isActive:true});}
    await getDepartmentModel().create([{_id:'department-a-'+randomUUID(),companyId,branchId,name:'Selector active',code:'A',status:'ACTIVE'},{_id:'department-b-'+randomUUID(),companyId,branchId,name:'Selector inactive',code:'B',status:'INACTIVE'}]);
    expect((await pageEmployeeOptions(companyId,branchId,'departments',{limit:20,search:'Selector'})).items).toHaveLength(1);
  });

});
