import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createOpportunity, listOpportunities } from './opportunityService.js';

export function createOpportunityRoutes(): Router {
  const router = Router();

  router.get('/', authenticate, tenant, authorize('crm.ver'), (req, res) => {
    const companyId = req.user?.companyId ?? 'company-demo-01';

    res.json({
      ok: true,
      data: listOpportunities(companyId)
    });
  });

  router.post('/', authenticate, tenant, authorize('crm.crear'), (req, res, next) => {
    try {
      const created = createOpportunity({
        companyId: req.user?.companyId ?? 'company-demo-01',
        customerId: req.body?.customerId,
        name: req.body?.name,
        stage: req.body?.stage ?? 'QUALIFICATION',
        amount: req.body?.amount,
        status: req.body?.status ?? 'OPEN'
      });

      res.status(201).json({ ok: true, data: created });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
