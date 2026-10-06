import mongoose from 'mongoose';
import { getWarehouseModel } from '../inventario/models/Warehouse.js';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { catalogSlice, catalogFilter } from '../../core/catalogPagination.js';
import { getProductionOrderModel } from './models/ProductionOrder.js';
import { getProductModel } from '../productos/models/Product.js';
import { getAuditEventModel } from '../auditoria/models/AuditEvent.js';
import { getStockMovementModel } from '../inventario/models/StockMovement.js';
import { getStockLockModel } from '../inventario/models/StockLock.js';
import { recordCommercialStock } from '../inventario/stockService.js';

const id = z.string().regex(/^[a-f0-9]{24}$/i);
const quantity = z.number().finite().min(0.000001).max(1000000000).refine(n => Math.abs(n * 1e6 - Math.round(n * 1e6)) < 0.001);
export const productionCreateSchema = z.object({ productId: id, plannedQuantity: quantity }).strict();
export const productionStateSchema = z.object({ expectedStatus: z.enum(['planned', 'running']), status: z.enum(['running', 'cancelled']) }).strict();
export const productionCompleteSchema = z.object({ warehouseId: id, expectedQuantity: quantity }).strict();
const pageSchema = z.object({ status: z.enum(['planned', 'running', 'completed', 'cancelled']).optional(), cursor: id.optional(), limit: z.coerce.number().int().min(1).max(50).default(20) }).strict();
export function parseProductionPage(raw: unknown) { const p = pageSchema.safeParse(raw); if (!p.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid production page', friendlyMessage: 'Revisa la página de producción.', statusCode: 400 }); return p.data; }
const productPageSchema = pageSchema.omit({ status: true }).extend({ search: z.string().trim().max(100).default('') }).strict();
export function parseProductionProductPage(raw: unknown) { const p = productPageSchema.safeParse(raw); if (!p.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid product selector', friendlyMessage: 'Revisa la búsqueda de productos.', statusCode: 400 }); return p.data; }
type Scope = { companyId: string; branchId: string; userId: string; ipAddress?: string };
export async function pageProductionProducts(scope: Scope, query: z.infer<typeof productPageSchema>) {
  const filter = catalogFilter({ companyId: scope.companyId }, { ...query, status: 'ACTIVE' }, ['name', 'sku']);
  return catalogSlice(await getProductModel().find(filter).select('name sku companyId status').sort({ _id: -1 }).limit(query.limit + 1).lean().exec(), query.limit);
}
export async function pageProductionOrders(scope: Scope, query: z.infer<typeof pageSchema>) {
  const filter: Record<string, unknown> = { companyId: scope.companyId, branchId: scope.branchId };
  if (query.status) filter.status = query.status;
  if (query.cursor) filter._id = { $lt: query.cursor };
  const rows = await getProductionOrderModel().find(filter).sort({ _id: -1 }).limit(query.limit + 1).lean().exec();
  const ids = rows.map(row => row.productId).filter(value => /^[a-f0-9]{24}$/i.test(value));
  const warehouseIds = rows.map(row => row.completionWarehouseId).filter((value): value is string => !!value && /^[a-f0-9]{24}$/i.test(value));
  const [products, warehouses] = await Promise.all([getProductModel().find({ companyId: scope.companyId, _id: { $in: ids } }).select('name sku').lean().exec(), getWarehouseModel().find({ companyId: scope.companyId, branchId: scope.branchId, _id: { $in: warehouseIds } }).select('name').lean().exec()]);
  const names = new Map(products.map(row => [String(row._id), row]));
  const warehouseNames = new Map(warehouses.map(row => [String(row._id), row.name]));
  return catalogSlice(rows.map(row => ({ ...row, productName: names.get(row.productId)?.name, productSku: names.get(row.productId)?.sku, completionWarehouseName: warehouseNames.get(row.completionWarehouseId ?? '') })), query.limit);
}
export async function administerProduction(scope: Scope, operation: 'create' | 'state' | 'complete', payload: unknown, orderId?: string) {
  const parsed = operation === 'create' ? productionCreateSchema.safeParse(payload) : operation === 'state' ? productionStateSchema.safeParse(payload) : productionCompleteSchema.safeParse(payload);
  const invalid = () => new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid production operation', friendlyMessage: 'Revisa producto, cantidad, estado y almacén de producción.', statusCode: 400 });
  if (!scope.userId || !parsed.success || (operation !== 'create' && !id.safeParse(orderId).success)) throw invalid();
  await Promise.all([getProductionOrderModel().init(), getAuditEventModel().init(), getStockMovementModel().init(), getStockLockModel().init()]);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      let row;
      if (operation === 'create') {
        const input = parsed.data as z.infer<typeof productionCreateSchema>;
        if (!await getProductModel().exists({ _id: input.productId, companyId: scope.companyId, status: 'ACTIVE' }).session(session)) throw invalid();
        const [created] = await getProductionOrderModel().create([{ ...input, companyId: scope.companyId, branchId: scope.branchId, status: 'planned', completedQuantity: 0 }], { session });
        row = created.toObject();
      } else if (operation === 'state') {
        const input = parsed.data as z.infer<typeof productionStateSchema>;
        if (input.status === input.expectedStatus || (input.status === 'running' && input.expectedStatus !== 'planned')) throw invalid();
        row = await getProductionOrderModel().findOneAndUpdate({ _id: orderId, companyId: scope.companyId, branchId: scope.branchId, status: input.expectedStatus, completedQuantity: 0 }, { $set: { status: input.status } }, { new: true, session }).lean().exec();
      } else {
        const input = parsed.data as z.infer<typeof productionCompleteSchema>;
        row = await getProductionOrderModel().findOneAndUpdate({ _id: orderId, companyId: scope.companyId, branchId: scope.branchId, status: 'running', plannedQuantity: input.expectedQuantity, completedQuantity: 0 }, { $set: { status: 'completed', completedQuantity: input.expectedQuantity, completionWarehouseId: input.warehouseId } }, { new: true, session }).lean().exec();
        if (row) {
          const movement = await recordCommercialStock({ companyId: scope.companyId, branchId: scope.branchId, productId: row.productId, warehouseId: input.warehouseId, quantity: row.plannedQuantity, reference: 'PRODUCTION-' + orderId, userId: scope.userId }, 'RECEIPT', session);
          row = await getProductionOrderModel().findByIdAndUpdate(orderId, { $set: { completionMovementId: movement.id } }, { new: true, session }).lean().exec();
        }
      }
      if (!row) throw new AppError({ code: 'CONFLICT', message: 'Production order changed', friendlyMessage: 'La orden cambió o ya fue completada. Actualiza y revisa su movimiento antes de reintentar.', statusCode: 409 });
      await getAuditEventModel().create([{ userId: scope.userId, companyId: scope.companyId, branchId: scope.branchId, action: operation === 'create' ? 'CREATE' : 'UPDATE', module: 'produccion', entityId: String(row._id), details: { status: row.status, productId: row.productId, plannedQuantity: row.plannedQuantity, completedQuantity: row.completedQuantity, movementId: row.completionMovementId }, ipAddress: scope.ipAddress }], { session });
      const { _id, ...rest } = row;
      result = { id: String(_id), ...rest };
    });
    return result!;
  } finally { await session.endSession(); }
}
