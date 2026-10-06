import { z } from 'zod';
import { catalogFilter, catalogSlice } from '../../core/catalogPagination.js';
import mongoose, { type ClientSession } from 'mongoose';
import { getAuditEventModel } from '../auditoria/models/AuditEvent.js';
import { AppError } from '../../errors/AppError.js';
import { getCustomerModel } from '../clientes/models/Customer.js';
import { getSaleModel } from '../ventas/models/Sale.js';
import { getInvoiceModel, type InvoiceStatus } from './models/Invoice.js';
export type InvoiceRecord = { id: string; companyId: string; branchId: string; customerId: string; saleId: string; number: string; issueDate: string; dueDate: string; subtotal: number; taxRate: number; tax: number; total: number; status: InvoiceStatus };
export async function listInvoices(companyId: string, branchId: string): Promise<InvoiceRecord[]> { const rows = await getInvoiceModel().find({ companyId, branchId }).sort({ createdAt: -1 }).lean().exec(); return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row })); }
function validDate(value: string): boolean { const parsed = new Date(`${value}T00:00:00.000Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; }
export async function createInvoice(input: { companyId: string; branchId: string; saleId: string; number: string; issueDate: string; dueDate: string; taxRate: number }, session?: ClientSession): Promise<InvoiceRecord> {
  if (!validDate(input.issueDate) || !validDate(input.dueDate) || input.dueDate < input.issueDate || !input.number.trim() || !Number.isFinite(input.taxRate) || input.taxRate < 0 || input.taxRate > 100) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid invoice draft data', friendlyMessage: 'Revisa numero, fechas y tasa de impuesto del borrador.', statusCode: 400 });
  const sale = await getSaleModel().findOne({ _id: input.saleId, companyId: input.companyId, branchId: input.branchId }).session(session ?? null).lean().exec();
  if (!sale || sale.status === 'CANCELADA') throw new AppError({ code: 'VALIDATION_ERROR', message: 'Sale not available for invoicing', friendlyMessage: 'La venta no existe en esta sucursal o esta cancelada.', statusCode: 400 });
  const customer = await getCustomerModel().exists({ _id: sale.customerId, companyId: input.companyId, branchId: input.branchId, status: 'ACTIVE' }).session(session ?? null);
  if (!customer) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invoice customer is unavailable', friendlyMessage: 'El cliente de la venta no esta activo o no pertenece a tu empresa.', statusCode: 400 });
  const subtotal = Number(sale.total);
  const tax = Math.round(subtotal * input.taxRate) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  try {
    const data = { companyId: input.companyId, branchId: input.branchId, customerId: sale.customerId, saleId: input.saleId, number: input.number.trim().toUpperCase(), issueDate: input.issueDate, dueDate: input.dueDate, subtotal, taxRate: input.taxRate, tax, total, status: 'BORRADOR' as const };
    const row = session ? (await getInvoiceModel().create([data], { session }))[0] : await getInvoiceModel().create(data);
    return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, customerId: row.customerId, saleId: row.saleId, number: row.number, issueDate: row.issueDate, dueDate: row.dueDate, subtotal: row.subtotal, taxRate: row.taxRate, tax: row.tax, total: row.total, status: row.status };
  } catch (error) { if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Duplicate invoice number', friendlyMessage: 'Ya existe ese numero de factura en la empresa.', statusCode: 409 }); throw error; }
}
export async function createAuditedInvoice(input: Parameters<typeof createInvoice>[0], actor: { userId: string; ipAddress?: string }): Promise<InvoiceRecord> {
  if (!actor.userId.trim()) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing invoice actor', friendlyMessage: 'Inicia sesión para crear el borrador.', statusCode: 401 });
  await Promise.all([getInvoiceModel().init(), getAuditEventModel().init()]);
  const session = await mongoose.startSession();
  let result: InvoiceRecord | undefined;
  try {
    await session.withTransaction(async () => {
      const row = await createInvoice(input, session);
      await getAuditEventModel().create([{ userId: actor.userId, companyId: input.companyId, branchId: input.branchId, action: 'CREATE', module: 'facturacion', entityId: row.id, details: { status: row.status, total: row.total, saleId: row.saleId }, ipAddress: actor.ipAddress }], { session });
      result = row;
    });
    return result!;
  } finally { await session.endSession(); }
}

const invoicePageSchema = z.object({ search: z.string().trim().max(100).default(''), status: z.enum(['BORRADOR','EMITIDA','PAGADA','CANCELADA']).optional(), cursor: z.string().regex(/^[a-f0-9]{24}$/i).optional(), limit: z.coerce.number().int().min(1).max(50).default(20) }).strict();
export function parseInvoicePage(raw: unknown) {
 const parsed=invoicePageSchema.safeParse(raw);
 if (!parsed.success) throw new AppError({code:'VALIDATION_ERROR',message:'Invalid invoice page',friendlyMessage:'Revisa la búsqueda de borradores.',statusCode:400});
 return parsed.data;
}
export async function pageInvoices(companyId: string, branchId: string, query: ReturnType<typeof parseInvoicePage>) {
 const { status, ...page } = query;
 const filter=catalogFilter({companyId,branchId},page,['number']);
 if (status) filter.status=status;
 return catalogSlice(await getInvoiceModel().find(filter).sort({_id:-1}).limit(query.limit+1).lean().exec(),query.limit);
}

export const invoiceCancellationSchema = z.object({ expectedUpdatedAt: z.string().datetime(), reason: z.string().trim().min(3).max(300) }).strict();
export async function cancelInvoiceDraft(companyId: string, branchId: string, invoiceId: string, payload: unknown, actor: { userId: string; ipAddress?: string }) {
 const parsed=invoiceCancellationSchema.safeParse(payload);
 if (!parsed.success || !/^[a-f0-9]{24}$/i.test(invoiceId)) throw new AppError({code:'VALIDATION_ERROR',message:'Invalid draft cancellation',friendlyMessage:'Revisa el borrador y escribe el motivo de cancelación.',statusCode:400});
 if (!actor.userId.trim()) throw new AppError({code:'UNAUTHORIZED',message:'Missing invoice actor',friendlyMessage:'Inicia sesión para cancelar el borrador.',statusCode:401});
 await Promise.all([getInvoiceModel().init(),getAuditEventModel().init()]);
 const session=await mongoose.startSession();let result;
 try {
  await session.withTransaction(async()=>{
   const row=await getInvoiceModel().findOneAndUpdate({_id:invoiceId,companyId,branchId,status:'BORRADOR',updatedAt:new Date(parsed.data.expectedUpdatedAt)},{$set:{status:'CANCELADA'}},{new:true,session}).lean().exec();
   if (!row) throw new AppError({code:'CONFLICT',message:'Invoice draft changed',friendlyMessage:'El borrador cambió o ya no se puede cancelar. Actualiza la lista.',statusCode:409});
   await getAuditEventModel().create([{userId:actor.userId,companyId,branchId,action:'UPDATE',module:'facturacion',entityId:invoiceId,details:{previousStatus:'BORRADOR',status:'CANCELADA',reason:parsed.data.reason,number:row.number},ipAddress:actor.ipAddress}],{session});
   const {_id,...rest}=row;result={id:String(_id),...rest};
  });
  return result!;
 } finally {await session.endSession();}
}

const saleOptionsSchema=z.object({cursor:z.string().regex(/^[a-f0-9]{24}$/i).optional(),limit:z.coerce.number().int().min(1).max(50).default(20)}).strict();
export function parseInvoiceSaleOptions(raw:unknown){const parsed=saleOptionsSchema.safeParse(raw);if(!parsed.success)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid sale options',friendlyMessage:'Revisa la página de ventas.',statusCode:400});return parsed.data;}
export async function invoiceSaleOptions(companyId:string,branchId:string,query:ReturnType<typeof parseInvoiceSaleOptions>){
 const filter:Record<string,unknown>={companyId,branchId,status:{$ne:'CANCELADA'}};if(query.cursor)filter._id={$lt:query.cursor};
 const rows=await getSaleModel().find(filter).select('companyId branchId customerId total status createdAt').sort({_id:-1}).limit(query.limit+1).lean().exec();
 const customers=await getCustomerModel().find({companyId,branchId,_id:{$in:rows.map(r=>r.customerId)}}).select('name').lean().exec();const names=new Map(customers.map(c=>[String(c._id),c.name]));
 return catalogSlice(rows.map(r=>({...r,customerName:names.get(r.customerId)??'Cliente no disponible'})),query.limit);
}
