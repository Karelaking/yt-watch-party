import type { Request, Response, NextFunction } from 'express';
import { container } from '../../../core/di/container.js';
import { TYPES } from '../../../core/di/identifiers.js';
import type { IRbacPolicyEngine } from '../rbac-policy-engine.js';
import type { IRoomRepository, IRoomSettingsRepository, RoomEntity, RoomSettingsEntity } from '../../rooms/repositories/room.repository.interface.js';
import type { IMembershipRepository, IBanRepository, MembershipEntity } from '../../memberships/repositories/membership.repository.interface.js';
import { Permission, type RoomRole } from '../permissions.js';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../../core/errors/index.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      room?: RoomEntity;
      roomSettings?: RoomSettingsEntity | null;
      membership?: MembershipEntity;
    }
  }
}

function extractRoomIdentifier(req: Request): { id?: string; code?: string } {
  let roomId: string | undefined;
  if (typeof req.params['roomId'] === 'string') {
    roomId = req.params['roomId'];
  } else if (typeof req.params['id'] === 'string') {
    roomId = req.params['id'];
  } else if (req.body && typeof req.body['roomId'] === 'string') {
    roomId = req.body['roomId'];
  }

  let code: string | undefined;
  if (typeof req.params['code'] === 'string') {
    code = req.params['code'];
  } else if (typeof req.query['code'] === 'string') {
    code = req.query['code'];
  }

  if (roomId) return { id: roomId };
  if (code) return { code };
  return {};
}

export function requireRoomPermission(permission: Permission) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: roomId, code: roomCode } = extractRoomIdentifier(req);
      if (!roomId && !roomCode) {
        throw new NotFoundError('Room identifier missing from request');
      }

      const roomRepo = container.resolve<IRoomRepository>(TYPES.RoomRepository);
      const settingsRepo = container.resolve<IRoomSettingsRepository>(TYPES.RoomSettingsRepository);
      const memberRepo = container.resolve<IMembershipRepository>(TYPES.MembershipRepository);
      const banRepo = container.resolve<IBanRepository>(TYPES.BanRepository);
      const rbacEngine = container.resolve<IRbacPolicyEngine>(TYPES.RbacPolicyEngine);

      const room = roomId ? await roomRepo.findById(roomId) : await roomRepo.findByCode(roomCode!);
      if (!room) {
        throw new NotFoundError(`Room not found`);
      }

      // Fetch Room Settings
      const settings = await settingsRepo.findByRoomId(room.id);

      if (!req.user) {
        if (
          permission === Permission.ROOM_VIEW &&
          (room.visibility === 'PUBLIC' || room.visibility === 'UNLISTED' || settings?.allowGuestJoin)
        ) {
          req.room = room;
          req.roomSettings = settings;
          return next();
        }
        throw new UnauthorizedError('Authentication required');
      }

      // Check if user is banned
      const ban = await banRepo.findActiveBan(room.id, req.user.id);
      if (ban) {
        throw new ForbiddenError('You are banned from this room', 'ROOM_BANNED', {
          reason: ban.reason,
          expiresAt: ban.expiresAt,
        });
      }

      // Check Membership
      let membership = await memberRepo.findByRoomAndUser(room.id, req.user.id);

      // If user is the room owner but doesn't have a membership record yet, treat them as HOST
      let userRole: RoomRole;
      if (room.ownerId === req.user.id || room.ownerId === req.user.clerkUserId) {
        userRole = 'HOST';
      } else if (membership && membership.status === 'ACTIVE') {
        userRole = membership.role;
      } else {
        // Not a member yet
        if (
          permission === Permission.ROOM_VIEW &&
          (room.visibility === 'PUBLIC' || room.visibility === 'UNLISTED' || settings?.allowGuestJoin)
        ) {
          try {
            const activeCount = await memberRepo.countActiveMembers(room.id);
            if (activeCount < room.maxMembers) {
              const initialRole: RoomRole = settings?.requireApprovalToJoin ? 'VIEWER' : 'PARTICIPANT';
              membership = await memberRepo.create({
                roomId: room.id,
                userId: req.user.id,
                role: initialRole,
              });
              userRole = membership.role;
            } else {
              userRole = 'VIEWER';
            }
          } catch {
            userRole = 'VIEWER';
          }
        } else {
          throw new ForbiddenError('You are not an active member of this room', 'NOT_A_ROOM_MEMBER');
        }
      }

      const isAllowed = rbacEngine.can(userRole, settings, permission);
      if (!isAllowed) {
        throw new ForbiddenError(`You do not have permission to perform ${permission} in this room`);
      }

      req.room = room;
      req.roomSettings = settings;
      if (membership) {
        req.membership = membership;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRoomRole(allowedRoles: RoomRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id: roomId, code: roomCode } = extractRoomIdentifier(req);
      const roomRepo = container.resolve<IRoomRepository>(TYPES.RoomRepository);
      const memberRepo = container.resolve<IMembershipRepository>(TYPES.MembershipRepository);

      const room = roomId ? await roomRepo.findById(roomId) : await roomRepo.findByCode(roomCode!);
      if (!room) {
        throw new NotFoundError('Room not found');
      }

      const isOwner = room.ownerId === req.user.id || room.ownerId === req.user.clerkUserId;
      if (isOwner && allowedRoles.includes('HOST')) {
        req.room = room;
        return next();
      }

      const membership = await memberRepo.findByRoomAndUser(room.id, req.user.id);
      if (!membership || membership.status !== 'ACTIVE' || !allowedRoles.includes(membership.role)) {
        throw new ForbiddenError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`);
      }

      req.room = room;
      req.membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
}
