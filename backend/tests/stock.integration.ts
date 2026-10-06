import {editRiskDetails} from '../src/modules/riskManagement/riskAdministration.js';
import {getCompanyModel} from '../src/modules/empresas/models/Company.js';
import {saveOrganization,pageCompanyBranches,readCurrentCompany} from '../src/modules/empresas/organizationAdministration.js';
import {pageCompanyRoles} from '../src/modules/roles/rolePagination.js';
import {changeRoleStatus} from '../src/modules/roles/roleStatusService.js';
import {updateAuditedRole,createAuditedRole,listRolesForCompany,findAssignableRole} from '../src/modules/roles/roleService.js';
import {getRoleModel} from '../src/modules/roles/models/Role.js';
import {administerCompliance,pageCompliance,complianceSummary} from '../src/modules/compliance/complianceAdministration.js';
import {getComplianceControlModel} from '../src/modules/compliance/models/ComplianceControl.js';
import {administerRisk,pageRisks,riskSummary} from '../src/modules/riskManagement/riskAdministration.js';
import {getRiskRecordModel} from '../src/modules/riskManagement/models/RiskRecord.js';
import {administerTicket,pageTickets,ticketSummary} from '../src/modules/serviceDesk/ticketAdministration.js';
import {getSupportTicketModel} from '../src/modules/serviceDesk/models/SupportTicket.js';
import {administerAsset,pageAssets,assetSummary} from '../src/modules/assetManagement/assetAdministration.js';
import {getManagedAssetModel} from '../src/modules/assetManagement/models/ManagedAsset.js';
import {administerQuality,qualitySummary,pageQuality} from '../src/modules/calidad/qualityAdministration.js';
import {getQualityInspectionModel} from '../src/modules/calidad/models/QualityInspection.js';
import {administerMaintenance,pageMaintenance,maintenanceSummary} from '../src/modules/mantenimiento/maintenanceAdministration.js';
import {getMaintenanceOrderModel} from '../src/modules/mantenimiento/models/MaintenanceOrder.js';
import {administerShipment,pageShipments} from '../src/modules/logistica/shipmentAdministration.js';
import {getShipmentModel} from '../src/modules/logistica/models/Shipment.js';
import { administerOpportunity, pageOpportunities } from '../src/modules/crm/opportunityAdministration.js';
import { getOpportunityModel } from '../src/modules/crm/models/Opportunity.js';
import { createAuditedInvoice, cancelInvoiceDraft, pageInvoices, invoiceSaleOptions } from '../src/modules/facturacion/invoiceService.js';
import { getInvoiceModel } from '../src/modules/facturacion/models/Invoice.js';
import {administerProduction,pageProductionOrders} from '../src/modules/produccion/productionAdministration.js';
import {getProductionOrderModel} from '../src/modules/produccion/models/ProductionOrder.js';
import {saveAuditedProject,pageProjects,pageProjectCustomers} from '../src/modules/proyectos/projectAdministration.js';
import {getProjectModel} from '../src/modules/proyectos/models/Project.js';
import {updateUserAccess} from '../src/modules/usuarios/userAccessService.js';
import {authenticate} from '../src/middleware/authenticate.js';
import {signToken} from '../src/security/jwt.js';
import {renameAuditedUser} from '../src/modules/usuarios/userRepositoryMongo.js';
import {createAuditedUserInMongo} from '../src/modules/usuarios/userRepositoryMongo.js';
import {resolveRolePermissions} from '../src/modules/roles/roleService.js';
import {pageUsersForTenantMongo} from '../src/modules/usuarios/userRepositoryMongo.js';
import {updateAuditedDepartment,pageDepartments} from '../src/modules/empresas/departmentService.js';
import {updateAuditedEmployeeDepartment} from '../src/modules/recursos-humanos/employeeService.js';
import {pageNotifications,markNotificationRead} from '../src/modules/notificaciones/notificationService.js';
import {getNotificationModel} from '../src/modules/notificaciones/models/Notification.js';
import {requestEmailVerification,confirmEmailVerification,verificationDigest} from '../src/modules/auth/emailVerification.js';
import {updateAuditedEmployeeStatus} from '../src/modules/recursos-humanos/employeeService.js';
import {updateAuditedEmployee} from '../src/modules/recursos-humanos/employeeService.js';
import {createAuditedDepartment} from '../src/modules/empresas/departmentService.js';
import {getBranchModel} from '../src/modules/empresas/models/Branch.js';
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

vi.hoisted(()=>{process.env.JWT_SECRET ||= 'local-integration-only-secret-0123456789abcdef0123456789abcdef0123456789abcdef';});
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
  it('inbox pagination isolates the owner and keeps pending delivery untouched in MongoDB',async()=>{
    const {companyId,branchId}=fixture,model=getNotificationModel();
    const make=(userId:string,scope=branchId,channel='IN_APP',status='SENT')=>({companyId,branchId:scope,userId,title:'Notice',message:'Local test',channel,status});
    const own=await model.create(Array.from({length:25},()=>make('owner')));
    const [foreign,external]=await model.create([make('other'),make('owner',branchId,'EMAIL','PENDING'),make('owner','foreign')]);
    const first=await pageNotifications(companyId,branchId,'owner',{limit:20});
    const second=await pageNotifications(companyId,branchId,'owner',{limit:20,cursor:first.nextCursor!});
    expect(first.items).toHaveLength(20);expect(second.items).toHaveLength(5);expect(second.nextCursor).toBe(null);
    expect(new Set([...first.items,...second.items].map(n=>n.id)).size).toBe(25);
    await expect(markNotificationRead(companyId,branchId,'owner',String(foreign._id))).rejects.toMatchObject({statusCode:404});
    await expect(markNotificationRead(companyId,branchId,'owner',String(external._id))).rejects.toMatchObject({statusCode:404});
    await Promise.all([markNotificationRead(companyId,branchId,'owner',String(own[0]._id)),markNotificationRead(companyId,branchId,'owner',String(own[0]._id))]);
    expect((await pageNotifications(companyId,branchId,'owner',{limit:20,status:'READ'})).items.map(n=>n.id)).toEqual([String(own[0]._id)]);
    expect((await model.findById(external._id).lean())?.status).toBe('PENDING');
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

  it('department creation commits audit together and rolls back audit failures',async()=>{
    const {companyId,branchId,userId}=fixture;
    await getBranchModel().create({_id:branchId,companyId,name:'Local test branch',code:'TEST',city:'Test',isActive:true});
    const input={companyId,branchId,name:' Operations ',code:' ops '};
    const audit=getAuditEventModel();const failure=vi.spyOn(audit,'create').mockRejectedValueOnce(new Error('audit failure'));
    try{await expect(createAuditedDepartment(input,{userId})).rejects.toThrow('audit failure');}finally{failure.mockRestore();}
    expect(await getDepartmentModel().countDocuments({companyId,branchId})).toBe(0);
    const row=await createAuditedDepartment(input,{userId});expect(row).toMatchObject({companyId,branchId,name:'Operations',code:'OPS',status:'ACTIVE'});
    expect(await audit.countDocuments({companyId,branchId,userId,module:'empresas.departamentos',entityId:row.id,action:'CREATE'})).toBe(1);
    await expect(createAuditedDepartment(input,{userId})).rejects.toMatchObject({statusCode:409});
    expect(await audit.countDocuments({companyId,branchId,module:'empresas.departamentos'})).toBe(1);
    await expect(createAuditedDepartment({...input,companyId:'foreign'},{userId})).rejects.toMatchObject({statusCode:400});
    await getBranchModel().updateOne({_id:branchId},{$set:{isActive:false}});
    await expect(createAuditedDepartment({...input,code:'OTHER'},{userId})).rejects.toMatchObject({statusCode:400});
  });

  it('employee edits use original values and roll back when audit fails',async()=>{
    const {companyId,branchId,userId}=fixture;
    const employee=await getEmployeeModel().create({companyId,branchId,userId:'linked-user',departmentId:'dept',fullName:'Original Name',position:'Original Role',status:'ACTIVE'});
    const input={companyId,branchId,id:String(employee._id),fullName:'Updated Name',position:'Updated Role',expected:{fullName:'Original Name',position:'Original Role'}};
    const audit=getAuditEventModel(),failure=vi.spyOn(audit,'create').mockRejectedValueOnce(new Error('audit failure'));
    try{await expect(updateAuditedEmployee(input,{userId})).rejects.toThrow('audit failure');}finally{failure.mockRestore();}
    expect(await getEmployeeModel().findById(employee._id).lean()).toMatchObject(input.expected);
    await expect(updateAuditedEmployee({...input,branchId:'foreign'},{userId})).rejects.toMatchObject({statusCode:409});
    const results=await Promise.allSettled([updateAuditedEmployee(input,{userId}),updateAuditedEmployee({...input,fullName:'Concurrent Name'},{userId})]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(results.filter(r=>r.status==='rejected')).toHaveLength(1);
    expect(await audit.countDocuments({companyId,branchId,module:'rrhh',action:'UPDATE',entityId:String(employee._id)})).toBe(1);
    expect(await getEmployeeModel().findById(employee._id).lean()).toMatchObject({userId:'linked-user',departmentId:'dept',status:'ACTIVE'});
  });

  it('employee activation validates links and status audit rolls back and serializes transitions',async()=>{
   const {companyId,branchId,userId}=fixture;
   const user=await getUserModel().create({companyId,branchId,email:randomUUID()+'@example.test',passwordHash:'test-only-placeholder',name:'Employee',roleId:'test',permissions:[],isActive:true});
   const departmentId='department-'+randomUUID();await getDepartmentModel().create({_id:departmentId,companyId,branchId,name:'Operations',code:'OPS',status:'ACTIVE'});
   const employee=await getEmployeeModel().create({companyId,branchId,userId:String(user._id),departmentId,fullName:'Test Employee',position:'Operations',status:'ACTIVE'});
   const input={companyId,branchId,id:String(employee._id),status:'INACTIVE' as const,expectedStatus:'ACTIVE' as const};const audit=getAuditEventModel();
   const failure=vi.spyOn(audit,'create').mockRejectedValueOnce(new Error('audit failure'));
   try{await expect(updateAuditedEmployeeStatus(input,{userId})).rejects.toThrow('audit failure');}finally{failure.mockRestore();}
   expect((await getEmployeeModel().findById(employee._id).lean())?.status).toBe('ACTIVE');
   const results=await Promise.allSettled([updateAuditedEmployeeStatus(input,{userId}),updateAuditedEmployeeStatus(input,{userId})]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
   expect(await audit.countDocuments({companyId,branchId,module:'rrhh',entityId:String(employee._id)})).toBe(1);
   const activate={...input,status:'ACTIVE' as const,expectedStatus:'INACTIVE' as const};
   await getUserModel().updateOne({_id:user._id},{$set:{isActive:false}});await expect(updateAuditedEmployeeStatus(activate,{userId})).rejects.toMatchObject({statusCode:400});await getUserModel().updateOne({_id:user._id},{$set:{isActive:true}});
   await getDepartmentModel().updateOne({_id:departmentId},{$set:{status:'INACTIVE'}});await expect(updateAuditedEmployeeStatus(activate,{userId})).rejects.toMatchObject({statusCode:400});await getDepartmentModel().updateOne({_id:departmentId},{$set:{status:'ACTIVE'}});
   await expect(updateAuditedEmployeeStatus({...activate,branchId:'foreign'},{userId})).rejects.toMatchObject({statusCode:409});
   expect(await updateAuditedEmployeeStatus(activate,{userId})).toMatchObject({status:'ACTIVE',userId:String(user._id),departmentId,fullName:'Test Employee'});
   expect((await getUserModel().findById(user._id).lean())?.isActive).toBe(true);
  });

 it('email verification uses hashed expiring single-use tokens and persistent cooldown',async()=>{
  const {companyId,branchId}=fixture;const user=await getUserModel().create({companyId,branchId,email:randomUUID()+'@example.test',passwordHash:'test-only-placeholder',name:'Verify User',roleId:'test',permissions:[],isActive:true});
  const scope={id:String(user._id),companyId,branchId},config={apiKey:'test-key',from:'onboarding@resend.dev',baseUrl:'https://example.test/api/v1'};
  let token='';const send=vi.fn(async(_config:any,input:any)=>{token=new URL(input.text.match(/https:\/\/[^\s]+/)[0]).searchParams.get('token')!;expect(input.to).toBe(user.email);return {id:'test-message'};});
  expect(await requestEmailVerification(scope,config,send)).toEqual({status:'sent'});expect(token).toMatch(/^[a-f0-9]{64}$/);
  const stored=await getUserModel().findById(user._id).select('+emailVerificationHash +emailVerificationExpiresAt').lean();expect(stored?.emailVerificationHash).toBe(verificationDigest(token));expect(stored?.emailVerificationHash).not.toBe(token);expect((stored?.emailVerificationExpiresAt?.getTime()??0)-Date.now()).toBeLessThanOrEqual(15*60000);
  expect(await getUserModel().findById(user._id).lean()).not.toHaveProperty('emailVerificationHash');
  await expect(requestEmailVerification(scope,config,send)).rejects.toMatchObject({statusCode:429});expect(send).toHaveBeenCalledTimes(1);
  await getUserModel().updateOne({_id:user._id},{$set:{email:'changed@example.test'}});await expect(confirmEmailVerification(token)).rejects.toMatchObject({statusCode:400});await getUserModel().updateOne({_id:user._id},{$set:{email:user.email,emailVerificationExpiresAt:new Date(0)}});await expect(confirmEmailVerification(token)).rejects.toMatchObject({statusCode:400});
  await getUserModel().updateOne({_id:user._id},{$set:{emailVerificationExpiresAt:new Date(Date.now()+60000)}});
  const results=await Promise.allSettled([confirmEmailVerification(token),confirmEmailVerification(token)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((await getUserModel().findById(user._id).lean())?.emailVerifiedAt).toBeInstanceOf(Date);
  await expect(confirmEmailVerification(token)).rejects.toMatchObject({statusCode:400});expect(await requestEmailVerification(scope,config,send)).toEqual({status:'verified'});
 });
 it('failed verification delivery removes usable tokens without exposing them',async()=>{
  const {companyId,branchId}=fixture;const user=await getUserModel().create({companyId,branchId,email:randomUUID()+'@example.test',passwordHash:'test-only-placeholder',name:'Verify User',roleId:'test',permissions:[],isActive:true});
  const scope={id:String(user._id),companyId,branchId},config={apiKey:'test-key',from:'onboarding@resend.dev',baseUrl:'https://example.test/api/v1'},send=vi.fn().mockRejectedValue(new Error('mock delivery failure'));
  await expect(requestEmailVerification({...scope,branchId:'foreign'},config,send)).rejects.toMatchObject({statusCode:401});expect(send).not.toHaveBeenCalled();
  await expect(requestEmailVerification(scope,config,send)).rejects.toThrow('mock delivery failure');expect(await getUserModel().findById(user._id).select('+emailVerificationHash').lean()).not.toHaveProperty('emailVerificationHash');
 });

 it('employee department reassignment is scoped, audited, rollback-safe and concurrent-safe',async()=>{
  const {companyId,branchId,userId}=fixture,departments=getDepartmentModel(),employees=getEmployeeModel(),audit=getAuditEventModel();
  const prefix=randomUUID();const [target,other,inactive,foreign]=await departments.create([
   {_id:prefix+'-target',companyId,branchId,name:'Target',code:'TARGET'},
   {_id:prefix+'-other',companyId,branchId,name:'Other',code:'OTHER'},
   {_id:prefix+'-inactive',companyId,branchId,name:'Inactive',code:'INACTIVE',status:'INACTIVE'},
   {_id:prefix+'-foreign',companyId,branchId:'foreign',name:'Foreign',code:'FOREIGN'}]);
  const employee=await employees.create({companyId,branchId,userId:'linked',departmentId:'original',fullName:'Employee Name',position:'Role',status:'ACTIVE'});
  const input={companyId,branchId,id:String(employee._id),departmentId:target._id,expectedDepartmentId:'original',expectedStatus:'ACTIVE' as const};
  for(const departmentId of [inactive._id,foreign._id,'missing'])await expect(updateAuditedEmployeeDepartment({...input,departmentId},{userId})).rejects.toMatchObject({statusCode:400});
  await expect(updateAuditedEmployeeDepartment({...input,expectedStatus:'INACTIVE'},{userId})).rejects.toMatchObject({statusCode:409});
  const fail=vi.spyOn(audit,'create').mockRejectedValueOnce(new Error('audit failure'));
  try{await expect(updateAuditedEmployeeDepartment(input,{userId})).rejects.toThrow('audit failure');}finally{fail.mockRestore();}
  expect((await employees.findById(employee._id).lean())?.departmentId).toBe('original');
  const results=await Promise.allSettled([updateAuditedEmployeeDepartment(input,{userId}),updateAuditedEmployeeDepartment({...input,departmentId:other._id},{userId})]);
  expect(results.filter(x=>x.status==='fulfilled')).toHaveLength(1);expect(results.filter(x=>x.status==='rejected')).toHaveLength(1);
  expect(await audit.countDocuments({companyId,branchId,module:'rrhh',entityId:String(employee._id)})).toBe(1);
  expect(await employees.findById(employee._id).lean()).toMatchObject({userId:'linked',fullName:'Employee Name',position:'Role',status:'ACTIVE'});
 });

 it('department administration preserves active employees, unique codes and audit atomicity',async()=>{
  const {companyId,branchId,userId}=fixture;await getBranchModel().create({_id:branchId,companyId,name:'Local branch',city:'Test City',code:'LOCAL',isActive:true});
  const model=getDepartmentModel(),audit=getAuditEventModel();const id='dept-'+randomUUID();
  await model.create([{_id:id,companyId,branchId,name:'Original A+B',code:'OLD'}, {_id:id+'-duplicate',companyId,branchId,name:'Duplicate',code:'TAKEN'}]);
  const input={companyId,branchId,id,name:'Updated',code:'NEW',status:'ACTIVE' as const,expected:{name:'Original A+B',code:'OLD',status:'ACTIVE' as const}};
  const failure=vi.spyOn(audit,'create').mockRejectedValueOnce(new Error('audit failure'));
  try{await expect(updateAuditedDepartment(input,{userId})).rejects.toThrow('audit failure');}finally{failure.mockRestore();}
  expect(await model.findById(id).lean()).toMatchObject(input.expected);
  await expect(updateAuditedDepartment({...input,code:'TAKEN'},{userId})).rejects.toMatchObject({statusCode:409});
  const employee=await getEmployeeModel().create({companyId,branchId,userId:'linked',departmentId:id,fullName:'Employee',position:'Role',status:'ACTIVE'});
  await expect(updateAuditedDepartment({...input,status:'INACTIVE'},{userId})).rejects.toMatchObject({statusCode:409});
  expect(await model.findById(id).lean()).toMatchObject(input.expected);
  expect((await pageDepartments(companyId,branchId,{search:'A+B',limit:20})).items.map(x=>x.id)).toEqual([id]);
  expect((await pageDepartments(companyId,branchId,{search:'.*',limit:20})).items).toHaveLength(0);
  await getEmployeeModel().updateOne({_id:employee._id},{$set:{status:'INACTIVE'}});
  const saved=await updateAuditedDepartment({...input,status:'INACTIVE'},{userId});expect(saved).toMatchObject({name:'Updated',code:'NEW',status:'INACTIVE'});expect(saved).not.toHaveProperty('assignmentRevision');
  await expect(updateAuditedDepartment(input,{userId})).rejects.toMatchObject({statusCode:409});
  expect(await audit.countDocuments({companyId,branchId,entityId:id})).toBe(1);
 });
 it('department deactivation racing employee reassignment cannot leave an active employee in an inactive department',async()=>{
  const {companyId,branchId,userId}=fixture;await getBranchModel().create({_id:branchId,companyId,name:'Race branch',city:'Test City',code:'RACE',isActive:true});
  const id='dept-'+randomUUID();await getDepartmentModel().create({_id:id,companyId,branchId,name:'Target',code:'TARGET'});
  const employee=await getEmployeeModel().create({companyId,branchId,userId:'linked',departmentId:'original',fullName:'Employee',position:'Role',status:'ACTIVE'});
  const results=await Promise.allSettled([
   updateAuditedDepartment({companyId,branchId,id,name:'Target',code:'TARGET',status:'INACTIVE',expected:{name:'Target',code:'TARGET',status:'ACTIVE'}},{userId}),
   updateAuditedEmployeeDepartment({companyId,branchId,id:String(employee._id),departmentId:id,expectedDepartmentId:'original',expectedStatus:'ACTIVE'},{userId})]);
  expect(results.filter(x=>x.status==='fulfilled')).toHaveLength(1);
  const current=await getEmployeeModel().findById(employee._id).lean(),department=await getDepartmentModel().findById(id).lean();
  expect(current?.departmentId===id&&department?.status==='INACTIVE').toBe(false);
  expect(await getAuditEventModel().countDocuments({companyId,branchId,entityId:{$in:[id,String(employee._id)]}})).toBe(1);
 });

 it('user directory pages isolate scope, filter literal searches and exclude verification secrets',async()=>{
  const {companyId,branchId}=fixture;const User=getUserModel();
  const users=Array.from({length:23},(_,i)=>({name:'Directory A+B '+i,email:`directory-${companyId}-${i}@example.com`,companyId,branchId,roleId:'role-sales',permissions:['usuarios.ver'],isActive:true,passwordHash:'private-hash',emailVerificationHash:'private-token'}));
  await User.create([...users,{...users[0],email:`inactive-${companyId}@example.com`,isActive:false},{...users[0],email:`foreign-${companyId}@example.com`,branchId:'foreign'}]);
  const first=await pageUsersForTenantMongo(companyId,branchId,{search:'A+B',status:'ACTIVE',limit:20});
  expect(first.items).toHaveLength(20);expect(first.nextCursor).toBeTruthy();
  const second=await pageUsersForTenantMongo(companyId,branchId,{search:'A+B',status:'ACTIVE',limit:20,cursor:first.nextCursor!});
  expect(second.items).toHaveLength(3);expect(second.nextCursor).toBeNull();
  expect(new Set([...first.items,...second.items].map(row=>row.id)).size).toBe(23);
  for(const row of [...first.items,...second.items]){expect(row.branchId).toBe(branchId);expect(row).not.toHaveProperty('passwordHash');expect(row).not.toHaveProperty('emailVerificationHash');}
  expect((await pageUsersForTenantMongo(companyId,branchId,{search:'.*',limit:20})).items).toHaveLength(0);
  expect((await pageUsersForTenantMongo(companyId,branchId,{search:'A+B',status:'INACTIVE',limit:20})).items).toHaveLength(1);
 });

 it('user creation commits with audit, rejects elevated permissions and rolls back audit failures',async()=>{
  const {companyId,branchId,userId}=fixture;
  const input={companyId,branchId,name:'New directory user',email:`new-${companyId}@example.com`,password:'LocalTestPassword123!',roleId:'role-consulta-demo',actorPermissions:resolveRolePermissions('CONSULTA')};
  await expect(createAuditedUserInMongo({...input,actorPermissions:['usuarios.crear']},{userId})).rejects.toMatchObject({statusCode:403});
  expect(await getUserModel().countDocuments({email:input.email})).toBe(0);
  const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('User audit unavailable'));
  try{await expect(createAuditedUserInMongo(input,{userId})).rejects.toThrow('User audit unavailable');}finally{spy.mockRestore();}
  expect(await getUserModel().countDocuments({email:input.email})).toBe(0);
  const created=await createAuditedUserInMongo(input,{userId});expect(created).not.toHaveProperty('passwordHash');expect(created).not.toHaveProperty('password');
  const stored=await getUserModel().findById(created.id).select('+passwordHash').lean();expect(stored?.passwordHash).not.toBe(input.password);expect(stored?.permissions).toEqual(input.actorPermissions);
  const audit=await getAuditEventModel().findOne({companyId,branchId,module:'usuarios',entityId:created.id}).lean();expect(audit?.details).toEqual({roleId:input.roleId});expect(JSON.stringify(audit)).not.toContain(input.password);
  await expect(createAuditedUserInMongo(input,{userId})).rejects.toMatchObject({statusCode:409});expect(await getAuditEventModel().countDocuments({companyId,branchId,module:'usuarios',entityId:created.id})).toBe(1);
 });

 it('user rename preserves credentials and permissions, rejects stale names and rolls back audit errors',async()=>{
 const {companyId,branchId,userId}=fixture;const User=getUserModel();const row=await User.create({companyId,branchId,name:'Original user',email:`rename-${companyId}@example.com`,passwordHash:'preserved-hash',roleId:'role-sales',permissions:['ventas.ver'],isActive:true,emailVerificationHash:'preserved-token'});
 const input={companyId,branchId,id:String(row._id),name:'Renamed user',expectedName:'Original user'};
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Rename audit unavailable'));
 try{await expect(renameAuditedUser(input,{userId})).rejects.toThrow('Rename audit unavailable');}finally{spy.mockRestore();}
 expect((await User.findById(row._id).lean())?.name).toBe('Original user');
 await expect(renameAuditedUser({...input,branchId:'foreign'},{userId})).rejects.toMatchObject({statusCode:409});
 const updated=await renameAuditedUser(input,{userId});expect(updated.name).toBe('Renamed user');expect(updated.email).toBe(row.email);expect(updated.permissions).toEqual(['ventas.ver']);expect(updated).not.toHaveProperty('passwordHash');expect(updated).not.toHaveProperty('emailVerificationHash');
 const stored=await User.findById(row._id).select('+passwordHash +emailVerificationHash').lean();expect(stored?.passwordHash).toBe('preserved-hash');expect(stored?.emailVerificationHash).toBe('preserved-token');
 await expect(renameAuditedUser(input,{userId})).rejects.toMatchObject({statusCode:409});expect(await getAuditEventModel().countDocuments({companyId,branchId,module:'usuarios',entityId:input.id})).toBe(1);
 });

 it('access changes revoke sessions atomically, protect self and permissions, and preserve credentials',async()=>{
 const {companyId,branchId}=fixture;const User=getUserModel();const user=await User.create({companyId,branchId,name:'Access Test',email:`access-${companyId}@example.com`,passwordHash:'unchanged',roleId:'role-consulta-demo',permissions:resolveRolePermissions('CONSULTA'),isActive:true});
 const actor={userId:'000000000000000000000001',permissions:[...new Set([...resolveRolePermissions('CONSULTA'),...resolveRolePermissions('VENTAS')])]};const expected={roleId:user.roleId,isActive:true,permissions:[...user.permissions]};const input={id:String(user._id),companyId,branchId,expected,change:{isActive:false}};
 const token=signToken({sub:String(user._id),companyId,branchId,sessionVersion:0});
 const check=async(t:string)=>{const req:any={headers:{authorization:'Bearer '+t}},next=vi.fn();await authenticate(req,{} as any,next);return next.mock.calls[0][0];};expect(await check(token)).toBeUndefined();
 await expect(updateUserAccess(input,{...actor,userId:input.id})).rejects.toMatchObject({statusCode:400});
 await expect(updateUserAccess({...input,change:{roleId:'role-admin-demo'}},actor)).rejects.toMatchObject({statusCode:403});
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Access audit unavailable'));
 try{await expect(updateUserAccess(input,actor)).rejects.toThrow('Access audit unavailable');}finally{spy.mockRestore();}
 expect(await check(token)).toBeUndefined();const disabled=await updateUserAccess(input,actor);expect(disabled.isActive).toBe(false);expect(disabled).not.toHaveProperty('sessionVersion');expect(await check(token)).toMatchObject({statusCode:401});
 await expect(updateUserAccess(input,actor)).rejects.toMatchObject({statusCode:409});
 await updateUserAccess({...input,expected:{...expected,isActive:false},change:{isActive:true}},actor);expect(await check(token)).toMatchObject({statusCode:401});
 const fresh=signToken({sub:input.id,companyId,branchId,sessionVersion:2});expect(await check(fresh)).toBeUndefined();
 const roleChanged=await updateUserAccess({...input,change:{roleId:'role-ventas-demo'}},actor);expect(roleChanged.roleId).toBe('role-ventas-demo');expect(await check(fresh)).toMatchObject({statusCode:401});
 const stored=await User.findById(input.id).select('+passwordHash +sessionVersion').lean();expect(stored?.passwordHash).toBe('unchanged');expect(stored?.sessionVersion).toBe(3);expect(await getAuditEventModel().countDocuments({companyId,branchId,module:'usuarios',entityId:input.id})).toBe(3);
 });

 it('project create and edits are scoped, audited, validated and protected from stale snapshots',async()=>{
 const scope=fixture;const customer=await getCustomerModel().create({companyId:scope.companyId,branchId:scope.branchId,name:'Project client',taxId:'PROJECTCLIENT',email:'client@example.com',status:'ACTIVE'});const input={customerId:String(customer._id),name:'Project A+B',startDate:'2026-10-01',endDate:'2026-12-31'};
 await expect(saveAuditedProject({...scope,branchId:'foreign'},input)).rejects.toMatchObject({statusCode:400});await expect(saveAuditedProject(scope,{...input,endDate:'2026-02-30'})).rejects.toMatchObject({statusCode:400});
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Project audit unavailable'));try{await expect(saveAuditedProject(scope,input)).rejects.toThrow('Project audit unavailable');}finally{spy.mockRestore();}expect(await getProjectModel().countDocuments({companyId:scope.companyId})).toBe(0);
 const row=await saveAuditedProject(scope,input);const expected={name:row.name,startDate:row.startDate,endDate:row.endDate,status:row.status,progress:row.progress};const edit={name:'Updated project',startDate:row.startDate,endDate:row.endDate,status:'PAUSED',progress:40,expected};
 await expect(saveAuditedProject(scope,{...edit,status:'CLOSED'},row.id)).rejects.toMatchObject({statusCode:400});const updated=await saveAuditedProject(scope,edit,row.id);expect(updated.progress).toBe(40);expect(updated.customerId).toBe(row.customerId);await expect(saveAuditedProject(scope,edit,row.id)).rejects.toMatchObject({statusCode:409});
 const next={name:updated.name,startDate:updated.startDate,endDate:updated.endDate,status:updated.status,progress:updated.progress};const closed=await saveAuditedProject(scope,{...next,status:'CLOSED',progress:100,expected:next},row.id);expect(closed.status).toBe('CLOSED');expect(await getAuditEventModel().countDocuments({companyId:scope.companyId,module:'proyectos',entityId:row.id})).toBe(3);
 expect((await pageProjects(scope,{search:'Updated',status:'CLOSED',limit:20})).items).toHaveLength(1);expect((await pageProjects({...scope,branchId:'foreign'},{search:'',limit:20})).items).toHaveLength(0);expect((await pageProjects(scope,{search:'.*',limit:20})).items).toHaveLength(0);
 expect((await pageProjects(scope,{search:'',limit:20})).items[0].customerName).toBe('Project client');
 const options=await pageProjectCustomers(scope,{search:'',limit:20});expect(options.items.map(x=>x.id)).toContain(String(customer._id));expect((await pageProjectCustomers({...scope,branchId:'foreign'},{search:'',limit:20})).items).toHaveLength(0);
 await getCustomerModel().updateOne({_id:customer._id},{$set:{branchId:'foreign'}});expect((await pageProjects(scope,{search:'',limit:20})).items[0].customerName).toBeUndefined();
 });

 it('legacy completed production remains readable without an invented delivery history',async()=>{
 const scope=fixture;await getProductionOrderModel().create({companyId:scope.companyId,branchId:scope.branchId,productId:scope.productId,plannedQuantity:2,completedQuantity:2,status:'completed'});
 const page=await pageProductionOrders(scope,{limit:20,status:'completed'});expect(page.items).toHaveLength(1);expect(page.items[0].completedQuantity).toBe(2);expect(page.items[0].deliveries).toBeUndefined();
 });
 it('partial production preserves exact consumption, rejects stale progress and rolls back failed deliveries',async()=>{
 const scope=fixture;const finished=await getProductModel().findById(scope.productId).lean();const {_id,__v,...fields}=finished!;const product=await getProductModel().create({...fields,sku:'PARTIAL-FINISHED',name:'Partial finished'});
 await receiveStock(movement('PARTIAL-MATERIAL-SEED',1));const baseline=await quantityAt(scope.warehouseId);
 const order=await administerProduction(scope,'create',{productId:String(product._id),plannedQuantity:3,materials:[{productId:scope.productId,warehouseId:scope.warehouseId,quantity:1}]});let current=await administerProduction(scope,'state',{expectedStatus:'planned',status:'running'},order.id);
 const payload=()=>({warehouseId:scope.warehouseId,expectedQuantity:3,deliveredQuantity:1,expectedCompletedQuantity:current.completedQuantity,expectedUpdatedAt:current.updatedAt.toISOString(),cost:0.1,currency:'MXN'});const first=payload();
 const races=await Promise.allSettled([administerProduction(scope,'complete',first,order.id),administerProduction(scope,'complete',first,order.id)]);expect(races.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 current=(await administerProductionResult());expect(current.status).toBe('running');expect(current.completedQuantity).toBe(1);expect(current.materials?.[0].consumedQuantity).toBe(0.333333);expect(current.deliveries).toHaveLength(1);expect(current.productionCost).toBe(0.1);expect(current.costCurrency).toBe('MXN');
 await expect(administerProduction(scope,'complete',{...payload(),currency:'USD'},order.id)).rejects.toMatchObject({statusCode:400});await expect(administerProduction(scope,'complete',{...payload(),cost:0.001},order.id)).rejects.toMatchObject({statusCode:400});
 await expect(administerProduction(scope,'complete',first,order.id)).rejects.toMatchObject({statusCode:409});await expect(administerProduction(scope,'complete',{warehouseId:scope.warehouseId,expectedQuantity:3},order.id)).rejects.toMatchObject({statusCode:409});await expect(administerProduction(scope,'state',{expectedStatus:'running',status:'cancelled'},order.id)).rejects.toMatchObject({statusCode:409});
 const before=await quantityAt(scope.warehouseId);const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Partial audit failed'));try{await expect(administerProduction(scope,'complete',payload(),order.id)).rejects.toThrow('Partial audit failed');}finally{spy.mockRestore();}expect(await quantityAt(scope.warehouseId)).toBe(before);expect((await administerProductionResult()).deliveries).toHaveLength(1);
 current=await administerProduction(scope,'complete',payload(),order.id);expect(current.materials?.[0].consumedQuantity).toBe(0.666667);current=await administerProduction(scope,'complete',payload(),order.id);expect(current.status).toBe('completed');expect(current.completedQuantity).toBe(3);expect(current.materials?.[0].consumedQuantity).toBe(1);expect(current.deliveries).toHaveLength(3);expect(current.productionCost).toBe(0.3);expect(await quantityAt(scope.warehouseId)).toBe(baseline-1);
 const consumed=current.deliveries!.flatMap(d=>d.materials).reduce((n,m)=>n+Math.round(m.quantity*1e6),0);expect(consumed).toBe(1000000);expect((await listStock(scope.companyId,scope.branchId)).find(r=>r.productId===String(product._id))?.quantity).toBe(3);
 async function administerProductionResult(){const found=await getProductionOrderModel().findById(order.id).lean();return {id:order.id,...found!};}
 });
 it('production consumes materials atomically, rejects foreign and duplicate inputs and completes only once',async()=>{
 const scope=fixture;const finished=await getProductModel().findById(scope.productId).lean();const {_id,__v,...fields}=finished!;
 const product=await getProductModel().create({...fields,sku:'FINISHED-MATERIAL-TEST',name:'Finished test'});
 const material={productId:scope.productId,warehouseId:scope.warehouseId,quantity:3};
 await expect(administerProduction(scope,'create',{productId:String(product._id),plannedQuantity:2,materials:[material,material]})).rejects.toMatchObject({statusCode:400});
 await expect(administerProduction(scope,'create',{productId:scope.productId,plannedQuantity:2,materials:[material]})).rejects.toMatchObject({statusCode:400});
 await expect(administerProduction({...scope,branchId:'foreign'},'create',{productId:String(product._id),plannedQuantity:2,materials:[material]})).rejects.toMatchObject({statusCode:400});
 const order=await administerProduction(scope,'create',{productId:String(product._id),plannedQuantity:2,materials:[material]});await administerProduction(scope,'state',{expectedStatus:'planned',status:'running'},order.id);
 const input={warehouseId:scope.warehouseId,expectedQuantity:2};
 const existing=await quantityAt(scope.warehouseId);if(existing>0)await issueStock(movement('MATERIAL-DRAIN',existing));
 await expect(administerProduction(scope,'complete',input,order.id)).rejects.toMatchObject({statusCode:409});
 expect((await getProductionOrderModel().findById(order.id).lean())?.status).toBe('running');expect(await getStockMovementModel().countDocuments({reference:{$regex:'^PRODUCTION-'+order.id}})).toBe(0);
 await receiveStock(movement('MATERIAL-SEED',5));const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('material audit failed'));
 try{await expect(administerProduction(scope,'complete',input,order.id)).rejects.toThrow('material audit failed');}finally{spy.mockRestore();}
 expect(await quantityAt(scope.warehouseId)).toBe(5);expect(await getStockMovementModel().countDocuments({reference:{$regex:'^PRODUCTION-'+order.id}})).toBe(0);
 const results=await Promise.allSettled([administerProduction(scope,'complete',input,order.id),administerProduction(scope,'complete',input,order.id)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 expect(await quantityAt(scope.warehouseId)).toBe(2);expect(await getStockMovementModel().countDocuments({reference:{$regex:'^PRODUCTION-'+order.id}})).toBe(2);
 const completed=await getProductionOrderModel().findById(order.id).lean();expect(completed?.materials?.[0].movementId).toBeTruthy();expect(completed?.completedQuantity).toBe(2);
 const output=await listStock(scope.companyId,scope.branchId);expect(output.find(r=>r.productId===String(product._id))?.quantity).toBe(2);
 });
 it('production completion and stock entry commit once and roll back together on audit failure',async()=>{
 const scope=fixture;const baseline=await quantityAt(scope.warehouseId);const row=await administerProduction(scope,'create',{productId:scope.productId,plannedQuantity:6});expect(row.status).toBe('planned');
 await administerProduction(scope,'state',{expectedStatus:'planned',status:'running'},row.id);
 const input={warehouseId:scope.warehouseId,expectedQuantity:6};await expect(administerProduction({...scope,branchId:'foreign'},'complete',input,row.id)).rejects.toMatchObject({statusCode:409});
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Production audit unavailable'));
 try{await expect(administerProduction(scope,'complete',input,row.id)).rejects.toThrow('Production audit unavailable');}finally{spy.mockRestore();}
 expect((await getProductionOrderModel().findById(row.id).lean())?.status).toBe('running');expect(await quantityAt(scope.warehouseId)).toBe(baseline);
 const results=await Promise.allSettled([administerProduction(scope,'complete',input,row.id),administerProduction(scope,'complete',input,row.id)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(await quantityAt(scope.warehouseId)).toBe(baseline+6);
 const completed=await getProductionOrderModel().findById(row.id).lean();expect(completed?.completedQuantity).toBe(6);expect(completed?.completionMovementId).toBeTruthy();expect(await getStockMovementModel().countDocuments({companyId:scope.companyId,reference:'PRODUCTION-'+row.id})).toBe(1);
 expect(await getAuditEventModel().countDocuments({companyId:scope.companyId,module:'produccion',entityId:row.id})).toBe(3);expect((await pageProductionOrders(scope,{limit:20,status:'completed'})).items).toHaveLength(1);
 const display=(await pageProductionOrders(scope,{limit:20,status:'completed'})).items[0];expect(display.productName).toBeTruthy();expect(display.completionWarehouseName).toBeTruthy();
 await getWarehouseModel().updateOne({_id:scope.warehouseId},{$set:{branchId:'foreign'}});expect((await pageProductionOrders(scope,{limit:20,status:'completed'})).items[0].completionWarehouseName).toBeUndefined();await getWarehouseModel().updateOne({_id:scope.warehouseId},{$set:{branchId:scope.branchId}});
 await expect(administerProduction(scope,'state',{expectedStatus:'running',status:'cancelled'},row.id)).rejects.toMatchObject({statusCode:409});
 const cancelled=await administerProduction(scope,'create',{productId:scope.productId,plannedQuantity:2});await administerProduction(scope,'state',{expectedStatus:'planned',status:'cancelled'},cancelled.id);expect(await quantityAt(scope.warehouseId)).toBe(baseline+6);
 });


it('invoice draft and audit roll back together and require the customer branch', async () => {
 const customer=await getCustomerModel().create({companyId:fixture.companyId,branchId:fixture.branchId,name:'Invoice client',taxId:'INVOICECLIENT',email:'invoice@example.com',status:'ACTIVE'});
 const sale=await getSaleModel().create({companyId:fixture.companyId,branchId:fixture.branchId,customerId:String(customer._id),productId:fixture.productId,quantity:1,unitPrice:10,total:10,status:'PENDIENTE'});
 const input={companyId:fixture.companyId,branchId:fixture.branchId,saleId:String(sale._id),number:'DRAFT-001',issueDate:'2026-10-05',dueDate:'2026-10-20',taxRate:16};
 const audit=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('audit unavailable'));
 await expect(createAuditedInvoice(input,{userId:fixture.userId})).rejects.toThrow('audit unavailable');audit.mockRestore();
 expect(await getInvoiceModel().countDocuments({companyId:fixture.companyId})).toBe(0);
 const row=await createAuditedInvoice(input,{userId:fixture.userId});expect(row.total).toBe(11.6);expect(row.status).toBe('BORRADOR');
 await expect(createAuditedInvoice(input,{userId:fixture.userId})).rejects.toMatchObject({statusCode:409});
 await getCustomerModel().updateOne({_id:customer._id},{$set:{branchId:'foreign-branch'}});
 await expect(createAuditedInvoice({...input,number:'DRAFT-002'},{userId:fixture.userId})).rejects.toMatchObject({statusCode:400});
 expect(await getInvoiceModel().countDocuments({companyId:fixture.companyId})).toBe(1);
});


it('draft cancellation is scoped, audited and does not change sale or stock', async()=>{
 const customer=await getCustomerModel().create({companyId:fixture.companyId,branchId:fixture.branchId,name:'Cancel client',taxId:'CANCELCLIENT',email:'cancel@example.com',status:'ACTIVE'});
 const sale=await getSaleModel().create({companyId:fixture.companyId,branchId:fixture.branchId,customerId:String(customer._id),productId:fixture.productId,quantity:1,unitPrice:10,total:10,status:'PENDIENTE'});
 const options=await invoiceSaleOptions(fixture.companyId,fixture.branchId,{limit:20});expect(options.items[0].customerName).toBe('Cancel client');expect((await invoiceSaleOptions(fixture.companyId,'foreign',{limit:20})).items).toHaveLength(0);
 const draft=await createAuditedInvoice({companyId:fixture.companyId,branchId:fixture.branchId,saleId:String(sale._id),number:'CANCEL-001',issueDate:'2026-10-05',dueDate:'2026-10-20',taxRate:16},{userId:fixture.userId});
 const stored=await getInvoiceModel().findById(draft.id).lean();const payload={expectedUpdatedAt:stored!.updatedAt.toISOString(),reason:'Duplicated draft'};const actor={userId:fixture.userId};const baseline=await quantityAt(fixture.warehouseId);
 await expect(cancelInvoiceDraft(fixture.companyId,'foreign',draft.id,payload,actor)).rejects.toMatchObject({statusCode:409});
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('cancel audit unavailable'));
 try{await expect(cancelInvoiceDraft(fixture.companyId,fixture.branchId,draft.id,payload,actor)).rejects.toThrow('cancel audit unavailable');}finally{spy.mockRestore();}
 expect((await getInvoiceModel().findById(draft.id).lean())?.status).toBe('BORRADOR');
 const results=await Promise.allSettled([cancelInvoiceDraft(fixture.companyId,fixture.branchId,draft.id,payload,actor),cancelInvoiceDraft(fixture.companyId,fixture.branchId,draft.id,payload,actor)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 expect((await getSaleModel().findById(sale._id).lean())?.status).toBe('PENDIENTE');expect(await quantityAt(fixture.warehouseId)).toBe(baseline);
 expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'facturacion',entityId:draft.id})).toBe(2);
 expect((await pageInvoices(fixture.companyId,fixture.branchId,{search:'CANCEL-',status:'CANCELADA',limit:20})).items).toHaveLength(1);
 expect((await pageInvoices(fixture.companyId,fixture.branchId,{search:'.*',limit:20})).items).toHaveLength(0);
});

it('CRM persists scoped opportunities and closes only once with atomic audit',async()=>{
 const customer=await getCustomerModel().create({companyId:fixture.companyId,branchId:fixture.branchId,name:'CRM client',taxId:'CRMCLIENT',email:'crm@example.com',status:'ACTIVE'});const input={customerId:String(customer._id),name:'CRM A+B',amount:125.25};
 await expect(administerOpportunity({...fixture,branchId:'foreign'},input)).rejects.toMatchObject({statusCode:400});
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('CRM audit unavailable'));try{await expect(administerOpportunity(fixture,input)).rejects.toThrow('CRM audit unavailable');}finally{spy.mockRestore();}expect(await getOpportunityModel().countDocuments({companyId:fixture.companyId})).toBe(0);
 const row=await administerOpportunity(fixture,input);expect(row.status).toBe('OPEN');const change={stage:'CLOSED_WON',expectedStage:row.stage,expectedUpdatedAt:row.updatedAt.toISOString()};
 await expect(administerOpportunity({...fixture,branchId:'foreign'},change,row.id)).rejects.toMatchObject({statusCode:409});
 const results=await Promise.allSettled([administerOpportunity(fixture,change,row.id),administerOpportunity(fixture,change,row.id)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 const saved=await getOpportunityModel().findById(row.id).lean();expect(saved?.status).toBe('WON');expect(saved?.amount).toBe(125.25);
 expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'crm',entityId:row.id})).toBe(2);
 const page=await pageOpportunities(fixture,{search:'A+B',status:'WON',limit:20});expect(page.items).toHaveLength(1);expect(page.items[0].customerName).toBe('CRM client');expect((await pageOpportunities(fixture,{search:'.*',limit:20})).items).toHaveLength(0);expect((await pageOpportunities({...fixture,branchId:'foreign'},{search:'',limit:20})).items).toHaveLength(0);
 await expect(administerOpportunity(fixture,{stage:'PROPOSAL',expectedStage:'CLOSED_WON',expectedUpdatedAt:saved!.updatedAt.toISOString()},row.id)).rejects.toMatchObject({statusCode:400});
});

it('shipments persist scoped progress with atomic audit and leave stock unchanged',async()=>{
 const sale=await getSaleModel().create({companyId:fixture.companyId,branchId:fixture.branchId,customerId:'customer',productId:fixture.productId,quantity:1,unitPrice:10,total:10,status:'PENDIENTE'});const input={saleId:String(sale._id),destination:'Address A+B',scheduledDate:'2026-10-05'};const baseline=await quantityAt(fixture.warehouseId);
 await expect(administerShipment({...fixture,branchId:'foreign'},input)).rejects.toMatchObject({statusCode:400});
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Shipment audit unavailable'));try{await expect(administerShipment(fixture,input)).rejects.toThrow('Shipment audit unavailable');}finally{spy.mockRestore();}expect(await getShipmentModel().countDocuments({companyId:fixture.companyId})).toBe(0);
 const row=await administerShipment(fixture,input);const change={status:'IN_TRANSIT',expectedStatus:'PENDING',expectedUpdatedAt:row.updatedAt.toISOString()};await expect(administerShipment({...fixture,branchId:'foreign'},change,row.id)).rejects.toMatchObject({statusCode:409});
 const results=await Promise.allSettled([administerShipment(fixture,change,row.id),administerShipment(fixture,change,row.id)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);const inTransit=await getShipmentModel().findById(row.id).lean();
 await administerShipment(fixture,{status:'DELIVERED',expectedStatus:'IN_TRANSIT',expectedUpdatedAt:inTransit!.updatedAt.toISOString()},row.id);expect((await getShipmentModel().findById(row.id).lean())?.status).toBe('DELIVERED');expect(await quantityAt(fixture.warehouseId)).toBe(baseline);expect((await getSaleModel().findById(sale._id).lean())?.status).toBe('PENDIENTE');expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'logistica',entityId:row.id})).toBe(3);
 expect((await pageShipments(fixture,{search:'A+B',status:'DELIVERED',limit:20})).items).toHaveLength(1);expect((await pageShipments(fixture,{search:'.*',limit:20})).items).toHaveLength(0);
 await expect(administerShipment(fixture,{status:'CANCELLED',expectedStatus:'IN_TRANSIT',expectedUpdatedAt:inTransit!.updatedAt.toISOString()},row.id)).rejects.toMatchObject({statusCode:409});
});

it('maintenance records are scoped and close once with atomic audit and real summary',async()=>{
 const input={assetName:'Equipment A+B',description:'Preventive inspection',scheduledDate:'2026-10-05',priority:'high'};
 expect((await maintenanceSummary(fixture)).total).toBe(0);
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Maintenance audit unavailable'));try{await expect(administerMaintenance(fixture,input)).rejects.toThrow('Maintenance audit unavailable');}finally{spy.mockRestore();}expect(await getMaintenanceOrderModel().countDocuments({companyId:fixture.companyId})).toBe(0);
 const row=await administerMaintenance(fixture,input);const start={status:'in_progress',expectedStatus:'scheduled',expectedUpdatedAt:row.updatedAt.toISOString()};await expect(administerMaintenance({...fixture,branchId:'foreign'},start,row.id)).rejects.toMatchObject({statusCode:409});
 const running=await administerMaintenance(fixture,start,row.id);const close={status:'completed',expectedStatus:'in_progress',expectedUpdatedAt:running.updatedAt.toISOString(),completionNote:'Inspection completed'};
 const results=await Promise.allSettled([administerMaintenance(fixture,close,row.id),administerMaintenance(fixture,close,row.id)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((await getMaintenanceOrderModel().findById(row.id).lean())?.completionNote).toBe('Inspection completed');expect((await maintenanceSummary(fixture)).counts.completed).toBe(1);expect((await maintenanceSummary({...fixture,branchId:'foreign'})).total).toBe(0);
 expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'mantenimiento',entityId:row.id})).toBe(3);expect((await pageMaintenance(fixture,{search:'A+B',status:'completed',limit:20})).items).toHaveLength(1);expect((await pageMaintenance(fixture,{search:'.*',limit:20})).items).toHaveLength(0);
 await expect(administerMaintenance(fixture,{status:'cancelled',expectedStatus:'in_progress',expectedUpdatedAt:running.updatedAt.toISOString()},row.id)).rejects.toMatchObject({statusCode:409});
});
it('quality records are scoped and close once with atomic audit and real summary',async()=>{
 const baseline=await quantityAt(fixture.warehouseId);const input={subject:'Equipment A+B',criteria:'Preventive inspection',inspectionDate:'2026-10-05',priority:'high'};
 expect((await qualitySummary(fixture)).total).toBe(0);
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Quality audit unavailable'));try{await expect(administerQuality(fixture,input)).rejects.toThrow('Quality audit unavailable');}finally{spy.mockRestore();}expect(await getQualityInspectionModel().countDocuments({companyId:fixture.companyId})).toBe(0);
 const row=await administerQuality(fixture,input);const start={status:'in_progress',expectedStatus:'scheduled',expectedUpdatedAt:row.updatedAt.toISOString()};await expect(administerQuality({...fixture,branchId:'foreign'},start,row.id)).rejects.toMatchObject({statusCode:409});
 const running=await administerQuality(fixture,start,row.id);const close={status:'completed',expectedStatus:'in_progress',expectedUpdatedAt:running.updatedAt.toISOString(),result:'pass',completionNote:'Inspection completed'};
 const results=await Promise.allSettled([administerQuality(fixture,close,row.id),administerQuality(fixture,close,row.id)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((await getQualityInspectionModel().findById(row.id).lean())?.completionNote).toBe('Inspection completed');expect(await quantityAt(fixture.warehouseId)).toBe(baseline);expect((await getQualityInspectionModel().findById(row.id).lean())?.result).toBe('pass');expect((await qualitySummary(fixture)).counts.completed).toBe(1);expect((await qualitySummary({...fixture,branchId:'foreign'})).total).toBe(0);
 expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'calidad',entityId:row.id})).toBe(3);expect((await pageQuality(fixture,{search:'A+B',status:'completed',limit:20})).items).toHaveLength(1);expect((await pageQuality(fixture,{search:'.*',limit:20})).items).toHaveLength(0);
 await expect(administerQuality(fixture,{status:'cancelled',expectedStatus:'in_progress',expectedUpdatedAt:running.updatedAt.toISOString()},row.id)).rejects.toMatchObject({statusCode:409});
});


it('assets persist scoped unique codes and retire once with atomic audit',async()=>{
 const input={name:'Pump A+B',code:'pump_01',location:'Plant A'};const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Asset audit unavailable'));try{await expect(administerAsset(fixture,input)).rejects.toThrow('Asset audit unavailable');}finally{spy.mockRestore();}expect(await getManagedAssetModel().countDocuments({companyId:fixture.companyId})).toBe(0);
 const row=await administerAsset(fixture,input);expect(row.code).toBe('PUMP_01');await expect(administerAsset(fixture,input)).rejects.toMatchObject({statusCode:409});const change={name:row.name,location:'Plant B',status:'retired',expectedStatus:row.status,expectedUpdatedAt:row.updatedAt.toISOString()};await expect(administerAsset({...fixture,branchId:'foreign'},change,row.id)).rejects.toMatchObject({statusCode:409});const results=await Promise.allSettled([administerAsset(fixture,change,row.id),administerAsset(fixture,change,row.id)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((await assetSummary(fixture)).counts.retired).toBe(1);expect((await assetSummary({...fixture,branchId:'foreign'})).total).toBe(0);expect((await pageAssets(fixture,{search:'A+B',limit:20})).items).toHaveLength(1);expect((await pageAssets(fixture,{search:'.*',limit:20})).items).toHaveLength(0);expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'activos',entityId:row.id})).toBe(2);expect(await quantityAt(fixture.warehouseId)).toBe(10);
});
it('ticket records are scoped and close once with atomic audit and real summary',async()=>{
 const baseline=await quantityAt(fixture.warehouseId);const input={subject:'Equipment A+B',description:'Preventive inspection',targetDate:'2026-10-05',priority:'high'};
 expect((await ticketSummary(fixture)).total).toBe(0);
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Maintenance audit unavailable'));try{await expect(administerTicket(fixture,input)).rejects.toThrow('Maintenance audit unavailable');}finally{spy.mockRestore();}expect(await getSupportTicketModel().countDocuments({companyId:fixture.companyId})).toBe(0);
 const row=await administerTicket(fixture,input);const start={status:'in_progress',expectedStatus:'open',expectedUpdatedAt:row.updatedAt.toISOString()};await expect(administerTicket({...fixture,branchId:'foreign'},start,row.id)).rejects.toMatchObject({statusCode:409});
 const running=await administerTicket(fixture,start,row.id);const close={status:'resolved',expectedStatus:'in_progress',expectedUpdatedAt:running.updatedAt.toISOString(),completionNote:'Inspection resolved'};
 const closingAudit=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Resolution audit unavailable'));try{await expect(administerTicket(fixture,close,row.id)).rejects.toThrow('Resolution audit unavailable');}finally{closingAudit.mockRestore();}expect((await getSupportTicketModel().findById(row.id).lean())?.status).toBe('in_progress');
 const results=await Promise.allSettled([administerTicket(fixture,close,row.id),administerTicket(fixture,close,row.id)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((await getSupportTicketModel().findById(row.id).lean())?.completionNote).toBe('Inspection resolved');expect(await quantityAt(fixture.warehouseId)).toBe(baseline);expect((await ticketSummary(fixture)).counts.resolved).toBe(1);expect((await ticketSummary({...fixture,branchId:'foreign'})).total).toBe(0);
 expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'soporte',entityId:row.id})).toBe(3);expect((await pageTickets(fixture,{search:'A+B',status:'resolved',limit:20})).items).toHaveLength(1);expect((await pageTickets(fixture,{search:'.*',limit:20})).items).toHaveLength(0);
 await expect(administerTicket(fixture,{status:'cancelled',expectedStatus:'in_progress',expectedUpdatedAt:running.updatedAt.toISOString()},row.id)).rejects.toMatchObject({statusCode:409});
});

it('ticket records are scoped and close once with atomic audit and real summary',async()=>{
 const baseline=await quantityAt(fixture.warehouseId);const input={name:'Equipment A+B',mitigationPlan:'Preventive inspection',reviewDate:'2026-10-05',level:'high'};
 expect((await riskSummary(fixture)).total).toBe(0);
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Maintenance audit unavailable'));try{await expect(administerRisk(fixture,input)).rejects.toThrow('Maintenance audit unavailable');}finally{spy.mockRestore();}expect(await getRiskRecordModel().countDocuments({companyId:fixture.companyId})).toBe(0);
 const row=await administerRisk(fixture,input);const start={status:'mitigating',expectedStatus:'identified',expectedUpdatedAt:row.updatedAt.toISOString()};await expect(administerRisk({...fixture,branchId:'foreign'},start,row.id)).rejects.toMatchObject({statusCode:409});
 const running=await administerRisk(fixture,start,row.id);const close={status:'closed',expectedStatus:'mitigating',expectedUpdatedAt:running.updatedAt.toISOString(),completionNote:'Inspection closed'};
 const closingAudit=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Resolution audit unavailable'));try{await expect(administerRisk(fixture,close,row.id)).rejects.toThrow('Resolution audit unavailable');}finally{closingAudit.mockRestore();}expect((await getRiskRecordModel().findById(row.id).lean())?.status).toBe('mitigating');
 const results=await Promise.allSettled([administerRisk(fixture,close,row.id),administerRisk(fixture,close,row.id)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((await getRiskRecordModel().findById(row.id).lean())?.completionNote).toBe('Inspection closed');expect(await quantityAt(fixture.warehouseId)).toBe(baseline);expect((await riskSummary(fixture)).counts.closed).toBe(1);expect((await riskSummary({...fixture,branchId:'foreign'})).total).toBe(0);
 expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'riesgo',entityId:row.id})).toBe(3);expect((await pageRisks(fixture,{search:'A+B',status:'closed',limit:20})).items).toHaveLength(1);expect((await pageRisks(fixture,{search:'.*',limit:20})).items).toHaveLength(0);
 await expect(administerRisk(fixture,{status:'dismissed',expectedStatus:'mitigating',expectedUpdatedAt:running.updatedAt.toISOString()},row.id)).rejects.toMatchObject({statusCode:409});
});

it('compliance records are scoped and close once with atomic audit and real summary',async()=>{
 const baseline=await quantityAt(fixture.warehouseId);const input={name:'Equipment A+B',requirement:'Preventive inspection',dueDate:'2026-10-05',priority:'high'};
 expect((await complianceSummary(fixture)).total).toBe(0);
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Quality audit unavailable'));try{await expect(administerCompliance(fixture,input)).rejects.toThrow('Quality audit unavailable');}finally{spy.mockRestore();}expect(await getComplianceControlModel().countDocuments({companyId:fixture.companyId})).toBe(0);
 const row=await administerCompliance(fixture,input);const start={status:'reviewing',expectedStatus:'pending',expectedUpdatedAt:row.updatedAt.toISOString()};await expect(administerCompliance({...fixture,branchId:'foreign'},start,row.id)).rejects.toMatchObject({statusCode:409});
 const running=await administerCompliance(fixture,start,row.id);const close={status:'completed',expectedStatus:'reviewing',expectedUpdatedAt:running.updatedAt.toISOString(),result:'pass',evidenceNote:'Inspection completed'};
 const closingAudit=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Compliance audit unavailable'));try{await expect(administerCompliance(fixture,close,row.id)).rejects.toThrow('Compliance audit unavailable');}finally{closingAudit.mockRestore();}expect((await getComplianceControlModel().findById(row.id).lean())?.status).toBe('reviewing');
 const results=await Promise.allSettled([administerCompliance(fixture,close,row.id),administerCompliance(fixture,close,row.id)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((await getComplianceControlModel().findById(row.id).lean())?.evidenceNote).toBe('Inspection completed');expect(await quantityAt(fixture.warehouseId)).toBe(baseline);expect((await getComplianceControlModel().findById(row.id).lean())?.result).toBe('pass');expect((await complianceSummary(fixture)).counts.completed).toBe(1);expect((await complianceSummary({...fixture,branchId:'foreign'})).total).toBe(0);
 expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'cumplimiento',entityId:row.id})).toBe(3);expect((await pageCompliance(fixture,{search:'A+B',status:'completed',limit:20})).items).toHaveLength(1);expect((await pageCompliance(fixture,{search:'.*',limit:20})).items).toHaveLength(0);
 await expect(administerCompliance(fixture,{status:'cancelled',expectedStatus:'reviewing',expectedUpdatedAt:running.updatedAt.toISOString()},row.id)).rejects.toMatchObject({statusCode:409});
});


it('role creation is company scoped, prevents elevated grants and rolls back audit failures',async()=>{
 const actor={...fixture,permissions:['usuarios.ver','productos.ver']};const input={name:'QA_READER',description:'Catalog reader',permissions:['productos.ver']};await expect(createAuditedRole(actor,{...input,permissions:['usuarios.editar']})).rejects.toMatchObject({statusCode:403});const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Role audit unavailable'));try{await expect(createAuditedRole(actor,input)).rejects.toThrow('Role audit unavailable');}finally{spy.mockRestore();}expect(await getRoleModel().countDocuments({companyId:fixture.companyId})).toBe(0);const row=await createAuditedRole(actor,input);expect(row.name).toBe('QA_READER');expect((await listRolesForCompany(fixture.companyId)).some(r=>r.id===row.id)).toBe(true);expect((await listRolesForCompany('foreign-company')).some(r=>r.id===row.id)).toBe(false);await expect(findAssignableRole(row.id,'foreign-company')).rejects.toMatchObject({statusCode:404});await expect(createAuditedRole(actor,input)).rejects.toMatchObject({statusCode:409});expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'roles',entityId:row.id})).toBe(1);await expect(createAuditedRole(actor,{...input,name:'ADMIN'})).rejects.toMatchObject({statusCode:409});const concurrent=await Promise.allSettled([createAuditedRole(actor,{...input,name:'CONCURRENT_READER'}),createAuditedRole(actor,{...input,name:'CONCURRENT_READER'})]);expect(concurrent.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(await getRoleModel().countDocuments({companyId:fixture.companyId,name:'CONCURRENT_READER'})).toBe(1);
});

it('editing a role updates assigned users across branches and revokes sessions atomically',async()=>{
 const actor={...fixture,userId:'000000000000000000000009',permissions:['usuarios.ver','productos.ver']};const role=await createAuditedRole(actor,{name:'EDIT_READER',description:'Before edit',permissions:['usuarios.ver','productos.ver']});const users=[];for(const [index,branchId,companyId] of [[0,fixture.branchId,fixture.companyId],[1,'other-branch',fixture.companyId],[2,fixture.branchId,'foreign-company']] as const){users.push(await getUserModel().create({companyId,branchId,email:'role-edit-'+index+'-'+randomUUID()+'@example.test',passwordHash:'isolated-test-placeholder',name:'Role test',roleId:role.id,permissions:role.permissions,isActive:true,sessionVersion:4}));}
 const payload={description:'Reduced access',permissions:['productos.ver'],expectedUpdatedAt:role.updatedAt};await expect(updateAuditedRole({...actor,companyId:'foreign'},role.id,payload)).rejects.toMatchObject({statusCode:409});await expect(updateAuditedRole({...actor,userId:String(users[0]._id)},role.id,payload)).rejects.toMatchObject({statusCode:403});await expect(updateAuditedRole(actor,role.id,{...payload,permissions:['usuarios.editar']})).rejects.toMatchObject({statusCode:403});
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Role edit audit unavailable'));try{await expect(updateAuditedRole(actor,role.id,payload)).rejects.toThrow('Role edit audit unavailable');}finally{spy.mockRestore();}expect((await getRoleModel().findById(role.id).lean())?.description).toBe('Before edit');expect((await getUserModel().findById(users[0]._id).select('+sessionVersion').lean())?.sessionVersion).toBe(4);
 const results=await Promise.allSettled([updateAuditedRole(actor,role.id,payload),updateAuditedRole(actor,role.id,payload)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);for(const user of users.slice(0,2)){const saved=await getUserModel().findById(user._id).select('+sessionVersion').lean();expect(saved?.permissions).toEqual(['productos.ver']);expect(saved?.sessionVersion).toBe(5);}expect((await getUserModel().findById(users[2]._id).select('+sessionVersion').lean())?.sessionVersion).toBe(4);expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'roles',entityId:role.id,action:'UPDATE'})).toBe(1);
});

it('concurrent user creation and role editing cannot leave stale permission copies',async()=>{
 const actor={...fixture,userId:'000000000000000000000009',permissions:['usuarios.ver','productos.ver']};const role=await createAuditedRole(actor,{name:'RACE_READER',description:'Before race',permissions:actor.permissions});const results=await Promise.allSettled([createAuditedUserInMongo({name:'Race user',email:'race-'+randomUUID()+'@example.test',password:'Isolated-Test-Password-123',roleId:role.id,companyId:fixture.companyId,branchId:fixture.branchId,actorPermissions:actor.permissions},{userId:actor.userId}),updateAuditedRole(actor,role.id,{description:'After race',permissions:['productos.ver'],expectedUpdatedAt:role.updatedAt})]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(2);const savedRole=await getRoleModel().findById(role.id).lean();const assigned=await getUserModel().findOne({companyId:fixture.companyId,roleId:role.id}).lean();expect(assigned?.permissions).toEqual(savedRole?.permissions);expect(savedRole?.permissions).toEqual(['productos.ver']);
});
it('role status rolls back audit failures, rejects stale or foreign edits and can reactivate',async()=>{
 const actor={...fixture,userId:'000000000000000000000009',permissions:['productos.ver']};
 const row=await createAuditedRole(actor,{name:'STATUS_READER',description:'Status test',permissions:actor.permissions});
 const payload={isActive:false,expectedUpdatedAt:row.updatedAt};
 await expect(changeRoleStatus({...actor,companyId:'foreign'},row.id,payload)).rejects.toMatchObject({statusCode:409});
 await expect(changeRoleStatus({...actor,permissions:[]},row.id,payload)).rejects.toMatchObject({statusCode:403});
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Status audit unavailable'));
 try{await expect(changeRoleStatus(actor,row.id,payload)).rejects.toThrow('Status audit unavailable');}finally{spy.mockRestore();}
 expect((await getRoleModel().findById(row.id).lean())?.isActive).toBe(true);
 const results=await Promise.allSettled([changeRoleStatus(actor,row.id,payload),changeRoleStatus(actor,row.id,payload)]);
 expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 await expect(findAssignableRole(row.id,fixture.companyId)).rejects.toMatchObject({statusCode:404});
 await expect(updateAuditedRole(actor,row.id,{description:'Cannot edit',permissions:actor.permissions,expectedUpdatedAt:row.updatedAt})).rejects.toMatchObject({statusCode:409});
 const inactive=(await listRolesForCompany(fixture.companyId)).find(r=>r.id===row.id)!;expect(inactive.isActive).toBe(false);
 const active=await changeRoleStatus(actor,row.id,{isActive:true,expectedUpdatedAt:inactive.updatedAt});expect(active.isActive).toBe(true);
 expect((await findAssignableRole(row.id,fixture.companyId)).isActive).toBe(true);
 expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'roles',entityId:row.id,action:'UPDATE'})).toBe(2);
});
it('an inactive assigned user in another branch blocks role deactivation',async()=>{
 const actor={...fixture,userId:'000000000000000000000009',permissions:['productos.ver']};
 const row=await createAuditedRole(actor,{name:'ASSIGNED_READER',description:'Assigned test',permissions:actor.permissions});
 await getUserModel().create({companyId:fixture.companyId,branchId:'other-branch',email:'assigned-'+randomUUID()+'@example.test',passwordHash:'isolated-test-placeholder',name:'Assigned',roleId:row.id,permissions:row.permissions,isActive:false});
 await expect(changeRoleStatus(actor,row.id,{isActive:false,expectedUpdatedAt:row.updatedAt})).rejects.toMatchObject({statusCode:409});
 expect((await getRoleModel().findById(row.id).lean())?.isActive).toBe(true);
 expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'roles',entityId:row.id,action:'UPDATE'})).toBe(0);
});
it('concurrent assignment and deactivation cannot assign an inactive role',async()=>{
 const actor={...fixture,userId:'000000000000000000000009',permissions:['productos.ver']};
 const row=await createAuditedRole(actor,{name:'STATUS_RACE',description:'Race test',permissions:actor.permissions});
 const results=await Promise.allSettled([createAuditedUserInMongo({name:'Race status',email:'status-race-'+randomUUID()+'@example.test',password:'Isolated-Test-Password-123',roleId:row.id,companyId:fixture.companyId,branchId:fixture.branchId,actorPermissions:actor.permissions},{userId:actor.userId}),changeRoleStatus(actor,row.id,{isActive:false,expectedUpdatedAt:row.updatedAt})]);
 expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 const assigned=await getUserModel().exists({companyId:fixture.companyId,roleId:row.id});
 expect((await getRoleModel().findById(row.id).lean())?.isActive).toBe(!!assigned);
});

it('role pages filter company and held permissions, search literally and retain inactive records',async()=>{
 const actor={...fixture,userId:'000000000000000000000009',permissions:['productos.ver']};
 const rows=[];for(const name of ['PAGE A+B','PAGE B','PAGE C'])rows.push(await createAuditedRole(actor,{name,description:'Page test',permissions:actor.permissions}));
 await changeRoleStatus(actor,rows[0].id,{isActive:false,expectedUpdatedAt:rows[0].updatedAt});
 await getRoleModel().create([{companyId:fixture.companyId,name:'PAGE HIGH',description:'Higher grants',permissions:['usuarios.editar']},{companyId:'foreign-'+fixture.companyId,name:'PAGE FOREIGN',description:'Other company',permissions:actor.permissions}]);
 const first=await pageCompanyRoles(fixture.companyId,actor.permissions,{page:1,limit:2,search:'PAGE'});expect(first.total).toBe(3);expect(first.items.map(r=>r.name)).toEqual(['PAGE A+B','PAGE B']);expect(first.items[0].isActive).toBe(false);
 const second=await pageCompanyRoles(fixture.companyId,actor.permissions,{page:2,limit:2,search:'PAGE'});expect(second.items.map(r=>r.name)).toEqual(['PAGE C']);
 expect((await pageCompanyRoles(fixture.companyId,actor.permissions,{search:'A+B'})).total).toBe(1);
 expect((await pageCompanyRoles(fixture.companyId,actor.permissions,{search:'.*'})).total).toBe(0);
 expect((await pageCompanyRoles(fixture.companyId,actor.permissions,{page:99,limit:2})).items).toHaveLength(0);
 await expect(pageCompanyRoles(fixture.companyId,actor.permissions,{limit:51})).rejects.toMatchObject({statusCode:400});
});

it('organization edits are scoped, concurrent changes conflict and audit failures roll back',async()=>{
 await getCompanyModel().create({_id:fixture.companyId,name:'Original company',taxId:'QA-TEST',status:'ACTIVE'});
 const original=await readCurrentCompany(fixture.companyId);
 const payload={name:'Updated company',taxId:' qa-updated ',expectedUpdatedAt:original.updatedAt};
 await expect(saveOrganization(fixture,'company',{...payload,companyId:'foreign'})).rejects.toMatchObject({statusCode:400});
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Organization audit unavailable'));
 try{await expect(saveOrganization(fixture,'company',payload)).rejects.toThrow('Organization audit unavailable');}finally{spy.mockRestore();}
 expect((await readCurrentCompany(fixture.companyId)).name).toBe('Original company');
 const results=await Promise.allSettled([saveOrganization(fixture,'company',payload),saveOrganization(fixture,'company',payload)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 expect((await readCurrentCompany(fixture.companyId)).taxId).toBe('QA-UPDATED');
 expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'empresas',action:'UPDATE'})).toBe(1);
});
it('branch creation and editing preserve company boundaries, uniqueness and atomic audit',async()=>{
 await getCompanyModel().create({_id:fixture.companyId,name:'Test company',taxId:'QA-TEST',status:'ACTIVE'});
 const input={name:'Branch A+B',code:' qa-branch ',city:'Test city'};
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Branch audit unavailable'));
 try{await expect(saveOrganization(fixture,'branch',input)).rejects.toThrow('Branch audit unavailable');}finally{spy.mockRestore();}
 expect(await getBranchModel().countDocuments({companyId:fixture.companyId,code:'QA-BRANCH'})).toBe(0);
 const row=await saveOrganization(fixture,'branch',input);expect('code' in row&&row.code).toBe('QA-BRANCH');
 await expect(saveOrganization(fixture,'branch',input)).rejects.toMatchObject({statusCode:409});
 await expect(saveOrganization(fixture,'branch',{...input,city:'Other city',expectedUpdatedAt:row.updatedAt},fixture.destinationWarehouseId)).rejects.toMatchObject({statusCode:409});
 const edits=await Promise.allSettled([saveOrganization(fixture,'branch',{...input,city:'Updated city',expectedUpdatedAt:row.updatedAt},row.id),saveOrganization(fixture,'branch',{...input,city:'Other city',expectedUpdatedAt:row.updatedAt},row.id)]);expect(edits.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 expect((await pageCompanyBranches(fixture.companyId,{search:'A+B'})).items.map(r=>r.id)).toEqual([row.id]);
 expect((await pageCompanyBranches(fixture.companyId,{search:'.*'})).total).toBe(0);
 expect((await pageCompanyBranches('foreign-company',{})).total).toBe(0);
 expect(await getAuditEventModel().countDocuments({companyId:fixture.companyId,module:'sucursales',entityId:row.id})).toBe(2);
});

it('risk plan edits preserve state, isolate branches and roll back audit failures',async()=>{
 const row=await administerRisk(fixture,{name:'Risk edit',mitigationPlan:'Initial plan',reviewDate:'2026-10-06',level:'medium'});
 const data={name:row.name,mitigationPlan:'Updated plan',reviewDate:'2026-10-07',level:'high',expectedStatus:'identified',expectedUpdatedAt:row.updatedAt.toISOString()};
 await expect(editRiskDetails({...fixture,branchId:'foreign'},row.id,data)).rejects.toMatchObject({statusCode:409});
 const spy=vi.spyOn(getAuditEventModel(),'create').mockRejectedValueOnce(new Error('Risk edit audit unavailable'));
 try{await expect(editRiskDetails(fixture,row.id,data)).rejects.toThrow('Risk edit audit unavailable');}finally{spy.mockRestore();}
 expect((await getRiskRecordModel().findById(row.id).lean())?.mitigationPlan).toBe('Initial plan');
 const edits=await Promise.allSettled([editRiskDetails(fixture,row.id,data),editRiskDetails(fixture,row.id,data)]);expect(edits.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 const saved=await getRiskRecordModel().findById(row.id).lean();expect(saved?.status).toBe('identified');expect(saved?.mitigationPlan).toBe('Updated plan');
 const running=await administerRisk(fixture,{status:'mitigating',expectedStatus:'identified',expectedUpdatedAt:saved!.updatedAt.toISOString()},row.id);
 const close={status:'closed',expectedStatus:'mitigating',expectedUpdatedAt:running.updatedAt.toISOString(),completionNote:'Resolved risk'};
 const race=await Promise.allSettled([administerRisk(fixture,close,row.id),editRiskDetails(fixture,row.id,{...data,mitigationPlan:'Competing plan',expectedStatus:'mitigating',expectedUpdatedAt:running.updatedAt.toISOString()})]);expect(race.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 const latest=await getRiskRecordModel().findById(row.id).lean();
 if(latest!.status==='mitigating')await administerRisk(fixture,{...close,expectedUpdatedAt:latest!.updatedAt.toISOString()},row.id);
 await expect(editRiskDetails(fixture,row.id,{...data,expectedStatus:'mitigating',expectedUpdatedAt:(await getRiskRecordModel().findById(row.id).lean())!.updatedAt.toISOString()})).rejects.toMatchObject({statusCode:409});
});

});
