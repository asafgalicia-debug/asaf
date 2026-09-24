import mongoose, { Schema, type Model } from 'mongoose';
export type CategoryDocument = { companyId: string; name: string; code: string; status: 'ACTIVE' | 'INACTIVE'; createdAt: Date; updatedAt: Date };
const schema = new Schema<CategoryDocument>({
  companyId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 24 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true }
}, { timestamps: true });
schema.index({ companyId: 1, code: 1 }, { unique: true });
let model: Model<CategoryDocument> | undefined;
export function getCategoryModel(): Model<CategoryDocument> {
  if (!model) model = mongoose.models.Category ?? mongoose.model<CategoryDocument>('Category', schema);
  return model;
}