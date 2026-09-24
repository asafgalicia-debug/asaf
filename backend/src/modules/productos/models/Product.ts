import mongoose, { Schema, type Model } from 'mongoose';
export type ProductDocument = { companyId: string; categoryId: string; name: string; sku: string; price: number; status: 'ACTIVE' | 'INACTIVE'; createdAt: Date; updatedAt: Date };
const schema = new Schema<ProductDocument>({
  companyId: { type: String, required: true, trim: true },
  categoryId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 48 },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true }
}, { timestamps: true });
schema.index({ companyId: 1, sku: 1 }, { unique: true });
schema.index({ companyId: 1, categoryId: 1, status: 1 });
schema.index({ companyId: 1, name: 1 });
let model: Model<ProductDocument> | undefined;
export function getProductModel(): Model<ProductDocument> {
  if (!model) model = mongoose.models.Product ?? mongoose.model<ProductDocument>('Product', schema);
  return model;
}
