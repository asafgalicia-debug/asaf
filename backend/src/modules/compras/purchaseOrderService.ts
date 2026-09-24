import { AppError } from '../../errors/AppError.js';
import { getSupplierModel } from '../proveedores/models/Supplier.js';
import { getProductModel } from '../productos/models/Product.js';
import { getPurchaseOrderModel, type PurchaseOrderStatus } from './models/PurchaseOrder.js';
export type PurchaseOrderRecord = { id: string; companyId: string; branchId: string; supplierId: string; productId: string; quantity: number; unitCost: number; total: number; status: PurchaseOrderStatus };
export async function listPurchaseOrders(companyId: string, branchId: string): Promise<PurchaseOrderRecord[]> {
  const rows = await getPurchaseOrderModel().find({ companyId, branchId }).sort({ createdAt: -1 }).lean().exec();
  return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row }));
}
export async function createPurchaseOrder(input: { companyId: string; branchId: string; supplierId: string; productId: string; quantity: number; unitCost: number }): Promise<PurchaseOrderRecord> {
  const [supplier, product] = await Promise.all([
    getSupplierModel().exists({ _id: input.supplierId, companyId: input.companyId, status: 'ACTIVE' }),
    getProductModel().exists({ _id: input.productId, companyId: input.companyId, status: 'ACTIVE' })
  ]);
  if (!supplier || !product) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Purchase references are invalid', friendlyMessage: 'El proveedor y producto deben existir, estar activos y pertenecer a tu empresa.', statusCode: 400 });
  const total = Math.round(input.unitCost * input.quantity * 100) / 100;
  const row = await getPurchaseOrderModel().create({ ...input, total, status: 'PENDIENTE' });
  return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, supplierId: row.supplierId, productId: row.productId, quantity: row.quantity, unitCost: row.unitCost, total: row.total, status: row.status };
}