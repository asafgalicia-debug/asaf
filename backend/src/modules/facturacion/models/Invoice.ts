import mongoose, { Schema, type Model } from 'mongoose';
export type InvoiceStatus = 'BORRADOR' | 'EMITIDA' | 'PAGADA' | 'CANCELADA';
export type InvoiceDocument = { companyId: string; branchId: string; customerId: string; saleId: string; number: string; issueDate: string; dueDate: string; subtotal: number; taxRate: number; tax: number; total: number; status: InvoiceStatus; createdAt: Date; updatedAt: Date };
const schema = new Schema<InvoiceDocument>({
  companyId: { type: String, required: true, trim: true }, branchId: { type: String, required: true, trim: true }, customerId: { type: String, required: true, trim: true }, saleId: { type: String, required: true, trim: true },
  number: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 }, issueDate: { type: String, required: true }, dueDate: { type: String, required: true },
  subtotal: { type: Number, required: true, min: 0 }, taxRate: { type: Number, required: true, min: 0, max: 100 }, tax: { type: Number, required: true, min: 0 }, total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['BORRADOR','EMITIDA','PAGADA','CANCELADA'], default: 'BORRADOR', required: true }
}, { timestamps: true });
schema.index({ companyId: 1, number: 1 }, { unique: true });
schema.index({ companyId: 1, branchId: 1, createdAt: -1 });
let model: Model<InvoiceDocument> | undefined;
export function getInvoiceModel(): Model<InvoiceDocument> { if (!model) model = mongoose.models.Invoice ?? mongoose.model<InvoiceDocument>('Invoice', schema); return model; }