import { AppError } from '../errors/AppError.js';
import { getAuditEventModel } from '../modules/auditoria/models/AuditEvent.js';

export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE';

export interface AuditEvent {
  userId: string;
  companyId: string;
  branchId: string;
  action: AuditAction;
  module: string;
  entityId?: string;
  previousState?: unknown;
  newState?: unknown;
  ipAddress?: string;
  details?: Record<string, unknown>;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  if (!event.userId.trim() || !event.companyId.trim() || !event.branchId.trim() || !event.module.trim()) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Incomplete audit context', friendlyMessage: 'No se pudo guardar el registro de auditoria.', statusCode: 400 });
  }
  const AuditEventModel = getAuditEventModel();
  await AuditEventModel.create({ ...event, module: event.module.trim(), createdAt: new Date() });
}

export async function listAuditEventsForTenant(companyId: string, branchId: string, limit: number): Promise<Array<Record<string, unknown>>> {
  const AuditEventModel = getAuditEventModel();
  const events = await AuditEventModel.find({ companyId, branchId }).sort({ createdAt: -1 }).limit(limit).lean().exec();
  return events.map(({ _id, ...event }) => ({ id: String(_id), ...event }));
}