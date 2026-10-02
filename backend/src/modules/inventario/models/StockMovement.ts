import mongoose, { Schema, type Model } from 'mongoose';
export type StockMovementDocument = {
  companyId: string; branchId: string; warehouseId: string; productId: string;
  quantity: number; reference: string; userId: string; createdAt: Date; kind: 'RECEIPT' | 'ISSUE' | 'TRANSFER'; destinationWarehouseId?: string;
};
const schema = new Schema<StockMovementDocument>({
  companyId: { type: String, required: true }, branchId: { type: String, required: true },
  warehouseId: { type: String, required: true }, productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  kind: { type: String, enum: ['RECEIPT', 'ISSUE', 'TRANSFER'], default: 'RECEIPT', required: true },
  destinationWarehouseId: { type: String },
  reference: { type: String, required: true, trim: true, maxlength: 100 },
  userId: { type: String, required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });
schema.index({ companyId: 1, branchId: 1, reference: 1 }, { unique: true });
schema.index({ companyId: 1, branchId: 1, warehouseId: 1, productId: 1 });
schema.index({ companyId: 1, branchId: 1, _id: -1 });
export function getStockMovementModel(): Model<StockMovementDocument> {
  return mongoose.models.StockMovement ?? mongoose.model<StockMovementDocument>('StockMovement', schema);
}
