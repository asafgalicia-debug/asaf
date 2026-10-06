import mongoose, { Schema, type Model } from 'mongoose';
export type ProductionOrderStatus = 'planned' | 'running' | 'completed' | 'cancelled';
export type ProductionOrderDocument = { companyId: string; branchId: string; productId: string; plannedQuantity: number; completedQuantity: number; status: ProductionOrderStatus; materials?: { productId: string; warehouseId: string; quantity: number; movementId?: string; consumedQuantity?: number }[]; costCurrency?: string; productionCost?: number; deliveries?: { cost?: number; quantity: number; warehouseId: string; movementId: string; materials: { productId: string; warehouseId: string; quantity: number; movementId: string }[] }[]; completionWarehouseId?: string; completionMovementId?: string; createdAt: Date; updatedAt: Date };
const schema = new Schema<ProductionOrderDocument>({
  companyId: { type: String, required: true, trim: true }, branchId: { type: String, required: true, trim: true }, productId: { type: String, required: true, trim: true },
  plannedQuantity: { type: Number, required: true, min: 0.000001 }, completedQuantity: { type: Number, default: 0, min: 0 },
  materials: { type: [{ _id: false, productId: { type: String, required: true }, warehouseId: { type: String, required: true }, quantity: { type: Number, required: true, min: 0.000001 }, movementId: String, consumedQuantity: { type: Number, default: 0, min: 0 } }], default: [] },
  costCurrency: String, productionCost: { type: Number, default: 0, min: 0 },
  deliveries: { type: [{ _id: false, cost: Number, quantity: { type: Number, required: true }, warehouseId: { type: String, required: true }, movementId: { type: String, required: true }, materials: [{ _id: false, productId: String, warehouseId: String, quantity: Number, movementId: String }] }], default: [] },
  completionWarehouseId: { type: String }, completionMovementId: { type: String },
  status: { type: String, enum: ['planned','running','completed','cancelled'], default: 'planned', required: true }
}, { timestamps: true });
schema.index({ companyId: 1, branchId: 1, status: 1, createdAt: -1 });
schema.index({ companyId: 1, branchId: 1, _id: -1 });
let model: Model<ProductionOrderDocument> | undefined;
export function getProductionOrderModel(): Model<ProductionOrderDocument> { if (!model) model = mongoose.models.ProductionOrder ?? mongoose.model<ProductionOrderDocument>('ProductionOrder', schema); return model; }
