import mongoose, { Schema, type Model } from 'mongoose';

export type SupplierDocument = {
  companyId: string;
  branchId: string;
  name: string;
  taxId: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
};

const schema = new Schema<SupplierDocument>({
  companyId: { type: String, required: true, trim: true },
  branchId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  taxId: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true }
}, { timestamps: true });

schema.index({ companyId: 1, taxId: 1 }, { unique: true });
schema.index({ companyId: 1, branchId: 1, status: 1, name: 1 });

let model: Model<SupplierDocument> | undefined;
export function getSupplierModel(): Model<SupplierDocument> {
  if (!model) model = mongoose.models.Supplier ?? mongoose.model<SupplierDocument>('Supplier', schema);
  return model;
}