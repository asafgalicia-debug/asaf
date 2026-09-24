import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getContractManagementSummary } from './contractManagementService.js';

export function createContractManagementRoutes(): Router {
  const router = Router();

  router.get('/summary', authenticate, tenant, authorize('dashboard.ver'), (_req, res) => {
    res.json({
      ok: true,
      data: getContractManagementSummary()
    });
  });

  return router;
}
