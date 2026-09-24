import { Router, type Request } from 'express';

import { logAuditEvent } from '../../audit/auditLogger.js';
import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createAIInsight, listAIInsights } from './aiService.js';
import type { AIInsightKind } from './models/AIInsight.js';

const kinds: AIInsightKind[] = ['forecast', 'anomaly', 'recommendation', 'summary'];
function getContext(req: Request): { companyId: string; branchId: string; userId: string } {
  const context = req.tenant;
  if (!context?.companyId || !context.branchId || !context.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context unavailable', friendlyMessage: 'La sesiÃ³n no tiene un contexto vÃ¡lido.', statusCode: 401 });
  return { companyId: context.companyId, branchId: context.branchId, userId: context.userId };
}

export function createAIRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('ia.consultar'), async (req, res, next) => {
    try {
      const context = getContext(req);
      res.json({ ok: true, data: await listAIInsights(context.companyId, context.branchId, context.userId) });
    } catch (error) { next(error); }
  });
  router.post('/', authenticate, tenant, authorize('ia.ejecutar'), async (req, res, next) => {
    try {
      const context = getContext(req);
      const { kind, title, data } = req.body ?? {};
      if (!kinds.includes(kind) || typeof title !== 'string' ||
          (data !== undefined && (data === null || typeof data !== 'object' || Array.isArray(data))) ||
          req.body?.summary !== undefined || req.body?.confidence !== undefined || req.body?.approved !== undefined) {
        res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'La API crea solicitudes pendientes; resultados y aprobaciones no se aceptan desde el cliente.' } });
        return;
      }
      const created = await createAIInsight({ ...context, kind, title, data });
      await logAuditEvent({ ...context, action: 'CREATE', module: 'inteligencia-artificial', entityId: String(created.id), details: { kind, status: 'PENDING' } });
      res.status(202).json({ ok: true, data: created });
    } catch (error) { next(error); }
  });
  return router;
}
