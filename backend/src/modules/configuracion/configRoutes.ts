import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getModuleConfig, listModuleConfigs } from './configService.js';

export function createConfigRoutes(): Router {
  const router = Router();

  router.get('/', authenticate, tenant, authorize('configuracion.ver'), (req, res) => {
    const companyId = req.user?.companyId ?? 'company-demo-01';

    res.json({
      ok: true,
      data: listModuleConfigs(companyId)
    });
  });

  router.get('/:module', authenticate, tenant, authorize('configuracion.ver'), (req, res, next) => {
    try {
      const companyId = req.user?.companyId ?? 'company-demo-01';
      const moduleName = String(req.params.module ?? '');

      res.json({
        ok: true,
        data: getModuleConfig(companyId, moduleName)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
