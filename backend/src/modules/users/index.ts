import { Router } from 'express';
import { container } from '../../core/di/container.js';
import { TYPES } from '../../core/di/identifiers.js';
import type { UserController } from './controllers/user.controller.js';
import { requireAuth } from '../auth/middlewares/auth.middleware.js';
import { validateRequest } from '../../core/middlewares/validate-request.middleware.js';
import { updateUserSchema, recordDeviceSchema } from './dtos/user.dto.js';

export function createUserRoutes(): Router {
  const router = Router();
  const controller = container.resolve<UserController>(TYPES.UserController);

  router.use(requireAuth);

  router.get('/me', controller.getMe);
  router.patch('/me', validateRequest({ body: updateUserSchema }), controller.updateMe);
  router.post('/me/devices', validateRequest({ body: recordDeviceSchema }), controller.recordDevice);

  return router;
}

export * from './repositories/user.repository.interface.js';
export * from './repositories/prisma-user.repository.js';
export * from './dtos/user.dto.js';
export * from './services/user.service.js';
export * from './controllers/user.controller.js';
