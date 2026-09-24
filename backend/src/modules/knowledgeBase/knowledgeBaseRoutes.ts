import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getKnowledgeBaseSummary } from './knowledgeBaseService.js';

export function createKnowledgeBaseRoutes(): Router {
  const router = Router();

  router.get('/summary', authenticate, tenant, authorize('dashboard.ver'), (_req, res) => {
    res.json({
      ok: true,
      data: getKnowledgeBaseSummary()
    });
  });

  return router;
}
