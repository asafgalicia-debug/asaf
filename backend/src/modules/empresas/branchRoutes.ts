import { Router, type Request } from 'express';

import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createBranch, listBranches } from './branchService.js';

function getCompanyId(req: Request): string {
  const companyId = req.tenant?.companyId?.trim();
  if (!companyId) {
    throw new AppError({
      code: 'UNAUTHORIZED',
      message: 'Tenant context unavailable',
      friendlyMessage: 'La sesiÃ³n no tiene una empresa vÃ¡lida.',
      statusCode: 401
    });
  }
  return companyId;
}

export function createBranchRoutes(): Router {
  const router = Router();

  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => {
    try {
      res.json({ ok: true, data: await listBranches(getCompanyId(req)) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => {
    try {
      const { name, code, city } = req.body ?? {};
      if (typeof name !== 'string' || typeof code !== 'string' || typeof city !== 'string') {
        throw new AppError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid branch input',
          friendlyMessage: 'Indica el nombre, cÃ³digo y ciudad de la sucursal.',
          statusCode: 400
        });
      }
      const branch = await createBranch({ companyId: getCompanyId(req), name, code, city });
      res.status(201).json({ ok: true, data: branch });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
