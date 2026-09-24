import { Router, type Request } from 'express';

import { logAuditEvent } from '../../audit/auditLogger.js';
import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createReport, listReports } from './reportService.js';
import type { ReportPeriod, ReportType } from './models/Report.js';

const reportTypes: ReportType[] = ['sales', 'cash-flow', 'inventory', 'financial'];
const reportPeriods: ReportPeriod[] = ['day', 'week', 'month', 'quarter', 'year'];

function getTenantContext(req: Request): { companyId: string; branchId: string; userId: string } {
  const context = req.tenant;
  if (!context?.companyId || !context.branchId || !context.userId) {
    throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context unavailable', friendlyMessage: 'La sesiÃ³n no tiene un contexto de empresa y sucursal vÃ¡lido.', statusCode: 401 });
  }
  return { companyId: context.companyId, branchId: context.branchId, userId: context.userId };
}

export function createReportRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('reportes.ver'), async (req, res, next) => {
    try {
      const context = getTenantContext(req);
      res.json({ ok: true, data: await listReports(context.companyId, context.branchId) });
    } catch (error) { next(error); }
  });
  router.post('/', authenticate, tenant, authorize('reportes.ver'), async (req, res, next) => {
    try {
      const context = getTenantContext(req);
      const { name, type, period, filters } = req.body ?? {};
      if (typeof name !== 'string' || !reportTypes.includes(type) || !reportPeriods.includes(period) ||
          (filters !== undefined && (filters === null || typeof filters !== 'object' || Array.isArray(filters)))) {
        res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Datos de reporte invÃ¡lidos.' } });
        return;
      }
      const created = await createReport({ ...context, name, type, period, filters });
      await logAuditEvent({ ...context, action: 'CREATE', module: 'reportes', entityId: String(created.id), details: { type, period } });
      res.status(201).json({ ok: true, data: created });
    } catch (error) { next(error); }
  });
  return router;
}
