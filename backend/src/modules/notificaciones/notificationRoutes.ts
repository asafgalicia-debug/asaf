import { Router, type Request } from 'express';

import { logAuditEvent } from '../../audit/auditLogger.js';
import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createNotification, listNotifications, markNotificationRead } from './notificationService.js';
import type { NotificationChannel } from './models/Notification.js';

const channels: NotificationChannel[] = ['EMAIL', 'PUSH', 'IN_APP'];
function getContext(req: Request): { companyId: string; branchId: string; userId: string } {
  const context = req.tenant;
  if (!context?.companyId || !context.branchId || !context.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context unavailable', friendlyMessage: 'La sesiÃ³n no tiene un contexto vÃ¡lido.', statusCode: 401 });
  return { companyId: context.companyId, branchId: context.branchId, userId: context.userId };
}

export function createNotificationRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('notificaciones.ver'), async (req, res, next) => {
    try {
      const context = getContext(req);
      res.json({ ok: true, data: await listNotifications(context.companyId, context.branchId, context.userId) });
    } catch (error) { next(error); }
  });
  router.post('/', authenticate, tenant, authorize('notificaciones.configurar'), async (req, res, next) => {
    try {
      const context = getContext(req);
      const { userId, title, message, channel } = req.body ?? {};
      if (typeof userId !== 'string' || typeof title !== 'string' || typeof message !== 'string' || !channels.includes(channel)) {
        res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Datos de notificaciÃ³n invÃ¡lidos.' } });
        return;
      }
      const created = await createNotification({ ...context, actorUserId: context.userId, userId, title, message, channel });
      await logAuditEvent({ ...context, action: 'CREATE', module: 'notificaciones', entityId: String(created.id), details: { recipientId: userId, channel } });
      res.status(201).json({ ok: true, data: created });
    } catch (error) { next(error); }
  });
  router.patch('/:notificationId/read', authenticate, tenant, authorize('notificaciones.ver'), async (req, res, next) => {
    try {
      const context = getContext(req);
      const updated = await markNotificationRead(context.companyId, context.branchId, context.userId, String(req.params.notificationId ?? ''));
      res.json({ ok: true, data: updated });
    } catch (error) { next(error); }
  });
  return router;
}
