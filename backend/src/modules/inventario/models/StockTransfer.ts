import mongoose, { Schema, type Model } from 'mongoose';
export type StockTransferStatus = 'PENDIENTE' | 'EN-TR\u00c1NSITO' | 'RECIBIDO' | 'CANCELADO';
export type StockTransferDocument = { companyId: string; branchId: string; fromWarehouseId: string; toWarehouseId: string; productId: string; quantity: number; status: StockTransferStatus; createdAt: Date; updatedAt: Date };
const schema = new Schema<StockTransferDocument>({
  companyId: { type: String, required: true, trim: true }, branchId: { type: String, required: true, trim: true },
  fromWarehouseId: { type: String, required: true, trim: true }, toWarehouseId: { type: String, required: true, trim: true },
  productId: { type: String, required: true, trim: true }, quantity: { type: Number, required: true, min: 0.000001 },
  status: { type: String, enum: ['PENDIENTE', 'EN-TR\u00c1NSITO', 'RECIBIDO', 'CANCELADO'], default: 'PENDIENTE', required: true }
}, { timestamps: true });
schema.index({ companyId: 1, branchId: 1, createdAt: -1 });
let model: Model<StockTransferDocument> | undefined;
export function getStockTransferModel(): Model<StockTransferDocument> {
  if (!model) model = mongoose.models.StockTransfer ?? mongoose.model<StockTransferDocument>('StockTransfer', schema);
  return model;
}