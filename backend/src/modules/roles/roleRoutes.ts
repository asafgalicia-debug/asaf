import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createRoleController, listRolesController, resolveRoleController } from './roleController.js';

export function createRoleRoutes(): Router {
  const router = Router();

  router.get('/', authenticate, tenant, authorize('usuarios.ver'), listRolesController);
  router.get('/:roleName/permissions', authenticate, tenant, authorize('usuarios.ver'), resolveRoleController);
  router.post('/', authenticate, tenant, authorize('usuarios.editar'), createRoleController);

  return router;
}
