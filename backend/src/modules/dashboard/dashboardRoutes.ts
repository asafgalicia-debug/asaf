import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getDashboardSummary, listDashboardWidgets } from './dashboardService.js';

export function createDashboardRoutes(): Router {
  const router = Router();

  router.get('/summary', authenticate, tenant, authorize('dashboard.ver'), (req, res) => {
    const companyId = req.user?.companyId ?? 'company-demo-01';

    res.json({
      ok: true,
      data: getDashboardSummary(companyId)
    });
  });

  router.get('/widgets', authenticate, tenant, authorize('dashboard.ver'), (req, res) => {
    const companyId = req.user?.companyId ?? 'company-demo-01';

    res.json({
      ok: true,
      data: listDashboardWidgets(companyId)
    });
  });

  return router;
}
