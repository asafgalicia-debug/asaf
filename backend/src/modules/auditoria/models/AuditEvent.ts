import mongoose, { Schema, type Model } from 'mongoose';

export type AuditEventDocument = {
  companyId: string;
  branchId: string;
  userId: string;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE';
  module: string;
  entityId?: string;
  previousState?: unknown;
  newState?: unknown;
  ipAddress?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
};

const auditEventSchema = new Schema<AuditEventDocument>(
  {
    companyId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    action: { type: String, required: true, enum: ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'] },
    module: { type: String, required: true, trim: true, maxlength: 80 },
    entityId: { type: String, trim: true, maxlength: 120 },
    previousState: { type: Schema.Types.Mixed },
    newState: { type: Schema.Types.Mixed },
    ipAddress: { type: String, trim: true, maxlength: 64 },
    details: { type: Schema.Types.Mixed },
    createdAt: { type: Date, required: true, default: Date.now, index: true }
  },
  { versionKey: false }
);

auditEventSchema.index({ companyId: 1, branchId: 1, createdAt: -1 });
auditEventSchema.index({ companyId: 1, userId: 1, createdAt: -1 });

let AuditEventModel: Model<AuditEventDocument> | undefined;

export function getAuditEventModel(): Model<AuditEventDocument> {
  if (!AuditEventModel) AuditEventModel = mongoose.models.AuditEvent ?? mongoose.model<AuditEventDocument>('AuditEvent', auditEventSchema);
  return AuditEventModel;
}