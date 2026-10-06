import mongoose, { Schema, type Model } from 'mongoose';

export type UserDocument = {
  email: string;
  passwordHash: string;
  name: string;
  companyId: string;
  branchId: string;
  roleId: string;
  permissions: string[];
  isActive: boolean;
  sessionVersion: number;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  emailVerificationHash?: string;
  emailVerificationEmail?: string;
  emailVerificationExpiresAt?: Date;
  emailVerificationSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    companyId: { type: String, required: true },
    branchId: { type: String, required: true },
    roleId: { type: String, required: true },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0, select: false },
    lastLoginAt: { type: Date },
    emailVerifiedAt: {type:Date},
    emailVerificationHash: {type:String,select:false},
    emailVerificationEmail: {type:String,select:false},
    emailVerificationExpiresAt: {type:Date,select:false},
    emailVerificationSentAt: {type:Date,select:false}
  },
  {
    timestamps: true
  }
);

let UserModel: Model<UserDocument> | undefined;
userSchema.index({ companyId: 1, branchId: 1, _id: -1 });

export function getUserModel(): Model<UserDocument> {
  if (!UserModel) {
    UserModel = mongoose.models.User ?? mongoose.model<UserDocument>('User', userSchema);
  }

  return UserModel;
}
