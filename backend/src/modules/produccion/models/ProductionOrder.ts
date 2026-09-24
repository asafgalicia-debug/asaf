import mongoose, { Schema, type Model } from 'mongoose';
export type ProductionOrderStatus = 'planned' | 'running' | 'completed' | 'cancelled';
export type ProductionOrderDocument = { companyId: string; branchId: string; productId: string; plannedQuantity: number; completedQuantity: number; status: ProductionOrderStatus; createdAt: Date; updatedAt: Date };
const schema = new Schema<ProductionOrderDocument>({
  companyId: { type: String, required: true, trim: true }, branchId: { type: String, required: true, trim: true }, productId: { type: String, required: true, trim: true },
  plannedQuantity: { type: Number, required: true, min: 0.000001 }, completedQuantity: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['planned','running','completed','cancelled'], default: 'planned', required: true }
}, { timestamps: true });
schema.index({ companyId: 1, branchId: 1, status: 1, createdAt: -1 });
let model: Model<ProductionOrderDocument> | undefined;
export function getProductionOrderModel(): Model<ProductionOrderDocument> { if (!model) model = mongoose.models.ProductionOrder ?? mongoose.model<ProductionOrderDocument>('ProductionOrder', schema); return model; }