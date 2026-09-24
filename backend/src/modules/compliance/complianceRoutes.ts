import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getComplianceSummary } from './complianceService.js';

export function createComplianceRoutes(): Router {
  const router = Router();

  router.get('/summary', authenticate, tenant, authorize('dashboard.ver'), (_req, res) => {
    res.json({
      ok: true,
      data: getComplianceSummary()
    });
  });

  return router;
}
