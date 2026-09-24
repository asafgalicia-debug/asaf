import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getReleaseInfo } from './releaseService.js';

export function createReleaseRoutes(): Router {
  const router = Router();

  router.get('/info', authenticate, tenant, authorize('dashboard.ver'), (_req, res) => {
    res.json({
      ok: true,
      data: getReleaseInfo()
    });
  });

  return router;
}
