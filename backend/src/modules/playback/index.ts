import { Router } from 'express';
import { z } from 'zod';
import { container } from '../../core/di/container.js';
import { TYPES } from '../../core/di/identifiers.js';
import type { PlaybackController } from './controllers/playback.controller.js';
import { requireAuth, optionalAuth } from '../auth/middlewares/auth.middleware.js';
import { requireRoomPermission } from '../rbac/middlewares/rbac.middleware.js';
import { Permission } from '../rbac/permissions.js';
import { validateRequest } from '../../core/middlewares/validate-request.middleware.js';

const playbackActionSchema = z.object({
  action: z.enum(['PLAY', 'PAUSE', 'SEEK', 'CHANGE_VIDEO', 'CHANGE_RATE']),
  position: z.number().min(0).optional(),
  playbackRate: z.number().min(0.25).max(4.0).optional(),
  mediaId: z.string().uuid().optional(),
  clientTimestamp: z.number().optional(),
});

export function createPlaybackRoutes(): Router {
  const router = Router();
  const controller = container.resolve<PlaybackController>(TYPES.PlaybackController);

  router.get('/rooms/:roomId', optionalAuth, requireRoomPermission(Permission.ROOM_VIEW), controller.getState);
  router.get('/rooms/:roomId/position', optionalAuth, requireRoomPermission(Permission.ROOM_VIEW), controller.getCalculatedPosition);

  router.post(
    '/rooms/:roomId/action',
    requireAuth,
    requireRoomPermission(Permission.PLAYBACK_CONTROL),
    validateRequest({ body: playbackActionSchema }),
    controller.dispatchAction
  );

  router.get('/rooms/:roomId/history', optionalAuth, requireRoomPermission(Permission.ROOM_VIEW), controller.getHistory);

  return router;
}


export * from './engine/playback-sync.engine.js';
export * from './repositories/playback.repository.interface.js';
export * from './repositories/prisma-playback.repository.js';
export * from './services/playback.service.js';
export * from './controllers/playback.controller.js';
