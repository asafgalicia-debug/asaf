import { Router, type NextFunction, type Request, type Response } from 'express';
import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { listAuditEventsForTenant } from '../../audit/auditLogger.js';

function getTenant(req: Request): { companyId: string; branchId: string } {
  const companyId = req.tenant?.companyId;
  const branchId = req.tenant?.branchId;
  if (typeof companyId !== 'string' || !companyId.trim() || typeof branchId !== 'string' || !branchId.trim()) {
    throw new AppError({ code: 'UNAUTHORIZED', message: 'Incomplete tenant context', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 });
  }
  return { companyId, branchId };
}

function listAuditController(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    const tenantContext = getTenant(req);
    const rawLimit = req.query.limit;
    const limit = rawLimit === undefined ? 50 : Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid audit page size', friendlyMessage: 'El limite debe ser un numero entre 1 y 100.', statusCode: 400 });
    }
    const events = await listAuditEventsForTenant(tenantContext.companyId, tenantContext.branchId, limit);
    res.json({ ok: true, data: events });
  })().catch(next);
}

export function createAuditRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('auditoria.ver'), listAuditController);
  return router;
}