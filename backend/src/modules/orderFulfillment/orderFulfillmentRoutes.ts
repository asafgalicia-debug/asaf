import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getOrderFulfillmentSummary } from './orderFulfillmentService.js';

export function createOrderFulfillmentRoutes(): Router {
  const router = Router();

  router.get('/summary', authenticate, tenant, authorize('dashboard.ver'), (_req, res) => {
    res.json({
      ok: true,
      data: getOrderFulfillmentSummary()
    });
  });

  return router;
}
