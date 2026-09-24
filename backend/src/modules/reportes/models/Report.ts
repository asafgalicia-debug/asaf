import mongoose, { Schema, type Model } from 'mongoose';

export type ReportType = 'sales' | 'cash-flow' | 'inventory' | 'financial';
export type ReportPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type ReportDocument = {
  companyId: string;
  branchId: string;
  userId: string;
  name: string;
  type: ReportType;
  period: ReportPeriod;
  filters: Record<string, unknown>;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

const schema = new Schema<ReportDocument>({
  companyId: { type: String, required: true, trim: true },
  branchId: { type: String, required: true, trim: true },
  userId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  type: { type: String, enum: ['sales', 'cash-flow', 'inventory', 'financial'], required: true },
  period: { type: String, enum: ['day', 'week', 'month', 'quarter', 'year'], required: true },
  filters: { type: Schema.Types.Mixed, default: {} },
  data: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });

schema.index({ companyId: 1, branchId: 1, createdAt: -1 });

let model: Model<ReportDocument> | undefined;
export function getReportModel(): Model<ReportDocument> {
  if (!model) model = mongoose.models.Report ?? mongoose.model<ReportDocument>('Report', schema);
  return model;
}
