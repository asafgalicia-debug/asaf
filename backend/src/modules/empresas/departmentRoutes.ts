import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createDepartment, listDepartments } from './departmentService.js';

export function createDepartmentRoutes(): Router {
  const router = Router();

  router.get('/', authenticate, tenant, authorize('usuarios.ver'), (req, res) => {
    const companyId = req.user?.companyId ?? 'company-demo-01';
    const branchId = req.tenant?.branchId ?? 'branch-demo-01';

    res.json({
      ok: true,
      data: listDepartments(companyId, branchId)
    });
  });

  router.post('/', authenticate, tenant, authorize('usuarios.editar'), (req, res, next) => {
    try {
      const created = createDepartment({
        companyId: req.user?.companyId ?? 'company-demo-01',
        branchId: req.tenant?.branchId ?? 'branch-demo-01',
        name: req.body?.name,
        code: req.body?.code
      });

      res.status(201).json({ ok: true, data: created });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
