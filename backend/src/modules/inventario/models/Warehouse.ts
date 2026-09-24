import mongoose, { Schema, type Model } from 'mongoose';
export type WarehouseDocument = { companyId: string; branchId: string; name: string; code: string; status: 'ACTIVE' | 'INACTIVE'; createdAt: Date; updatedAt: Date };
const schema = new Schema<WarehouseDocument>({
  companyId: { type: String, required: true, trim: true }, branchId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 100 }, code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true }
}, { timestamps: true });
schema.index({ companyId: 1, branchId: 1, code: 1 }, { unique: true });
let model: Model<WarehouseDocument> | undefined;
export function getWarehouseModel(): Model<WarehouseDocument> {
  if (!model) model = mongoose.models.Warehouse ?? mongoose.model<WarehouseDocument>('Warehouse', schema);
  return model;
}