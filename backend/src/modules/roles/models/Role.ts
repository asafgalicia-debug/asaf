import mongoose, { Schema, type Model } from 'mongoose';

export type RoleDocument = {
  name: string;
  description: string;
  permissions: string[];
  companyId?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const roleSchema = new Schema<RoleDocument>(
  {
    name: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    permissions: [{ type: String, trim: true }],
    companyId: { type: String, required: false, index: true },
    isSystem: { type: Boolean, default: false }
  },
  { timestamps: true }
);

roleSchema.index({ companyId: 1, name: 1 }, { unique: true, partialFilterExpression: { companyId: { $type: 'string' } } });

let RoleModel: Model<RoleDocument> | undefined;

export function getRoleModel(): Model<RoleDocument> {
  if (!RoleModel) RoleModel = mongoose.models.Role ?? mongoose.model<RoleDocument>('Role', roleSchema);
  return RoleModel;
}