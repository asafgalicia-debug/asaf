import { AppError } from '../../errors/AppError.js';
import { getUserModel } from '../usuarios/models/User.js';
import { getNotificationModel, type NotificationChannel } from './models/Notification.js';

function serialize(row: Record<string, any>): Record<string, unknown> {
  const { _id, ...rest } = row;
  return { id: String(_id), ...rest, isRead: rest.status === 'READ' };
}

export async function listNotifications(companyId: string, branchId: string, userId: string): Promise<Array<Record<string, unknown>>> {
  const rows = await getNotificationModel().find({ companyId, branchId, userId }).sort({ createdAt: -1 }).lean().exec();
  return rows.map((row) => serialize(row as Record<string, any>));
}

export async function createNotification(input: {
  companyId: string; branchId: string; actorUserId: string; userId: string;
  title: string; message: string; channel: NotificationChannel;
}): Promise<Record<string, unknown>> {
  const companyId = input.companyId.trim();
  const branchId = input.branchId.trim();
  const recipientId = input.userId.trim();
  const title = input.title.trim();
  const message = input.message.trim();
  const channels: NotificationChannel[] = ['EMAIL', 'PUSH', 'IN_APP'];
  if (!companyId || !branchId || !input.actorUserId.trim() || !recipientId || !title || title.length > 120 || !message || message.length > 4000 || !channels.includes(input.channel)) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid notification input', friendlyMessage: 'Revisa el destinatario, canal, tÃ­tulo y contenido de la notificaciÃ³n.', statusCode: 400 });
  }
  const recipient = await getUserModel().exists({ _id: recipientId, companyId, branchId, isActive: true });
  if (!recipient) throw new AppError({ code: 'NOT_FOUND', message: 'Notification recipient not found', friendlyMessage: 'El destinatario no existe o no pertenece a esta empresa y sucursal.', statusCode: 404 });
  const status = input.channel === 'IN_APP' ? 'SENT' : 'PENDING';
  const row = await getNotificationModel().create({ companyId, branchId, userId: recipientId, title, message, channel: input.channel, status });
  return serialize(row.toObject() as Record<string, any>);
}

export async function markNotificationRead(companyId: string, branchId: string, userId: string, notificationId: string): Promise<Record<string, unknown>> {
  const row = await getNotificationModel().findOneAndUpdate(
    { _id: notificationId, companyId, branchId, userId },
    { $set: { status: 'READ' } },
    { new: true }
  ).lean().exec();
  if (!row) throw new AppError({ code: 'NOT_FOUND', message: 'Notification not found', friendlyMessage: 'La notificaciÃ³n no existe en tu bandeja.', statusCode: 404 });
  return serialize(row as Record<string, any>);
}
