import { Router } from 'express';
import { AppError } from '../../errors/AppError.js';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getDashboardSummary, listDashboardWidgets } from './dashboardService.js';

export function createDashboardRoutes(): Router {
  const router = Router();

  router.get('/summary', authenticate, tenant, authorize('dashboard.ver'), async (req, res, next) => {
    try {
    const { companyId, branchId } = req.tenant!;
    if (!companyId || !branchId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing tenant scope', friendlyMessage: 'La sesión requiere empresa y sucursal.', statusCode: 401 });

    res.json({
      ok: true,
      data: await getDashboardSummary(companyId, branchId)
    });
    } catch (error) { next(error); }
  });

  router.get('/widgets', authenticate, tenant, authorize('dashboard.ver'), async (req, res, next) => {
    try {
    const { companyId, branchId } = req.tenant!;
    if (!companyId || !branchId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing tenant scope', friendlyMessage: 'La sesión requiere empresa y sucursal.', statusCode: 401 });

    res.json({
      ok: true,
      data: await listDashboardWidgets(companyId, branchId)
    });
    } catch (error) { next(error); }
  });

  return router;
}
