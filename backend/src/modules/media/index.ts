import { Router } from 'express';
import { z } from 'zod';
import { container } from '../../core/di/container.js';
import { TYPES } from '../../core/di/identifiers.js';
import type { MediaController } from './controllers/media.controller.js';
import { requireAuth, optionalAuth } from '../auth/middlewares/auth.middleware.js';
import { requireRoomPermission } from '../rbac/middlewares/rbac.middleware.js';

import { Permission } from '../rbac/permissions.js';
import { validateRequest } from '../../core/middlewares/validate-request.middleware.js';

const addMediaSchema = z.object({
  url: z.string().min(3),
  title: z.string().max(150).optional(),
});

export function createMediaRoutes(): Router {
  const router = Router();
  const controller = container.resolve<MediaController>(TYPES.MediaController);

  router.post(
    '/rooms/:roomId',
    requireAuth,
    requireRoomPermission(Permission.PLAYBACK_CHANGE_MEDIA),
    validateRequest({ body: addMediaSchema }),
    controller.addMedia
  );

  router.get('/rooms/:roomId', optionalAuth, requireRoomPermission(Permission.ROOM_VIEW), controller.listMedia);

  return router;
}


export * from './providers/media-provider.interface.js';
export * from './providers/youtube.provider.js';
export * from './repositories/media.repository.interface.js';
export * from './repositories/prisma-media.repository.js';
export * from './services/media.service.js';
export * from './controllers/media.controller.js';
