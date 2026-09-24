import mongoose, { Schema, type Model } from 'mongoose';

export type AIInsightKind = 'forecast' | 'anomaly' | 'recommendation' | 'summary';
export type AIJobStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type AIInsightDocument = {
  companyId: string;
  branchId: string;
  userId: string;
  kind: AIInsightKind;
  title: string;
  status: AIJobStatus;
  inputData: Record<string, unknown>;
  result?: { summary: string; confidence: number; data?: Record<string, unknown> };
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const schema = new Schema<AIInsightDocument>({
  companyId: { type: String, required: true, trim: true },
  branchId: { type: String, required: true, trim: true },
  userId: { type: String, required: true, trim: true },
  kind: { type: String, enum: ['forecast', 'anomaly', 'recommendation', 'summary'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'PENDING', required: true },
  inputData: { type: Schema.Types.Mixed, default: {} },
  result: { type: Schema.Types.Mixed },
  approved: { type: Boolean, default: false, required: true }
}, { timestamps: true });

schema.index({ companyId: 1, branchId: 1, userId: 1, createdAt: -1 });
let model: Model<AIInsightDocument> | undefined;
export function getAIInsightModel(): Model<AIInsightDocument> {
  if (!model) model = mongoose.models.AIInsight ?? mongoose.model<AIInsightDocument>('AIInsight', schema);
  return model;
}
