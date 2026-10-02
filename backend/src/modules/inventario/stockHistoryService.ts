import { AppError } from '../../errors/AppError.js';
import { getStockMovementModel } from './models/StockMovement.js';

type HistoryQuery = { limit?: number; cursor?: string; reference?: string };
export async function listStockHistory(companyId: string, branchId: string, query: HistoryQuery = {}) {
  const limit = query.limit ?? 25;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 ||
      (query.cursor !== undefined && !/^[a-f\d]{24}$/i.test(query.cursor)) ||
      (query.reference !== undefined && (!query.reference.trim() || query.reference.trim().length > 100))) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid history query', friendlyMessage: 'Revisa los filtros del historial.', statusCode: 400 });
  }
  const rows = await getStockMovementModel().find({
    companyId, branchId,
    ...(query.cursor ? { _id: { $lt: query.cursor } } : {}),
    ...(query.reference ? { reference: query.reference.trim() } : {})
  }).select('_id kind warehouseId destinationWarehouseId productId quantity reference userId createdAt')
    .sort({ _id: -1 }).limit(limit + 1).lean().exec();
  const items = rows.slice(0, limit).map((row) => ({
    id: String(row._id), kind: row.kind ?? (row.quantity < 0 ? 'ISSUE' : 'RECEIPT'),
    warehouseId: row.warehouseId, destinationWarehouseId: row.destinationWarehouseId,
    productId: row.productId, quantity: row.quantity, reference: row.reference,
    userId: row.userId, createdAt: row.createdAt
  }));
  return { items, nextCursor: rows.length > limit ? items[items.length - 1].id : null };
}
