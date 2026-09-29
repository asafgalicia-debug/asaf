import mongoose, { Schema, type Model } from 'mongoose';

export type DepartmentDocument = {
  _id: string;
  companyId: string;
  branchId: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
};

const schema = new Schema<DepartmentDocument>({
  _id: { type: String, required: true },
  companyId: { type: String, required: true, trim: true },
  branchId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true }
}, { timestamps: true, versionKey: false });

schema.index({ companyId: 1, branchId: 1, code: 1 }, { unique: true });
schema.index({ companyId: 1, branchId: 1, status: 1, name: 1 });

let model: Model<DepartmentDocument> | undefined;
export function getDepartmentModel(): Model<DepartmentDocument> {
  if (!model) model = mongoose.models.Department ?? mongoose.model<DepartmentDocument>('Department', schema);
  return model;
}
