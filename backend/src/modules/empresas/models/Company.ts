import mongoose, { Schema, type Model } from 'mongoose';

export type CompanyDocument = {
  _id: string;
  name: string;
  taxId: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
};

const schema = new Schema<CompanyDocument>({
  _id: { type: String, required: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  taxId: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true }
}, { timestamps: true, versionKey: false });

schema.index({ taxId: 1 });
schema.index({ status: 1, name: 1 });

let model: Model<CompanyDocument> | undefined;
export function getCompanyModel(): Model<CompanyDocument> {
  if (!model) model = mongoose.models.Company ?? mongoose.model<CompanyDocument>('Company', schema);
  return model;
}
