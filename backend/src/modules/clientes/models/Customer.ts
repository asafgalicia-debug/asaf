import mongoose, { Schema, type Model } from 'mongoose';

export type CustomerDocument = {
  companyId: string;
  branchId: string;
  name: string;
  taxId: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
};

const schema = new Schema<CustomerDocument>({
  companyId: { type: String, required: true, trim: true },
  branchId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  taxId: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true }
}, { timestamps: true });

schema.index({ companyId: 1, taxId: 1 }, { unique: true });
schema.index({ companyId: 1, branchId: 1, status: 1, name: 1 });
schema.index({ companyId: 1, branchId: 1, name: 1 });

let model: Model<CustomerDocument> | undefined;
export function getCustomerModel(): Model<CustomerDocument> {
  if (!model) model = mongoose.models.Customer ?? mongoose.model<CustomerDocument>('Customer', schema);
  return model;
}
