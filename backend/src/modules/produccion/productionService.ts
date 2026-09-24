import { AppError } from '../../errors/AppError.js';
import { getProductModel } from '../productos/models/Product.js';
import { getProductionOrderModel, type ProductionOrderStatus } from './models/ProductionOrder.js';
export type ProductionOrder = { id: string; companyId: string; branchId: string; productId: string; plannedQuantity: number; completedQuantity: number; status: ProductionOrderStatus; createdAt: Date };
export type ProductionSummary = { companyId: string; branchId: string; metrics: { totalOrders: number; activeOrders: number; plannedUnits: number; completedUnits: number }; orders: ProductionOrder[] };
export async function listProductionOrders(companyId: string, branchId: string): Promise<ProductionOrder[]> { const rows = await getProductionOrderModel().find({ companyId, branchId }).sort({ createdAt: -1 }).lean().exec(); return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row })); }
export async function createProductionOrder(input: { companyId: string; branchId: string; productId: string; plannedQuantity: number }): Promise<ProductionOrder> {
  const product = await getProductModel().exists({ _id: input.productId, companyId: input.companyId, status: 'ACTIVE' });
  if (!product) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Production product unavailable', friendlyMessage: 'El producto debe existir, estar activo y pertenecer a tu empresa.', statusCode: 400 });
  const row = await getProductionOrderModel().create({ ...input, completedQuantity: 0, status: 'planned' });
  return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, productId: row.productId, plannedQuantity: row.plannedQuantity, completedQuantity: row.completedQuantity, status: row.status, createdAt: row.createdAt };
}
export async function getProductionSummary(companyId: string, branchId: string): Promise<ProductionSummary> {
  const orders = await listProductionOrders(companyId, branchId);
  return { companyId, branchId, metrics: { totalOrders: orders.length, activeOrders: orders.filter((order) => order.status === 'planned' || order.status === 'running').length, plannedUnits: orders.reduce((sum, order) => sum + order.plannedQuantity, 0), completedUnits: orders.reduce((sum, order) => sum + order.completedQuantity, 0) }, orders };
}