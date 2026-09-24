import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';

export function createCompanyRoutes(): Router {
  const router = Router();

  router.get('/', authenticate, tenant, authorize('usuarios.ver'), (_req, res) => {
    res.json({
      ok: true,
      data: [
        {
          id: 'company-demo-01',
          name: 'ERP Demo S.L.',
          taxId: 'B12345678',
          status: 'ACTIVE',
          branches: [{ id: 'branch-demo-01', name: 'Sucursal Central' }]
        }
      ]
    });
  });

  return router;
}
