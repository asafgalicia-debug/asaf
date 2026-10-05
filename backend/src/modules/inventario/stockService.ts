import { getAuditEventModel } from '../auditoria/models/AuditEvent.js';
import {getModuleConfigModel} from '../configuracion/configService.js';
import mongoose, { type PipelineStage } from 'mongoose';
import { AppError } from '../../errors/AppError.js';
import { getStockLockModel } from './models/StockLock.js';
import { getProductModel } from '../productos/models/Product.js';
import { getWarehouseModel } from './models/Warehouse.js';
import { getStockMovementModel } from './models/StockMovement.js';
import { stockSearchLiteral, type StockPageQuery } from './stockPagination.js';

export type Receipt = { companyId: string; branchId: string; warehouseId: string; productId: string; quantity: number; reference: string; userId: string };
// A transfer is one immutable document with two balance effects. This preserves
// the existing unique reference index without splitting an operation into writes.
function balanceEffects(): PipelineStage[] {
  return [
    { $project: { productId: 1, effects: { $concatArrays: [
      [{ warehouseId: '$warehouseId', quantity: '$quantity' }],
      { $cond: [{ $eq: ['$kind', 'TRANSFER'] }, [{ warehouseId: '$destinationWarehouseId', quantity: { $multiply: ['$quantity', -1] } }], []] }
    ] } } },
    { $unwind: '$effects' }
  ];
}
export async function receiveStock(input: Receipt) {
  return recordStock(input, 'RECEIPT');
}
export async function issueStock(input: Receipt) {
  return recordStock(input, 'ISSUE');
}
export async function transferStock(input: Receipt & { destinationWarehouseId: string }) {
  if (input.warehouseId === input.destinationWarehouseId || !input.destinationWarehouseId) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid transfer destination', friendlyMessage: 'Selecciona un almacén de destino diferente del origen.', statusCode: 400 });
  }
  return recordStock(input, 'TRANSFER');
}
export async function recordAuditedStock(input: Receipt & { destinationWarehouseId?: string }, kind: 'RECEIPT'|'ISSUE'|'TRANSFER', ipAddress?:string) {
  if(!input.userId.trim() || !input.companyId.trim() || !input.branchId.trim()) throw new AppError({code:'UNAUTHORIZED',message:'Missing audit scope',friendlyMessage:'La sesión requiere usuario, empresa y sucursal.',statusCode:401});
  if(kind==='TRANSFER' && (!input.destinationWarehouseId || input.destinationWarehouseId===input.warehouseId)) throw new AppError({code:'VALIDATION_ERROR',message:'Invalid transfer destination',friendlyMessage:'Selecciona un almacén de destino diferente del origen.',statusCode:400});
  const audit=getAuditEventModel();await Promise.all([audit.init(),getStockMovementModel().init(),getStockLockModel().init()]);
  const session=await mongoose.startSession();
  try{return await session.withTransaction(async()=>{
    const row=await recordStock(input,kind,session);
    await audit.create([{userId:input.userId,companyId:input.companyId,branchId:input.branchId,action:'CREATE',module:'inventario.movimientos',entityId:row.id,newState:row,details:{manual:true,kind,reference:row.reference},ipAddress}],{session});
    return row;
  });}finally{await session.endSession();}
}
export async function recordCommercialStock(input: Receipt, kind:'RECEIPT'|'ISSUE', session:mongoose.ClientSession) {
  if(!session.inTransaction())throw new AppError({code:'VALIDATION_ERROR',message:'Active transaction required',friendlyMessage:'La operación comercial requiere una transacción activa.',statusCode:400});
  return recordStock(input,kind,session);
}
async function recordStock(input: Receipt & { destinationWarehouseId?: string }, kind: 'RECEIPT' | 'ISSUE' | 'TRANSFER', sharedSession?: mongoose.ClientSession) {
  if (!Number.isFinite(input.quantity) || input.quantity < 0.000001 || !input.reference.trim() || input.reference.trim().length > 100) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid receipt', friendlyMessage: 'Revisa cantidad y referencia de la entrada.', statusCode: 400 });
  }
  const [warehouse, product, destination] = await Promise.all([
    getWarehouseModel().exists({ _id: input.warehouseId, companyId: input.companyId, branchId: input.branchId, status: 'ACTIVE' }),
    getProductModel().exists({ _id: input.productId, companyId: input.companyId, status: 'ACTIVE' }),
    kind === 'TRANSFER' ? getWarehouseModel().exists({ _id: input.destinationWarehouseId, companyId: input.companyId, branchId: input.branchId, status: 'ACTIVE' }) : Promise.resolve(true)
  ]);
  if (!warehouse || !product || !destination) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid stock references', friendlyMessage: 'Selecciona almacenes de tu sucursal y un producto activo de tu empresa.', statusCode: 400 });
  const movements = getStockMovementModel();
  const locks = getStockLockModel();
  // Ensure the reference uniqueness constraint exists before accepting writes.
  await movements.init();
  await locks.init();
  const keys = [input.warehouseId, ...(kind === 'TRANSFER' ? [input.destinationWarehouseId!] : [])]
    .map((warehouseId) => JSON.stringify([input.companyId, input.branchId, warehouseId, input.productId])).sort();
  // Deterministic ordering also covers transfers in opposite directions.
  for (const key of keys) await locks.updateOne({ _id: key }, { $setOnInsert: { version: 0 } }, { upsert: true, ...(sharedSession ? {session:sharedSession} : {}) });
  const session = sharedSession ?? await mongoose.startSession();
  try {
    const execute = async () => {
      for (const key of keys) await locks.updateOne({ _id: key }, { $inc: { version: 1 } }, { session });
      if (kind !== 'RECEIPT') {
        const balances = await movements.aggregate([
          { $match: { companyId: input.companyId, branchId: input.branchId, productId: input.productId } },
          ...balanceEffects(),
          { $match: { 'effects.warehouseId': input.warehouseId } },
          { $group: { _id: null, quantity: { $sum: '$effects.quantity' } } }
        ]).session(session).exec();
        if ((balances[0]?.quantity ?? 0) < input.quantity) {
          throw new AppError({ code: 'CONFLICT', message: 'Insufficient stock', friendlyMessage: 'No hay existencias suficientes en este almacén.', statusCode: 409 });
        }
      }
      const [row] = await movements.create([{ ...input, kind, quantity: kind === 'RECEIPT' ? input.quantity : -input.quantity, reference: input.reference.trim() }], { session });
      return { id: String(row._id), warehouseId: row.warehouseId, destinationWarehouseId: row.destinationWarehouseId, productId: row.productId, quantity: row.quantity, reference: row.reference, kind: row.kind };
    };
    return sharedSession ? await execute() : await session.withTransaction(execute);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      throw new AppError({ code: 'CONFLICT', message: 'Duplicate stock reference', friendlyMessage: 'Esta referencia ya fue registrada. No se duplicó el movimiento.', statusCode: 409 });
    }
    throw error;
  } finally { if (!sharedSession) await session.endSession(); }
}
export async function listStock(companyId: string, branchId: string) {
  return getStockMovementModel().aggregate([
    { $match: { companyId, branchId } },
    ...balanceEffects(),
    { $group: { _id: { warehouseId: '$effects.warehouseId', productId: '$productId' }, quantity: { $sum: '$effects.quantity' } } },
    { $project: { _id: 0, warehouseId: '$_id.warehouseId', productId: '$_id.productId', quantity: 1 } },
    { $sort: { warehouseId: 1, productId: 1 } }
  ]).exec();
}
type StockPageRow = { warehouseId: string; productId: string; quantity: number; productName?: string; productSku?: string; warehouseName?: string; warehouseCode?: string };
export async function pageStock(companyId: string, branchId: string, query: StockPageQuery, belowThreshold?:number) {
  const pipeline: PipelineStage[] = [
    { $match: { companyId, branchId } }, ...balanceEffects(),
    { $group: { _id: { warehouseId: '$effects.warehouseId', productId: '$productId' }, quantity: { $sum: '$effects.quantity' } } },
    { $project: { _id: 0, warehouseId: '$_id.warehouseId', productId: '$_id.productId', quantity: 1 } }
  ];
  if(belowThreshold!==undefined)pipeline.push({$match:{quantity:{$lt:belowThreshold}}});
  if (query.cursor) {
    const [warehouseId, productId] = query.cursor.split(':');
    pipeline.push({ $match: { $or: [{ warehouseId: { $gt: warehouseId } }, { warehouseId, productId: { $gt: productId } }] } });
  }
  pipeline.push(
    { $lookup: { from: getProductModel().collection.name, let: { id: { $convert: { input: '$productId', to: 'objectId', onError: null, onNull: null } } }, pipeline: [{ $match: { companyId, $expr: { $eq: ['$_id', '$$id'] } } }, { $project: { name: 1, sku: 1 } }], as: 'product' } },
    { $lookup: { from: getWarehouseModel().collection.name, let: { id: { $convert: { input: '$warehouseId', to: 'objectId', onError: null, onNull: null } } }, pipeline: [{ $match: { companyId, branchId, $expr: { $eq: ['$_id', '$$id'] } } }, { $project: { name: 1, code: 1 } }], as: 'warehouse' } },
    { $set: { productName: { $arrayElemAt: ['$product.name', 0] }, productSku: { $arrayElemAt: ['$product.sku', 0] }, warehouseName: { $arrayElemAt: ['$warehouse.name', 0] }, warehouseCode: { $arrayElemAt: ['$warehouse.code', 0] } } }
  );
  if (query.search) pipeline.push({ $match: { $or: ['productId', 'warehouseId', 'productName', 'productSku', 'warehouseName', 'warehouseCode'].map(field => ({ [field]: { $regex: stockSearchLiteral(query.search), $options: 'i' } })) } });
  pipeline.push({ $sort: { warehouseId: 1, productId: 1 } }, { $limit: query.limit + 1 }, { $project: { product: 0, warehouse: 0 } });
  const rows = await getStockMovementModel().aggregate<StockPageRow>(pipeline).exec();
  const items = rows.slice(0, query.limit), last = items[items.length - 1];
  return { items, nextCursor: rows.length > query.limit && last ? `${last.warehouseId}:${last.productId}` : null };
}

export async function pageStockAlerts(companyId:string,branchId:string,query:StockPageQuery){
 const config=await getModuleConfigModel().findOne({companyId,module:'inventario'}).lean().exec();const threshold=config?.config?.stockAlertThreshold;
 if(threshold===undefined)return {configured:false,threshold:null,configVersion:config?.version??null,items:[],nextCursor:null};
 if(typeof threshold!=='number'||!Number.isInteger(threshold)||threshold<0||threshold>1000000)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid stored threshold',friendlyMessage:'El umbral guardado no es válido. Revisa la configuración de inventario.',statusCode:400});
 return {configured:true,threshold,configVersion:config?.version??0,...await pageStock(companyId,branchId,query,threshold)};
}
