import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getWarehouseOptimizationSummary } from './warehouseOptimizationService.js';

export function createWarehouseOptimizationRoutes(): Router {
  const router = Router();

  router.get('/summary', authenticate, tenant, authorize('dashboard.ver'), (_req, res) => {
    res.json({
      ok: true,
      data: getWarehouseOptimizationSummary()
    });
  });

  return router;
}
