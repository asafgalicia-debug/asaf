import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createUserController, listUsersController, usersHealthController } from './userController.js';

export function createUserRoutes(): Router {
  const router = Router();

  router.get('/health', usersHealthController);
  router.get('/', authenticate, tenant, authorize('usuarios.ver'), listUsersController);
  router.post('/', authenticate, tenant, authorize('usuarios.crear'), createUserController);

  return router;
}
