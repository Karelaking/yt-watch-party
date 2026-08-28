import type {
  IMembershipRepository,
  IBanRepository,
  MembershipEntity,
  BanEntity,
} from '../repositories/membership.repository.interface.js';
import type { IRoomRepository, IRoomSettingsRepository } from '../../rooms/repositories/room.repository.interface.js';
import type { RoomRole } from '../../rbac/permissions.js';
import type { IEventDispatcher } from '../../../core/events/index.js';
import {
  MemberJoinedEvent,
  RoleChangedEvent,
  MemberLeftEvent,
  MemberRemovedEvent,
  MemberBannedEvent,
} from '../../../core/events/index.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../../core/errors/index.js';
import type { IService } from '../../../core/interfaces/index.js';

export interface IMembershipService extends IService {
  joinRoom(userId: string, roomCode: string, nickname?: string): Promise<MembershipEntity>;
  leaveRoom(userId: string, roomId: string): Promise<void>;
  listMembers(roomId: string): Promise<MembershipEntity[]>;
  changeRole(roomId: string, targetUserId: string, newRole: RoomRole, actorId: string, reason?: string): Promise<MembershipEntity>;
  kickMember(roomId: string, targetUserId: string, actorId: string): Promise<void>;
  banMember(roomId: string, targetUserId: string, actorId: string, reason?: string, expiresAt?: Date): Promise<BanEntity>;
  unbanMember(roomId: string, targetUserId: string): Promise<boolean>;
  listBans(roomId: string): Promise<BanEntity[]>;
}

export class MembershipService implements IMembershipService {
  constructor(
    private readonly membershipRepository: IMembershipRepository,
    private readonly banRepository: IBanRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly settingsRepository: IRoomSettingsRepository,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  public async joinRoom(userId: string, roomCode: string, nickname?: string): Promise<MembershipEntity> {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = await this.roomRepository.findByCode(cleanCode);
    if (!room) {
      throw new NotFoundError('Room not found with provided code');
    }

    if (room.status !== 'ACTIVE') {
      throw new BadRequestError(`Cannot join room: status is ${room.status.toLowerCase()}`);
    }

    // Check if user is banned
    const ban = await this.banRepository.findActiveBan(room.id, userId);
    if (ban) {
      throw new ForbiddenError('You are banned from this room', 'ROOM_BANNED', {
        reason: ban.reason,
        expiresAt: ban.expiresAt,
      });
    }

    // Check if already an active member
    const existing = await this.membershipRepository.findByRoomAndUser(room.id, userId);
    if (existing && existing.status === 'ACTIVE') {
      if (nickname && nickname !== existing.nickname) {
        return (
          (await this.membershipRepository.create({
            roomId: room.id,
            userId,
            role: existing.role,
            nickname,
          })) || existing
        );
      }
      return existing;
    }

    // Check capacity
    const activeCount = await this.membershipRepository.countActiveMembers(room.id);
    if (activeCount >= room.maxMembers) {
      throw new ForbiddenError('Room is currently full', 'ROOM_CAPACITY_REACHED');
    }

    const settings = await this.settingsRepository.findByRoomId(room.id);
    const initialRole: RoomRole = room.ownerId === userId ? 'HOST' : (settings?.requireApprovalToJoin ? 'VIEWER' : 'PARTICIPANT');

    const membership = await this.membershipRepository.create({
      roomId: room.id,
      userId,
      role: existing?.role || initialRole,
      nickname: nickname || existing?.nickname || null,
    });

    this.eventDispatcher.publish(new MemberJoinedEvent({
      roomId: room.id,
      userId,
      role: membership.role,
    }));

    return membership;
  }

  public async leaveRoom(userId: string, roomId: string): Promise<void> {
    const membership = await this.membershipRepository.findByRoomAndUser(roomId, userId);
    if (membership && membership.status === 'ACTIVE') {
      await this.membershipRepository.updateStatus(membership.id, 'LEFT');
      this.eventDispatcher.publish(new MemberLeftEvent({ roomId, userId }));
    }
  }

  public async listMembers(roomId: string): Promise<MembershipEntity[]> {
    return this.membershipRepository.listActiveRoomMembers(roomId);
  }

  public async changeRole(
    roomId: string,
    targetUserId: string,
    newRole: RoomRole,
    changedById: string,
    reason?: string
  ): Promise<MembershipEntity> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');

    if (newRole === 'HOST') {
      const membership = await this.membershipRepository.findByRoomAndUser(roomId, targetUserId);
      if (!membership || membership.status !== 'ACTIVE') {
        throw new NotFoundError('Target user is not an active member in this room');
      }

      // 1. Update room ownerId to new host
      await this.roomRepository.update(roomId, { ownerId: membership.userId });

      // 2. Demote previous owner to MODERATOR
      if (room.ownerId && room.ownerId !== membership.userId) {
        const prevOwnerMem = await this.membershipRepository.findByRoomAndUser(roomId, room.ownerId);
        if (prevOwnerMem && prevOwnerMem.status === 'ACTIVE') {
          await this.membershipRepository.updateRole(prevOwnerMem.id, 'MODERATOR', changedById, 'Host transferred');
          this.eventDispatcher.publish(new RoleChangedEvent({
            roomId,
            userId: room.ownerId,
            newRole: 'MODERATOR',
            changedById,
          }));
        }
      }

      // 3. Promote new host to HOST
      const updated = await this.membershipRepository.updateRole(membership.id, 'HOST', changedById, reason || 'Host transferred');
      if (!updated) {
        throw new NotFoundError('Failed to update member role');
      }

      this.eventDispatcher.publish(new RoleChangedEvent({
        roomId,
        userId: targetUserId,
        newRole: 'HOST',
        changedById,
      }));

      return updated;
    }

    if (targetUserId === room.ownerId) {
      throw new BadRequestError('Cannot demote the room owner from HOST without transferring host role first');
    }

    const membership = await this.membershipRepository.findByRoomAndUser(roomId, targetUserId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new NotFoundError('Target user is not an active member in this room');
    }

    const updated = await this.membershipRepository.updateRole(membership.id, newRole, changedById, reason);
    if (!updated) {
      throw new NotFoundError('Failed to update member role');
    }

    this.eventDispatcher.publish(new RoleChangedEvent({
      roomId,
      userId: targetUserId,
      newRole,
      changedById,
    }));

    return updated;
  }

  public async kickMember(roomId: string, targetUserId: string, actorId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');

    if (targetUserId === room.ownerId) {
      throw new BadRequestError('Cannot kick the room owner');
    }

    const membership = await this.membershipRepository.findByRoomAndUser(roomId, targetUserId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new NotFoundError('Target user is not an active member in this room');
    }

    await this.membershipRepository.updateStatus(membership.id, 'REMOVED');
    this.eventDispatcher.publish(new MemberRemovedEvent({
      roomId,
      userId: targetUserId,
      actorId,
    }));
  }

  public async banMember(
    roomId: string,
    targetUserId: string,
    actorId: string,
    reason?: string,
    expiresAt?: Date
  ): Promise<BanEntity> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');

    if (targetUserId === room.ownerId) {
      throw new BadRequestError('Cannot ban the room owner');
    }

    // Set membership status to BANNED if active
    const membership = await this.membershipRepository.findByRoomAndUser(roomId, targetUserId);
    if (membership) {
      await this.membershipRepository.updateStatus(membership.id, 'BANNED');
    }

    this.eventDispatcher.publish(new MemberBannedEvent({
      roomId,
      userId: targetUserId,
      actorId,
      reason,
    }));

    return this.banRepository.createBan({
      roomId,
      userId: targetUserId,
      createdById: actorId,
      type: 'USER',
      reason,
      expiresAt,
    });
  }

  public async unbanMember(roomId: string, targetUserId: string): Promise<boolean> {
    return this.banRepository.removeBan(roomId, targetUserId);
  }

  public async listBans(roomId: string): Promise<BanEntity[]> {
    return this.banRepository.listBans(roomId);
  }
}
