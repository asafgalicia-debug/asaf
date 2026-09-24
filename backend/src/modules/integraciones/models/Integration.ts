import mongoose, { Schema, type Model } from 'mongoose';

export type IntegrationProvider = 'erp' | 'salesforce' | 'hubspot' | 'shopify' | 'sap' | 'custom';
export type IntegrationType = 'crm' | 'billing' | 'bank' | 'ecommerce' | 'logistics' | 'email' | 'ai';
export type IntegrationStatus = 'ACTIVE' | 'PAUSED' | 'ERROR';
export type IntegrationDocument = {
  companyId: string;
  branchId: string;
  createdBy: string;
  name: string;
  provider: IntegrationProvider;
  type: IntegrationType;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
};

const schema = new Schema<IntegrationDocument>({
  companyId: { type: String, required: true, trim: true },
  branchId: { type: String, required: true, trim: true },
  createdBy: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  provider: { type: String, enum: ['erp', 'salesforce', 'hubspot', 'shopify', 'sap', 'custom'], required: true },
  type: { type: String, enum: ['crm', 'billing', 'bank', 'ecommerce', 'logistics', 'email', 'ai'], required: true },
  status: { type: String, enum: ['ACTIVE', 'PAUSED', 'ERROR'], default: 'PAUSED', required: true },
  config: { type: Schema.Types.Mixed, default: {} },
  lastError: { type: String, maxlength: 500 }
}, { timestamps: true });

schema.index({ companyId: 1, branchId: 1, updatedAt: -1 });
schema.index({ companyId: 1, branchId: 1, provider: 1, name: 1 }, { unique: true });
let model: Model<IntegrationDocument> | undefined;
export function getIntegrationModel(): Model<IntegrationDocument> {
  if (!model) model = mongoose.models.Integration ?? mongoose.model<IntegrationDocument>('Integration', schema);
  return model;
}
