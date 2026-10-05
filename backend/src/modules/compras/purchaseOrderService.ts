import type { ClientSession } from 'mongoose';
import { commercialFilter, type CommercialQuery } from '../../core/commercialPagination.js';
import { catalogSlice } from '../../core/catalogPagination.js';
import { allowedTransactionTransition } from '../../core/transactionStatus.js';
import { AppError } from '../../errors/AppError.js';
import { getSupplierModel } from '../proveedores/models/Supplier.js';
import { getProductModel } from '../productos/models/Product.js';
import { getPurchaseOrderModel, type PurchaseOrderStatus } from './models/PurchaseOrder.js';
export type PurchaseOrderRecord = { id: string; companyId: string; branchId: string; supplierId: string; productId: string; quantity: number; unitCost: number; total: number; status: PurchaseOrderStatus };
export async function listPurchaseOrders(companyId: string, branchId: string): Promise<PurchaseOrderRecord[]> {
  const rows = await getPurchaseOrderModel().find({ companyId, branchId }).sort({ createdAt: -1 }).lean().exec();
  return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row }));
}
export async function createPurchaseOrder(input: { companyId: string; branchId: string; supplierId: string; productId: string; quantity: number; unitCost: number }, session?: ClientSession): Promise<PurchaseOrderRecord> {
  const [supplier, product] = await Promise.all([
    getSupplierModel().exists({ _id: input.supplierId, companyId: input.companyId, branchId: input.branchId, status: 'ACTIVE' }).session(session ?? null),
    getProductModel().exists({ _id: input.productId, companyId: input.companyId, status: 'ACTIVE' }).session(session ?? null)
  ]);
  if (!supplier || !product) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Purchase references are invalid', friendlyMessage: 'El proveedor y producto deben existir, estar activos y pertenecer a tu empresa; el contacto debe ser de tu sucursal.', statusCode: 400 });
  const total = Math.round(input.unitCost * input.quantity * 100) / 100;
  const row = session ? (await getPurchaseOrderModel().create([{ ...input, total, status: 'PENDIENTE' }], { session }))[0] : await getPurchaseOrderModel().create({ ...input, total, status: 'PENDIENTE' });
  return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, supplierId: row.supplierId, productId: row.productId, quantity: row.quantity, unitCost: row.unitCost, total: row.total, status: row.status };
}
export async function updatePurchaseOrderStatus(id: string, companyId: string, branchId: string, expectedStatus: PurchaseOrderStatus, status: PurchaseOrderStatus, session?: ClientSession): Promise<PurchaseOrderRecord> {
  if (!allowedTransactionTransition('purchase-orders', expectedStatus, status)) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Unsupported status transition', friendlyMessage: 'Este cambio de estado no está permitido.', statusCode: 400 });
  const row = await getPurchaseOrderModel().findOneAndUpdate(
    { _id: id, companyId, branchId, status: expectedStatus },
    { $set: { status } }, { new: true, runValidators: true, ...(session ? { session } : {}) }
  ).exec();
  if (!row) throw new AppError({ code: 'CONFLICT', message: 'Transaction unavailable or state changed', friendlyMessage: 'El registro cambió o no está disponible en esta sucursal. Actualiza el listado.', statusCode: 409 });
  return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, supplierId: row.supplierId, productId: row.productId, quantity: row.quantity, unitCost: row.unitCost, total: row.total, status: row.status };
}

export async function pagePurchaseOrders(companyId: string, branchId: string, query: CommercialQuery) { const rows = await getPurchaseOrderModel().find(commercialFilter(companyId, branchId, query)).sort({ _id: -1 }).limit(query.limit + 1).lean().exec(); return catalogSlice(rows, query.limit); }
