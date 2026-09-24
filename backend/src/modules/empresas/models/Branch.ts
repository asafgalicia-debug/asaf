import mongoose, { Schema, type Model } from 'mongoose';

export type BranchDocument = {
  _id: string;
  companyId: string;
  name: string;
  code: string;
  city: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const schema = new Schema<BranchDocument>({
  _id: { type: String, required: true },
  companyId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
  city: { type: String, required: true, trim: true, maxlength: 120 },
  isActive: { type: Boolean, default: true, required: true }
}, { timestamps: true, versionKey: false });

schema.index({ companyId: 1, code: 1 }, { unique: true });
schema.index({ companyId: 1, isActive: 1, name: 1 });

let model: Model<BranchDocument> | undefined;
export function getBranchModel(): Model<BranchDocument> {
  if (!model) model = mongoose.models.Branch ?? mongoose.model<BranchDocument>('Branch', schema);
  return model;
}
