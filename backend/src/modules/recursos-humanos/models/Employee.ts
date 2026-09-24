import mongoose, { Schema, type Model } from 'mongoose';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
export type EmployeeDocument = { companyId: string; branchId: string; departmentId: string; userId: string; fullName: string; position: string; status: EmployeeStatus; createdAt: Date; updatedAt: Date };
const schema = new Schema<EmployeeDocument>({
  companyId: { type: String, required: true, trim: true }, branchId: { type: String, required: true, trim: true }, departmentId: { type: String, required: true, trim: true }, userId: { type: String, required: true, trim: true },
  fullName: { type: String, required: true, trim: true, maxlength: 120 }, position: { type: String, required: true, trim: true, maxlength: 100 }, status: { type: String, enum: ['ACTIVE','INACTIVE'], default: 'ACTIVE', required: true }
}, { timestamps: true });
schema.index({ companyId: 1, userId: 1 }, { unique: true });
schema.index({ companyId: 1, branchId: 1, departmentId: 1, status: 1 });
let model: Model<EmployeeDocument> | undefined;
export function getEmployeeModel(): Model<EmployeeDocument> { if (!model) model = mongoose.models.Employee ?? mongoose.model<EmployeeDocument>('Employee', schema); return model; }