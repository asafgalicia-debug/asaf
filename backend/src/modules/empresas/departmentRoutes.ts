import { Router, type Request } from 'express';

import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createDepartment, listDepartments } from './departmentService.js';

function getTenantScope(req: Request): { companyId: string; branchId: string } {
  const companyId = req.tenant?.companyId?.trim();
  const branchId = req.tenant?.branchId?.trim();
  if (!companyId || !branchId) {
    throw new AppError({
      code: 'UNAUTHORIZED',
      message: 'Tenant context unavailable',
      friendlyMessage: 'La sesiÃ³n no tiene una empresa y sucursal vÃ¡lidas.',
      statusCode: 401
    });
  }
  return { companyId, branchId };
}
export function createDepartmentRoutes(): Router {
  const router = Router();

  router.get('/', authenticate, tenant, authorize('usuarios.ver'), (req, res, next) => {
    try {
      const { companyId, branchId } = getTenantScope(req);
      res.json({ ok: true, data: listDepartments(companyId, branchId) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', authenticate, tenant, authorize('usuarios.editar'), (req, res, next) => {
    try {
      const { companyId, branchId } = getTenantScope(req);
      const created = createDepartment({ companyId, branchId, name: req.body?.name, code: req.body?.code });

      res.status(201).json({ ok: true, data: created });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
