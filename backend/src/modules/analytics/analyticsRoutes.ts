import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getAnalyticsOverview } from './analyticsService.js';

export function createAnalyticsRoutes(): Router {
  const router = Router();

  router.get('/overview', authenticate, tenant, authorize('dashboard.ver'), (_req, res) => {
    res.json({
      ok: true,
      data: getAnalyticsOverview()
    });
  });

  return router;
}
