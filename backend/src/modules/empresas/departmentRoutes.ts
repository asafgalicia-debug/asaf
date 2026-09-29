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
    throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context unavailable', friendlyMessage: 'La sesi\u00f3n no tiene una empresa y sucursal v\u00e1lidas.', statusCode: 401 });
  }
  return { companyId, branchId };
}

export function createDepartmentRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => {
    try {
      const { companyId, branchId } = getTenantScope(req);
      res.json({ ok: true, data: await listDepartments(companyId, branchId) });
    } catch (error) {
      next(error);
    }
  });
  router.post('/', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => {
    try {
      const { companyId, branchId } = getTenantScope(req);
      const { name, code } = req.body ?? {};
      if (typeof name !== 'string' || typeof code !== 'string') {
        throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid department input', friendlyMessage: 'Indica el nombre y c\u00f3digo del departamento.', statusCode: 400 });
      }
      const created = await createDepartment({ companyId, branchId, name, code });
      res.status(201).json({ ok: true, data: created });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
