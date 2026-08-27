import { Router } from 'express';
import { container } from '../../core/di/container.js';
import { TYPES } from '../../core/di/identifiers.js';
import type { PlaylistController } from './controllers/playlist.controller.js';
import { requireAuth, optionalAuth } from '../auth/middlewares/auth.middleware.js';
import { requireRoomPermission } from '../rbac/middlewares/rbac.middleware.js';
import { Permission } from '../rbac/permissions.js';
import { validateRequest } from '../../core/middlewares/validate-request.middleware.js';
import {
  createPlaylistSchema,
  addPlaylistItemSchema,
  reorderPlaylistSchema,
} from './dtos/playlist.dto.js';

export function createPlaylistRoutes(): Router {
  const router = Router();
  const controller = container.resolve<PlaylistController>(TYPES.PlaylistController);

  router.post(
    '/rooms/:roomId',
    requireAuth,
    requireRoomPermission(Permission.PLAYLIST_MANAGE),
    validateRequest({ body: createPlaylistSchema }),
    controller.createPlaylist
  );

  router.get('/rooms/:roomId', optionalAuth, requireRoomPermission(Permission.ROOM_VIEW), controller.listRoomPlaylists);
  router.get('/:id', optionalAuth, controller.getPlaylist);

  router.post(
    '/rooms/:roomId/:playlistId/items',
    requireAuth,
    requireRoomPermission(Permission.PLAYLIST_MANAGE),
    validateRequest({ body: addPlaylistItemSchema }),
    controller.addItem
  );

  router.delete(
    '/rooms/:roomId/items/:itemId',
    requireAuth,
    requireRoomPermission(Permission.PLAYLIST_MANAGE),
    controller.removeItem
  );

  router.post(
    '/rooms/:roomId/:playlistId/reorder',
    requireAuth,
    requireRoomPermission(Permission.PLAYLIST_MANAGE),
    validateRequest({ body: reorderPlaylistSchema }),
    controller.reorder
  );

  return router;
}


export * from './repositories/playlist.repository.interface.js';
export * from './repositories/prisma-playlist.repository.js';
export * from './dtos/playlist.dto.js';
export * from './services/playlist.service.js';
export * from './controllers/playlist.controller.js';
