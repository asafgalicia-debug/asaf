import mongoose, { Schema, type Model } from 'mongoose';

export type NotificationChannel = 'EMAIL' | 'PUSH' | 'IN_APP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'READ' | 'FAILED';
export type NotificationDocument = {
  companyId: string;
  branchId: string;
  userId: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
};

const schema = new Schema<NotificationDocument>({
  companyId: { type: String, required: true, trim: true },
  branchId: { type: String, required: true, trim: true },
  userId: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 4000 },
  channel: { type: String, enum: ['EMAIL', 'PUSH', 'IN_APP'], required: true },
  status: { type: String, enum: ['PENDING', 'SENT', 'READ', 'FAILED'], required: true }
}, { timestamps: true });

schema.index({ companyId: 1, branchId: 1, userId: 1, createdAt: -1 });
let model: Model<NotificationDocument> | undefined;
export function getNotificationModel(): Model<NotificationDocument> {
  if (!model) model = mongoose.models.Notification ?? mongoose.model<NotificationDocument>('Notification', schema);
  return model;
}
