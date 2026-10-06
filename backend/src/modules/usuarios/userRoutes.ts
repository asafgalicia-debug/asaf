import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createUserController, listUsersController, pageUsersController, renameUserController, updateUserAccessController, usersHealthController } from './userController.js';

export function createUserRoutes(): Router {
  const router = Router();

  router.get('/health', usersHealthController);
  router.get('/page', authenticate, tenant, authorize('usuarios.ver'), pageUsersController);
  router.get('/', authenticate, tenant, authorize('usuarios.ver'), listUsersController);
  router.post('/', authenticate, tenant, authorize('usuarios.crear'), createUserController);
  router.patch('/:id/name', authenticate, tenant, authorize('usuarios.editar'), renameUserController);
  router.patch('/:id/access', authenticate, tenant, authorize('usuarios.editar'), updateUserAccessController);

  return router;
}
