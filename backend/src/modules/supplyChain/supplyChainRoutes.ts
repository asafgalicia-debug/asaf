import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getSupplyChainSummary } from './supplyChainService.js';

export function createSupplyChainRoutes(): Router {
  const router = Router();

  router.get('/summary', authenticate, tenant, authorize('dashboard.ver'), (_req, res) => {
    res.json({
      ok: true,
      data: getSupplyChainSummary()
    });
  });

  return router;
}
