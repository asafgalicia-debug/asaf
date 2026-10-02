import mongoose, { type PipelineStage } from 'mongoose';
import { AppError } from '../../errors/AppError.js';
import { getStockLockModel } from './models/StockLock.js';
import { getProductModel } from '../productos/models/Product.js';
import { getWarehouseModel } from './models/Warehouse.js';
import { getStockMovementModel } from './models/StockMovement.js';

type Receipt = { companyId: string; branchId: string; warehouseId: string; productId: string; quantity: number; reference: string; userId: string };
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
async function recordStock(input: Receipt & { destinationWarehouseId?: string }, kind: 'RECEIPT' | 'ISSUE' | 'TRANSFER') {
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
  for (const key of keys) await locks.updateOne({ _id: key }, { $setOnInsert: { version: 0 } }, { upsert: true });
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
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
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      throw new AppError({ code: 'CONFLICT', message: 'Duplicate stock reference', friendlyMessage: 'Esta referencia ya fue registrada. No se duplicó el movimiento.', statusCode: 409 });
    }
    throw error;
  } finally { await session.endSession(); }
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
