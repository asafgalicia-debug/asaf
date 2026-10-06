import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { pageRolesController, roleStatusController, updateRoleController, createRoleController, listRolesController, resolveRoleController } from './roleController.js';

export function createRoleRoutes(): Router {
  const router = Router();

  router.get('/', authenticate, tenant, authorize('usuarios.ver'), listRolesController);
  router.get('/page',authenticate,tenant,authorize('usuarios.ver'),pageRolesController);
  router.get('/:roleName/permissions', authenticate, tenant, authorize('usuarios.ver'), resolveRoleController);
  router.post('/', authenticate, tenant, authorize('usuarios.editar'), createRoleController);

  router.patch('/:id/status',authenticate,tenant,authorize('usuarios.editar'),roleStatusController);
  router.patch('/:id',authenticate,tenant,authorize('usuarios.editar'),updateRoleController);
  return router;
}
