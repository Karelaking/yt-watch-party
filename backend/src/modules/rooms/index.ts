import { Router } from 'express';
import { container } from '../../core/di/container.js';
import { TYPES } from '../../core/di/identifiers.js';
import type { RoomController } from './controllers/room.controller.js';
import { requireAuth, optionalAuth } from '../auth/middlewares/auth.middleware.js';
import { requireRoomPermission } from '../rbac/middlewares/rbac.middleware.js';
import { Permission } from '../rbac/permissions.js';
import { validateRequest } from '../../core/middlewares/validate-request.middleware.js';
import { createRoomSchema, updateRoomSchema, updateSettingsSchema } from './dtos/room.dto.js';

export function createRoomRoutes(): Router {
  const router = Router();
  const controller = container.resolve<RoomController>(TYPES.RoomController);

  router.get('/public', optionalAuth, controller.listPublic);
  router.get('/my', requireAuth, controller.listMyRooms);
  router.post('/', requireAuth, validateRequest({ body: createRoomSchema }), controller.createRoom);

  router.get('/code/:code', optionalAuth, controller.getByCode);
  router.get('/:id', optionalAuth, requireRoomPermission(Permission.ROOM_VIEW), controller.getById);


  router.patch(
    '/:id',
    requireAuth,
    requireRoomPermission(Permission.ROOM_UPDATE_INFO),
    validateRequest({ body: updateRoomSchema }),
    controller.updateRoom
  );

  router.patch(
    '/:id/settings',
    requireAuth,
    requireRoomPermission(Permission.ROOM_UPDATE_SETTINGS),
    validateRequest({ body: updateSettingsSchema }),
    controller.updateSettings
  );

  router.delete('/:id', requireAuth, requireRoomPermission(Permission.ROOM_DELETE), controller.endRoom);

  return router;
}

export * from './repositories/room.repository.interface.js';
export * from './repositories/prisma-room.repository.js';
export * from './dtos/room.dto.js';
export * from './services/room.service.js';
export * from './controllers/room.controller.js';
