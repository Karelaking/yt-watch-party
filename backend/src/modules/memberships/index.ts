import { Router } from 'express';
import { container } from '../../core/di/container.js';
import { TYPES } from '../../core/di/identifiers.js';
import type { MembershipController } from './controllers/membership.controller.js';
import { requireAuth, optionalAuth } from '../auth/middlewares/auth.middleware.js';
import { requireRoomPermission } from '../rbac/middlewares/rbac.middleware.js';
import { Permission } from '../rbac/permissions.js';
import { validateRequest } from '../../core/middlewares/validate-request.middleware.js';
import {
  joinRoomSchema,
  changeRoleSchema,
  kickMemberSchema,
  banMemberSchema,
} from './dtos/membership.dto.js';

export function createMembershipRoutes(): Router {
  const router = Router();
  const controller = container.resolve<MembershipController>(TYPES.MembershipController);

  router.post('/join', requireAuth, validateRequest({ body: joinRoomSchema }), controller.joinRoom);
  router.post('/leave/:roomId', requireAuth, controller.leaveRoom);

  router.get('/rooms/:roomId/members', optionalAuth, requireRoomPermission(Permission.ROOM_VIEW), controller.listMembers);

  router.patch(
    '/rooms/:roomId/role',
    requireAuth,
    requireRoomPermission(Permission.MEMBER_ROLE_CHANGE),
    validateRequest({ body: changeRoleSchema }),
    controller.changeRole
  );

  router.post(
    '/rooms/:roomId/kick',
    requireAuth,
    requireRoomPermission(Permission.MEMBER_KICK),
    validateRequest({ body: kickMemberSchema }),
    controller.kickMember
  );

  router.post(
    '/rooms/:roomId/ban',
    requireAuth,
    requireRoomPermission(Permission.MEMBER_BAN),
    validateRequest({ body: banMemberSchema }),
    controller.banMember
  );

  router.delete('/rooms/:roomId/ban/:userId', requireAuth, requireRoomPermission(Permission.MEMBER_BAN), controller.unbanMember);
  router.get('/rooms/:roomId/bans', requireAuth, requireRoomPermission(Permission.MEMBER_BAN), controller.listBans);

  return router;
}


export * from './repositories/membership.repository.interface.js';
export * from './repositories/prisma-membership.repository.js';
export * from './dtos/membership.dto.js';
export * from './services/membership.service.js';
export * from './controllers/membership.controller.js';
