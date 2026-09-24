import { AppError } from '../../errors/AppError.js';

export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE';

export type AuditEventRecord = {
  id: string;
  companyId: string;
  branchId?: string;
  userId?: string;
  action: AuditAction;
  module: string;
  entityId?: string;
  previousState?: unknown;
  newState?: unknown;
  ipAddress?: string;
  details?: Record<string, unknown>;
  createdAt: string;
};

const auditEvents: Record<string, AuditEventRecord> = {
  'audit-demo-01': {
    id: 'audit-demo-01',
    companyId: 'company-demo-01',
    branchId: 'branch-demo-01',
    userId: 'user-demo-01',
    action: 'UPDATE',
    module: 'ventas',
    entityId: 'sale-demo-01',
    previousState: { status: 'PENDIENTE' },
    newState: { status: 'PAGADA' },
    ipAddress: '127.0.0.1',
    details: { reason: 'Cobro confirmado' },
    createdAt: new Date().toISOString()
  }
};

export function listAuditEvents(companyId: string): AuditEventRecord[] {
  return Object.values(auditEvents).filter((event) => event.companyId === companyId);
}

export function createAuditEvent(input: {
  companyId: string;
  branchId?: string;
  userId?: string;
  action: AuditAction;
  module: string;
  entityId?: string;
  previousState?: unknown;
  newState?: unknown;
  ipAddress?: string;
  details?: Record<string, unknown>;
}): AuditEventRecord {
  const companyId = input.companyId.trim();
  const module = input.module.trim();

  if (!companyId || !module || !input.action) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Evento de auditoría incompleto',
      friendlyMessage: 'Debe indicar empresa, módulo y acción válidos.',
      statusCode: 400
    });
  }

  const event: AuditEventRecord = {
    id: `audit-${Date.now()}`,
    companyId,
    branchId: input.branchId?.trim(),
    userId: input.userId?.trim(),
    action: input.action,
    module,
    entityId: input.entityId?.trim(),
    previousState: input.previousState,
    newState: input.newState,
    ipAddress: input.ipAddress?.trim(),
    details: input.details,
    createdAt: new Date().toISOString()
  };

  auditEvents[event.id] = event;
  return event;
}
