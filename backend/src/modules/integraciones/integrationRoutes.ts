import { Router, type Request } from 'express';

import { logAuditEvent } from '../../audit/auditLogger.js';
import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createIntegration, listIntegrations } from './integrationService.js';
import type { IntegrationProvider, IntegrationType } from './models/Integration.js';

const providers: IntegrationProvider[] = ['erp', 'salesforce', 'hubspot', 'shopify', 'sap', 'custom'];
const types: IntegrationType[] = ['crm', 'billing', 'bank', 'ecommerce', 'logistics', 'email', 'ai'];
function getContext(req: Request): { companyId: string; branchId: string; userId: string } {
  const context = req.tenant;
  if (!context?.companyId || !context.branchId || !context.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context unavailable', friendlyMessage: 'La sesiÃ³n no tiene un contexto vÃ¡lido.', statusCode: 401 });
  return { companyId: context.companyId, branchId: context.branchId, userId: context.userId };
}

export function createIntegrationRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('integraciones.ver'), async (req, res, next) => {
    try {
      const context = getContext(req);
      res.json({ ok: true, data: await listIntegrations(context.companyId, context.branchId) });
    } catch (error) { next(error); }
  });
  router.post('/', authenticate, tenant, authorize('integraciones.configurar'), async (req, res, next) => {
    try {
      const context = getContext(req);
      const { name, provider, type, config } = req.body ?? {};
      if (typeof name !== 'string' || !providers.includes(provider) || !types.includes(type) ||
          (config !== undefined && (config === null || typeof config !== 'object' || Array.isArray(config))) ||
          req.body?.status !== undefined || req.body?.lastError !== undefined) {
        res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Datos de integraciÃ³n invÃ¡lidos; el estado lo controla el servidor.' } });
        return;
      }
      const created = await createIntegration({ ...context, createdBy: context.userId, name, provider, type, config });
      await logAuditEvent({ ...context, action: 'CREATE', module: 'integraciones', entityId: String(created.id), details: { provider, type, status: 'PAUSED' } });
      res.status(201).json({ ok: true, data: created });
    } catch (error) { next(error); }
  });
  return router;
}
