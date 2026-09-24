import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getDeploymentStatus } from './deploymentService.js';

export function createDeploymentRoutes(): Router {
  const router = Router();

  router.get('/status', authenticate, tenant, authorize('dashboard.ver'), (_req, res) => {
    res.json({
      ok: true,
      data: getDeploymentStatus()
    });
  });

  return router;
}
