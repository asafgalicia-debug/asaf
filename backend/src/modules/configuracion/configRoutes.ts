import { Router, type Request } from 'express';

import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getModuleConfig, listModuleConfigs } from './configService.js';

function getCompanyId(req: Request): string {
  const companyId = req.tenant?.companyId?.trim();
  if (!companyId) {
    throw new AppError({
      code: 'UNAUTHORIZED',
      message: 'Tenant context unavailable',
      friendlyMessage: 'La sesiÃ³n no tiene un contexto de empresa vÃ¡lido.',
      statusCode: 401
    });
  }
  return companyId;
}

export function createConfigRoutes(): Router {
  const router = Router();

  router.get('/', authenticate, tenant, authorize('configuracion.ver'), (req, res) => {
    const companyId = getCompanyId(req);

    res.json({
      ok: true,
      data: listModuleConfigs(companyId)
    });
  });

  router.get('/:module', authenticate, tenant, authorize('configuracion.ver'), (req, res, next) => {
    try {
      const companyId = getCompanyId(req);
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
