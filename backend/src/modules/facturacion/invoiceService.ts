import { AppError } from '../../errors/AppError.js';
import { getCustomerModel } from '../clientes/models/Customer.js';
import { getSaleModel } from '../ventas/models/Sale.js';
import { getInvoiceModel, type InvoiceStatus } from './models/Invoice.js';
export type InvoiceRecord = { id: string; companyId: string; branchId: string; customerId: string; saleId: string; number: string; issueDate: string; dueDate: string; subtotal: number; taxRate: number; tax: number; total: number; status: InvoiceStatus };
export async function listInvoices(companyId: string, branchId: string): Promise<InvoiceRecord[]> { const rows = await getInvoiceModel().find({ companyId, branchId }).sort({ createdAt: -1 }).lean().exec(); return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row })); }
function validDate(value: string): boolean { const parsed = new Date(`${value}T00:00:00.000Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; }
export async function createInvoice(input: { companyId: string; branchId: string; saleId: string; number: string; issueDate: string; dueDate: string; taxRate: number }): Promise<InvoiceRecord> {
  if (!validDate(input.issueDate) || !validDate(input.dueDate) || input.dueDate < input.issueDate || !input.number.trim() || !Number.isFinite(input.taxRate) || input.taxRate < 0 || input.taxRate > 100) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid invoice draft data', friendlyMessage: 'Revisa numero, fechas y tasa de impuesto del borrador.', statusCode: 400 });
  const sale = await getSaleModel().findOne({ _id: input.saleId, companyId: input.companyId, branchId: input.branchId }).lean().exec();
  if (!sale || sale.status === 'CANCELADA') throw new AppError({ code: 'VALIDATION_ERROR', message: 'Sale not available for invoicing', friendlyMessage: 'La venta no existe en esta sucursal o esta cancelada.', statusCode: 400 });
  const customer = await getCustomerModel().exists({ _id: sale.customerId, companyId: input.companyId, status: 'ACTIVE' });
  if (!customer) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invoice customer is unavailable', friendlyMessage: 'El cliente de la venta no esta activo o no pertenece a tu empresa.', statusCode: 400 });
  const subtotal = Number(sale.total);
  const tax = Math.round(subtotal * input.taxRate) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  try {
    const row = await getInvoiceModel().create({ companyId: input.companyId, branchId: input.branchId, customerId: sale.customerId, saleId: input.saleId, number: input.number.trim().toUpperCase(), issueDate: input.issueDate, dueDate: input.dueDate, subtotal, taxRate: input.taxRate, tax, total, status: 'BORRADOR' });
    return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, customerId: row.customerId, saleId: row.saleId, number: row.number, issueDate: row.issueDate, dueDate: row.dueDate, subtotal: row.subtotal, taxRate: row.taxRate, tax: row.tax, total: row.total, status: row.status };
  } catch (error) { if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Duplicate invoice number', friendlyMessage: 'Ya existe ese numero de factura en la empresa.', statusCode: 409 }); throw error; }
}