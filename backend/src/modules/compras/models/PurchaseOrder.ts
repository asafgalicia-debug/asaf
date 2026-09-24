import mongoose, { Schema, type Model } from 'mongoose';
export type PurchaseOrderStatus = 'PENDIENTE' | 'APROBADA' | 'RECIBIDA' | 'CANCELADA';
export type PurchaseOrderDocument = { companyId: string; branchId: string; supplierId: string; productId: string; quantity: number; unitCost: number; total: number; status: PurchaseOrderStatus; createdAt: Date; updatedAt: Date };
const schema = new Schema<PurchaseOrderDocument>({
  companyId: { type: String, required: true, trim: true }, branchId: { type: String, required: true, trim: true },
  supplierId: { type: String, required: true, trim: true }, productId: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0.000001 }, unitCost: { type: Number, required: true, min: 0 }, total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['PENDIENTE', 'APROBADA', 'RECIBIDA', 'CANCELADA'], default: 'PENDIENTE', required: true }
}, { timestamps: true });
schema.index({ companyId: 1, branchId: 1, createdAt: -1 });
let model: Model<PurchaseOrderDocument> | undefined;
export function getPurchaseOrderModel(): Model<PurchaseOrderDocument> {
  if (!model) model = mongoose.models.PurchaseOrder ?? mongoose.model<PurchaseOrderDocument>('PurchaseOrder', schema);
  return model;
}