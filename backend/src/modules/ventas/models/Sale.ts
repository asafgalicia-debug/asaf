import mongoose, { Schema, type Model } from 'mongoose';
export type SaleStatus = 'PENDIENTE' | 'PAGADA' | 'CANCELADA';
export type SaleDocument = { companyId: string; branchId: string; customerId: string; productId: string; quantity: number; unitPrice: number; total: number; status: SaleStatus; createdAt: Date; updatedAt: Date };
const schema = new Schema<SaleDocument>({
  companyId: { type: String, required: true, trim: true }, branchId: { type: String, required: true, trim: true },
  customerId: { type: String, required: true, trim: true }, productId: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0.000001 }, unitPrice: { type: Number, required: true, min: 0 }, total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['PENDIENTE', 'PAGADA', 'CANCELADA'], default: 'PENDIENTE', required: true }
}, { timestamps: true });
schema.index({ companyId: 1, branchId: 1, createdAt: -1 });
let model: Model<SaleDocument> | undefined;
export function getSaleModel(): Model<SaleDocument> {
  if (!model) model = mongoose.models.Sale ?? mongoose.model<SaleDocument>('Sale', schema);
  return model;
}