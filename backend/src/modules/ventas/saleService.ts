import { AppError } from '../../errors/AppError.js';
import { getCustomerModel } from '../clientes/models/Customer.js';
import { getProductModel } from '../productos/models/Product.js';
import { getSaleModel, type SaleStatus } from './models/Sale.js';
export type SaleRecord = { id: string; companyId: string; branchId: string; customerId: string; productId: string; quantity: number; unitPrice: number; total: number; status: SaleStatus };
export async function listSales(companyId: string, branchId: string): Promise<SaleRecord[]> {
  const rows = await getSaleModel().find({ companyId, branchId }).sort({ createdAt: -1 }).lean().exec();
  return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row }));
}
export async function createSale(input: { companyId: string; branchId: string; customerId: string; productId: string; quantity: number }): Promise<SaleRecord> {
  const [customer, product] = await Promise.all([
    getCustomerModel().exists({ _id: input.customerId, companyId: input.companyId, status: 'ACTIVE' }),
    getProductModel().findOne({ _id: input.productId, companyId: input.companyId, status: 'ACTIVE' }).select('price').lean().exec()
  ]);
  if (!customer || !product) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Sale references are invalid', friendlyMessage: 'El cliente y el producto deben existir, estar activos y pertenecer a tu empresa.', statusCode: 400 });
  const unitPrice = Number(product.price);
  const total = Math.round(unitPrice * input.quantity * 100) / 100;
  const row = await getSaleModel().create({ ...input, unitPrice, total, status: 'PENDIENTE' });
  return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, customerId: row.customerId, productId: row.productId, quantity: row.quantity, unitPrice: row.unitPrice, total: row.total, status: row.status };
}