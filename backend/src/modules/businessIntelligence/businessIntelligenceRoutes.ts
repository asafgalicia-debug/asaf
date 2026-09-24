import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getBusinessIntelligenceSummary } from './businessIntelligenceService.js';

export function createBusinessIntelligenceRoutes(): Router {
  const router = Router();

  router.get('/summary', authenticate, tenant, authorize('dashboard.ver'), (_req, res) => {
    res.json({
      ok: true,
      data: getBusinessIntelligenceSummary()
    });
  });

  return router;
}
