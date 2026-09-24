import mongoose, { Schema, type Model } from 'mongoose';
export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type ProjectDocument = { companyId: string; branchId: string; customerId: string; name: string; status: ProjectStatus; progress: number; startDate: string; endDate: string; createdAt: Date; updatedAt: Date };
const schema = new Schema<ProjectDocument>({
  companyId: { type: String, required: true, trim: true }, branchId: { type: String, required: true, trim: true }, customerId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 120 }, status: { type: String, enum: ['ACTIVE','PAUSED','CLOSED'], default: 'ACTIVE', required: true },
  progress: { type: Number, default: 0, min: 0, max: 100 }, startDate: { type: String, required: true }, endDate: { type: String, required: true }
}, { timestamps: true });
schema.index({ companyId: 1, branchId: 1, status: 1, endDate: 1 });
let model: Model<ProjectDocument> | undefined;
export function getProjectModel(): Model<ProjectDocument> { if (!model) model = mongoose.models.Project ?? mongoose.model<ProjectDocument>('Project', schema); return model; }