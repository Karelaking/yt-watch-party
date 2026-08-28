import type { IRoomRepository, IRoomSettingsRepository, RoomEntity, RoomSettingsEntity } from '../repositories/room.repository.interface.js';
import type { CreateRoomDto, UpdateRoomDto, UpdateSettingsDto } from '../dtos/room.dto.js';
import type { IEventDispatcher } from '../../../core/events/index.js';
import { RoomCreatedEvent } from '../../../core/events/index.js';
import { NotFoundError, ConflictError } from '../../../core/errors/index.js';
import type { IService } from '../../../core/interfaces/index.js';

import type { IMembershipRepository, IBanRepository } from '../../memberships/repositories/membership.repository.interface.js';
import type { IMessageRepository } from '../../chat/repositories/message.repository.interface.js';
import type { Redis } from 'ioredis';
import { RedisKeys } from '../../../infrastructure/redis/redis-keys.js';
import { RoomEndedEvent, MemberJoinedEvent, SettingsUpdatedEvent } from '../../../core/events/index.js';
import type { RoomRole } from '../../rbac/permissions.js';

export interface IRoomService extends IService {
  createRoom(userId: string, data: CreateRoomDto): Promise<{ room: RoomEntity; settings: RoomSettingsEntity }>;
  getRoomByCode(code: string, userId?: string): Promise<{ room: RoomEntity; settings: RoomSettingsEntity | null }>;
  getRoomById(id: string, userId?: string): Promise<{ room: RoomEntity; settings: RoomSettingsEntity | null }>;
  listPublicRooms(limit?: number, offset?: number): Promise<RoomEntity[]>;
  listUserRooms(userId: string): Promise<RoomEntity[]>;
  updateRoom(roomId: string, data: UpdateRoomDto): Promise<RoomEntity>;
  updateSettings(roomId: string, settings: UpdateSettingsDto): Promise<RoomSettingsEntity>;
  endRoom(roomId: string): Promise<void>;
}

export class RoomService implements IRoomService {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly settingsRepository: IRoomSettingsRepository,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly membershipRepository?: IMembershipRepository,
    private readonly banRepository?: IBanRepository,
    private readonly messageRepository?: IMessageRepository,
    private readonly redisClient?: Redis
  ) {}

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public async createRoom(
    userId: string,
    data: CreateRoomDto
  ): Promise<{ room: RoomEntity; settings: RoomSettingsEntity }> {
    let code = this.generateRoomCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await this.roomRepository.findByCode(code);
      if (!existing) break;
      code = this.generateRoomCode();
      attempts++;
    }

    if (data.slug) {
      const existingSlug = await this.roomRepository.findBySlug(data.slug);
      if (existingSlug) {
        throw new ConflictError('Room slug is already in use');
      }
    }

    const createdRoom = await this.roomRepository.create({
      code,
      name: data.name,
      description: data.description ?? null,
      slug: data.slug ?? null,
      ownerId: userId,
      visibility: data.visibility ?? 'PRIVATE',
      maxMembers: data.maxMembers ?? 50,
      discoverable: data.discoverable ?? false,
    });

    const createdSettings = await this.settingsRepository.create(createdRoom.id, data.settings);

    this.eventDispatcher.publish(new RoomCreatedEvent({
      roomId: createdRoom.id,
      code: createdRoom.code,
      ownerId: userId,
    }));

    return {
      room: createdRoom,
      settings: createdSettings,
    };
  }

  public async getRoomByCode(
    code: string,
    userId?: string
  ): Promise<{ room: RoomEntity; settings: RoomSettingsEntity | null }> {
    const cleanCode = code.trim().toUpperCase();
    let room = await this.roomRepository.findByCode(cleanCode);
    if (!room && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code.trim())) {
      room = await this.roomRepository.findById(code.trim().toLowerCase());
    }
    if (!room) throw new NotFoundError('Room not found with provided code');
    if (room.status !== 'ACTIVE') throw new NotFoundError(`Room is no longer active (status: ${room.status.toLowerCase()})`);

    const settings = await this.settingsRepository.findByRoomId(room.id);

    if (userId) {
      // Check if user is banned
      if (this.banRepository) {
        const ban = await this.banRepository.findActiveBan(room.id, userId);
        if (ban) {
          throw new ConflictError('You are banned from this room');
        }
      }

      // Check / auto-create active membership for authenticated user if not owner
      if (this.membershipRepository && room.ownerId !== userId) {
        const existing = await this.membershipRepository.findByRoomAndUser(room.id, userId);
        if (!existing || existing.status !== 'ACTIVE') {
          const activeCount = await this.membershipRepository.countActiveMembers(room.id);
          if (activeCount >= room.maxMembers) {
            throw new ConflictError('Room is currently full');
          }

          const initialRole: RoomRole = settings?.requireApprovalToJoin ? 'VIEWER' : 'PARTICIPANT';
          const createdMembership = await this.membershipRepository.create({
            roomId: room.id,
            userId,
            role: existing?.role || initialRole,
          });

          this.eventDispatcher.publish(
            new MemberJoinedEvent({
              roomId: room.id,
              userId,
              role: createdMembership.role,
            })
          );
        }
      }
    }

    return { room, settings };
  }

  public async getRoomById(
    id: string,
    userId?: string
  ): Promise<{ room: RoomEntity; settings: RoomSettingsEntity | null }> {
    let room = await this.roomRepository.findById(id.trim().toLowerCase());
    if (!room) {
      room = await this.roomRepository.findByCode(id.trim().toUpperCase());
    }
    if (!room) throw new NotFoundError('Room not found');
    if (room.status !== 'ACTIVE') throw new NotFoundError(`Room is no longer active (status: ${room.status.toLowerCase()})`);

    const settings = await this.settingsRepository.findByRoomId(room.id);

    if (userId) {
      if (this.banRepository) {
        const ban = await this.banRepository.findActiveBan(room.id, userId);
        if (ban) {
          throw new ConflictError('You are banned from this room');
        }
      }

      if (this.membershipRepository && room.ownerId !== userId) {
        const existing = await this.membershipRepository.findByRoomAndUser(room.id, userId);
        if (!existing || existing.status !== 'ACTIVE') {
          const activeCount = await this.membershipRepository.countActiveMembers(room.id);
          if (activeCount >= room.maxMembers) {
            throw new ConflictError('Room is currently full');
          }

          const initialRole: RoomRole = settings?.requireApprovalToJoin ? 'VIEWER' : 'PARTICIPANT';
          const createdMembership = await this.membershipRepository.create({
            roomId: room.id,
            userId,
            role: existing?.role || initialRole,
          });

          this.eventDispatcher.publish(
            new MemberJoinedEvent({
              roomId: room.id,
              userId,
              role: createdMembership.role,
            })
          );
        }
      }
    }

    return { room, settings };
  }

  public async listPublicRooms(limit: number = 20, offset: number = 0): Promise<RoomEntity[]> {
    return this.roomRepository.listPublic(limit, offset);
  }

  public async listUserRooms(userId: string): Promise<RoomEntity[]> {
    return this.roomRepository.listUserRooms(userId);
  }

  public async updateRoom(roomId: string, data: UpdateRoomDto): Promise<RoomEntity> {
    const updated = await this.roomRepository.update(roomId, data);
    if (!updated) throw new NotFoundError('Room not found');
    return updated;
  }

  public async updateSettings(roomId: string, settings: UpdateSettingsDto): Promise<RoomSettingsEntity> {
    const updated = await this.settingsRepository.update(roomId, settings);
    if (!updated) throw new NotFoundError('Room settings not found');

    this.eventDispatcher.publish(new SettingsUpdatedEvent({
      roomId,
      settings: updated,
    }));

    return updated;
  }

  public async endRoom(roomId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');

    // 1. Delete all PostgreSQL records (Room and all cascaded children)
    await this.roomRepository.delete(roomId);

    // 2. Delete all MongoDB chat messages
    if (this.messageRepository) {
      try {
        await this.messageRepository.deleteByRoom(roomId);
      } catch (err) {
        console.warn(`[RoomService] Failed to clean MongoDB messages for room ${roomId}:`, err);
      }
    }

    // 3. Purge all Redis keys for this room
    if (this.redisClient) {
      try {
        const roomKeys = [
          RedisKeys.roomPresence(roomId),
          RedisKeys.roomConnections(roomId),
          RedisKeys.roomPlayback(roomId),
          RedisKeys.roomState(roomId),
          RedisKeys.roomTyping(roomId),
          RedisKeys.roomViewers(roomId),
          RedisKeys.roomMeta(roomId),
          RedisKeys.roomSettings(roomId),
          RedisKeys.roomBans(roomId),
          RedisKeys.lockPlayback(roomId),
          RedisKeys.lockPlaylist(roomId),
          RedisKeys.pubsubRoom(roomId),
        ];
        await this.redisClient.del(...roomKeys);
      } catch (err) {
        console.warn(`[RoomService] Failed to clean Redis keys for room ${roomId}:`, err);
      }
    }

    // 4. Dispatch domain event to notify socket clients
    this.eventDispatcher.publish(new RoomEndedEvent({ roomId }));
  }
}
