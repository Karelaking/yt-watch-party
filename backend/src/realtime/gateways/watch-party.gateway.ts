import type { Server, Socket } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from '../socket.types.js';
import type { IPlaybackService } from '../../modules/playback/services/playback.service.js';
import type { IRoomRepository, IRoomSettingsRepository } from '../../modules/rooms/repositories/room.repository.interface.js';
import type { IMembershipRepository, IBanRepository } from '../../modules/memberships/repositories/membership.repository.interface.js';
import type { ISessionRepository } from '../../modules/sessions/repositories/session.repository.interface.js';
import type { IPlaylistService } from '../../modules/playlists/services/playlist.service.js';
import type { IRbacPolicyEngine } from '../../modules/rbac/rbac-policy-engine.js';
import type { IEventDispatcher } from '../../core/events/index.js';
import type { IPresenceCache } from '../../infrastructure/cache/presence.cache.js';
import type { IChatService } from '../../modules/chat/services/chat.service.js';
import type { IDistributedLockService } from '../../infrastructure/redis/redis-lock.service.js';
import type { IRoomPubSubService } from '../../infrastructure/redis/room-pubsub.service.js';
import type { ISessionAccumulatorService } from '../../infrastructure/redis/session-accumulator.service.js';
import { RedisKeys } from '../../infrastructure/redis/redis-keys.js';
import { DomainEventType } from '../../core/events/index.js';
import { Permission, type RoomRole } from '../../modules/rbac/permissions.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export class WatchPartyGateway {
  // Low-latency local caches to prevent redundant PostgreSQL lookups on high-frequency socket events
  private readonly roomCache = new Map<string, { data: any; expiresAt: number }>();
  private readonly settingsCache = new Map<string, { data: any; expiresAt: number }>();
  private readonly banCache = new Map<string, { bannedUserIds: Set<string>; expiresAt: number }>();

  constructor(
    private readonly io: TypedServer,
    private readonly playbackService: IPlaybackService,
    private readonly roomRepository: IRoomRepository,
    private readonly settingsRepository: IRoomSettingsRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly banRepository: IBanRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly rbacEngine: IRbacPolicyEngine,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly presenceCache: IPresenceCache,
    private readonly chatService: IChatService,
    private readonly lockService: IDistributedLockService,
    private readonly playlistService?: IPlaylistService,
    private readonly roomPubSubService?: IRoomPubSubService,
    private readonly sessionAccumulator?: ISessionAccumulatorService
  ) {
    this.registerEventSubscriptions();
    this.registerSocketHandlers();
  }

  private registerEventSubscriptions(): void {
    // 1. Pub-Sub Channel Subscription (Multi-Instance & Local Distributed Event Bus)
    if (this.roomPubSubService) {
      this.roomPubSubService.subscribe((message) => {
        const roomChannel = `room:${message.roomId}`;
        switch (message.type) {
          case 'PLAYBACK_SYNC':
            this.io.to(roomChannel).emit('playback:sync', message.payload as any);
            break;
          case 'PLAYBACK_ACTION':
            this.io.to(roomChannel).emit('playback:action', message.payload as any);
            break;
          case 'PLAYLIST_SYNC':
            this.io.to(roomChannel).emit('playlist:sync', message.payload as any);
            break;
          case 'ROOM_REACTION':
            this.io.to(roomChannel).emit('room:reaction', message.payload as any);
            break;
          case 'ROOM_SETTINGS_UPDATED':
            this.io.to(roomChannel).emit('room:settings_updated', message.payload as any);
            break;
          case 'ROOM_MEMBER_JOINED':
            this.io.to(roomChannel).emit('room:member_joined', message.payload as any);
            break;
          case 'ROOM_MEMBER_LEFT':
            this.io.to(roomChannel).emit('room:member_left', message.payload as any);
            break;
          case 'ROOM_MEMBER_UPDATED':
            this.io.to(roomChannel).emit('room:member_updated', message.payload as any);
            break;
          case 'ROOM_ROLE_CHANGED':
            this.io.to(roomChannel).emit('room:role_changed', message.payload as any);
            break;
        }
      });
    }

    // 2. Domain Events Subscriptions
    this.eventDispatcher.subscribe(DomainEventType.PLAYBACK_ACTION, (event) => {
      const payload = event.payload as {
        roomId: string;
        actorId: string;
        action: string;
        position: number;
        playbackRate?: number;
        mediaId?: string | null;
        version: number;
      };
      if (!this.roomPubSubService) {
        this.io.to(`room:${payload.roomId}`).emit('playback:action', {
          actorId: payload.actorId,
          action: payload.action,
          position: payload.position,
          playbackRate: payload.playbackRate,
          mediaId: payload.mediaId,
          version: payload.version,
        });
      }
    });

    this.eventDispatcher.subscribe(DomainEventType.MEMBER_JOINED, (event) => {
      const payload = event.payload as { roomId: string; userId: string; role: string; displayName?: string | null };
      this.io.to(`room:${payload.roomId}`).emit('room:member_joined', {
        userId: payload.userId,
        role: payload.role,
        displayName: payload.displayName,
      });
    });

    this.eventDispatcher.subscribe(DomainEventType.PLAYLIST_UPDATED, async (event) => {
      const payload = event.payload as { roomId: string; playlistId: string; items?: unknown[] };
      if (payload.items) {
        this.io.to(`room:${payload.roomId}`).emit('playlist:sync', {
          playlistId: payload.playlistId,
          items: payload.items,
        });
      } else if (this.playlistService) {
        try {
          const pl = await this.playlistService.getPlaylist(payload.playlistId);
          this.io.to(`room:${payload.roomId}`).emit('playlist:sync', {
            playlistId: payload.playlistId,
            items: pl.items || [],
          });
        } catch {
          // ignore
        }
      }
    });

    this.eventDispatcher.subscribe(DomainEventType.ROLE_CHANGED, (event) => {
      const payload = event.payload as { roomId: string; userId: string; newRole: string; changedById: string };
      this.roomCache.delete(payload.roomId);
      if (this.roomPubSubService) {
        this.roomPubSubService.publish(payload.roomId, 'ROOM_ROLE_CHANGED', payload, payload.changedById).catch(() => {});
      }
      this.io.to(`room:${payload.roomId}`).emit('room:role_changed', {
        userId: payload.userId,
        newRole: payload.newRole,
        role: payload.newRole,
      });
    });

    this.eventDispatcher.subscribe(DomainEventType.MEMBER_LEFT, (event) => {
      const payload = event.payload as { roomId: string; userId: string };
      this.io.to(`room:${payload.roomId}`).emit('room:member_left', { userId: payload.userId });
    });

    this.eventDispatcher.subscribe(DomainEventType.MEMBER_REMOVED, (event) => {
      const payload = event.payload as { roomId: string; userId: string; actorId: string };
      this.io.to(`room:${payload.roomId}`).emit('room:member_left', { userId: payload.userId, reason: 'KICKED' });
    });

    this.eventDispatcher.subscribe(DomainEventType.MEMBER_BANNED, (event) => {
      const payload = event.payload as { roomId: string; userId: string; actorId: string; reason?: string };
      this.banCache.delete(payload.roomId);
      this.io.to(`room:${payload.roomId}`).emit('room:member_left', { userId: payload.userId, reason: 'BANNED' });
    });

    this.eventDispatcher.subscribe(DomainEventType.SETTINGS_UPDATED, (event) => {
      const payload = event.payload as { roomId: string; settings: any };
      this.settingsCache.delete(payload.roomId);
      this.roomCache.delete(payload.roomId);
      this.io.to(`room:${payload.roomId}`).emit('room:settings_updated', payload);
    });

    this.eventDispatcher.subscribe(DomainEventType.ROOM_ENDED, (event) => {
      const payload = event.payload as { roomId: string };
      this.roomCache.delete(payload.roomId);
      this.settingsCache.delete(payload.roomId);
      this.banCache.delete(payload.roomId);
      this.io.to(`room:${payload.roomId}`).emit('room:member_left', {
        userId: 'ROOM_ENDED',
      });
    });
  }

  private async resolveRoom(roomIdOrCode: string) {
    if (!roomIdOrCode) return null;
    const clean = roomIdOrCode.trim();
    const now = Date.now();
    const cached = this.roomCache.get(clean);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    let room = await this.roomRepository.findById(clean);
    if (!room) {
      room = await this.roomRepository.findByCode(clean.toUpperCase());
    }
    if (!room) {
      room = await this.roomRepository.findBySlug(clean.toLowerCase());
    }

    if (room) {
      const entry = { data: room, expiresAt: now + 60000 };
      this.roomCache.set(clean, entry);
      this.roomCache.set(room.id, entry);
      if (room.code) this.roomCache.set(room.code.toUpperCase(), entry);
    }
    return room;
  }

  private async getSettingsCached(roomId: string) {
    const now = Date.now();
    const cached = this.settingsCache.get(roomId);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }
    const settings = await this.settingsRepository.findByRoomId(roomId);
    if (settings) {
      this.settingsCache.set(roomId, { data: settings, expiresAt: now + 60000 });
    }
    return settings;
  }

  private async isUserBannedCached(roomId: string, userId: string): Promise<boolean> {
    const now = Date.now();
    const cached = this.banCache.get(roomId);
    if (cached && cached.expiresAt > now) {
      return cached.bannedUserIds.has(userId);
    }
    const ban = await this.banRepository.findActiveBan(roomId, userId);
    return !!ban;
  }

  private registerSocketHandlers(): void {
    this.io.on('connection', (socket: TypedSocket) => {
      const user = socket.data.user;

      // Handle room join
      socket.on('room:join', async (data, callback) => {
        try {
          const { roomId } = data;
          const room = await this.resolveRoom(roomId);
          if (!room || room.status !== 'ACTIVE') {
            callback?.({ success: false, error: 'Room is inactive or not found' });
            return;
          }

          const canonicalRoomId = room.id;

          // Check ban with cache
          const isBanned = await this.isUserBannedCached(canonicalRoomId, user.id);
          if (isBanned) {
            callback?.({ success: false, error: 'User is banned from this room' });
            return;
          }

          const channel = `room:${canonicalRoomId}`;
          await socket.join(channel);
          socket.data.currentRoomId = canonicalRoomId;

          // Track Redis presence
          await this.presenceCache.addSocketToRoom(socket.id, user.id, canonicalRoomId);

          // Start WatchSession in relational DB
          const session = await this.sessionRepository.startWatchSession(canonicalRoomId, user.id);
          socket.data.watchSessionId = session.id;

          // Ensure membership for non-owner if not already present
          const isOwner = room.ownerId === user.id || room.ownerId === user.clerkUserId;
          let membership = await this.membershipRepository.findByRoomAndUser(canonicalRoomId, user.id);
          if (!membership && !isOwner) {
            try {
              membership = await this.membershipRepository.create({
                roomId: canonicalRoomId,
                userId: user.id,
                role: 'PARTICIPANT',
              });
            } catch {
              // Ignore if already joined concurrently
            }
          }

          const resolvedRole: RoomRole = isOwner ? 'HOST' : (membership?.role || 'PARTICIPANT');
          socket.data.role = resolvedRole;
          socket.data.isOwner = isOwner;

          const currentState = await this.playbackService.getState(canonicalRoomId);

          callback?.({ success: true, state: currentState });
          socket.to(channel).emit('room:member_joined', {
            userId: user.id,
            role: resolvedRole,
            displayName: user.displayName,
          });
        } catch (err) {
          console.error('[Socket room:join] error:', err);
          callback?.({ success: false, error: 'Failed to join room' });
        }
      });

      // Handle playback action (Play, Pause, Seek, Rate, Media) with Distributed Locking
      socket.on('playback:action', async (data, callback) => {
        try {
          const { roomId, action, position, playbackRate, mediaId } = data;
          const room = await this.resolveRoom(roomId);
          if (!room) {
            callback?.({ success: false, error: 'Room not found' });
            return;
          }

          const canonicalRoomId = room.id;

          // Check RBAC permission for PLAYBACK_CONTROL using cached settings & socket role
          const settings = await this.getSettingsCached(canonicalRoomId);
          const isOwner = socket.data.isOwner !== undefined ? socket.data.isOwner : (room.ownerId === user.id || room.ownerId === user.clerkUserId);
          const role: RoomRole = isOwner
            ? 'HOST'
            : ((socket.data.role as RoomRole) || (settings?.onlyHostCanControlPlayback ? 'VIEWER' : 'PARTICIPANT'));

          const isAllowed = this.rbacEngine.can(role, settings, Permission.PLAYBACK_CONTROL);
          if (!isAllowed) {
            callback?.({ success: false, error: 'Permission denied for playback control' });
            return;
          }

          // Execute with Redis distributed lock to prevent concurrency race conditions
          const lockKey = RedisKeys.lockPlayback(canonicalRoomId);
          const updatedState = await this.lockService.withLock(lockKey, 3000, async () => {
            return this.playbackService.dispatchAction(canonicalRoomId, user.id, {
              action,
              position,
              playbackRate,
              mediaId,
            });
          });

          // Broadcast authoritative sync to all room members
          this.io.to(`room:${canonicalRoomId}`).emit('playback:sync', updatedState);
          callback?.({ success: true, state: updatedState });
        } catch (err) {
          console.error('[Socket playback:action] error:', err);
          callback?.({ success: false, error: err instanceof Error ? err.message : 'Action failed' });
        }
      });

      // Handle playlist actions (Add, Remove, Reorder)
      socket.on('playlist:action', async (data, callback) => {
        try {
          const { roomId, playlistId, action, payload } = data;
          if (!this.playlistService) {
            callback?.({ success: false, error: 'Playlist service unavailable' });
            return;
          }

          const room = await this.resolveRoom(roomId);
          if (!room) {
            callback?.({ success: false, error: 'Room not found' });
            return;
          }

          const canonicalRoomId = room.id;
          const settings = await this.settingsRepository.findByRoomId(canonicalRoomId);
          const membership = await this.membershipRepository.findByRoomAndUser(canonicalRoomId, user.id);
          const isOwner = room.ownerId === user.id || room.ownerId === user.clerkUserId;
          const role: RoomRole = isOwner
            ? 'HOST'
            : (membership?.role || (settings?.onlyHostCanManagePlaylist ? 'VIEWER' : 'PARTICIPANT'));

          const isAllowed = this.rbacEngine.can(role, settings, Permission.PLAYLIST_MANAGE);
          if (!isAllowed) {
            callback?.({ success: false, error: 'Permission denied to manage playlist' });
            return;
          }

          const defaultPl = await this.playlistService.getOrCreateDefaultPlaylist(canonicalRoomId, user.id);
          const targetPlaylistId = playlistId || defaultPl.id;

          if (action === 'ADD') {
            const addPayload = payload as { url?: string; mediaUrl?: string; mediaId?: string; title?: string };
            const urlToAdd = addPayload.url || addPayload.mediaUrl || '';
            await this.playlistService.addItem(canonicalRoomId, targetPlaylistId, user.id, {
              url: urlToAdd,
              mediaId: addPayload.mediaId,
              title: addPayload.title,
            });
          } else if (action === 'REMOVE') {
            const removePayload = payload as { itemId: string };
            await this.playlistService.removeItem(removePayload.itemId);
          } else if (action === 'REORDER') {
            const reorderPayload = payload as { itemIds: string[] };
            await this.playlistService.reorderItems(targetPlaylistId, reorderPayload.itemIds);
          }

          const updatedPlaylist = await this.playlistService.getPlaylist(targetPlaylistId);
          const playlistPayload = {
            playlistId: targetPlaylistId,
            items: updatedPlaylist.items || [],
          };

          if (this.roomPubSubService) {
            await this.roomPubSubService.publish(canonicalRoomId, 'PLAYLIST_SYNC', playlistPayload, user.id);
          }
          this.io.to(`room:${canonicalRoomId}`).emit('playlist:sync', playlistPayload);

          callback?.({ success: true, playlist: updatedPlaylist } as any);
        } catch (err) {
          console.error('[Socket playlist:action] error:', err);
          callback?.({ success: false, error: err instanceof Error ? err.message : 'Playlist action failed' });
        }
      });

      // Handle live floating emoji reactions with burst throttling
      socket.on('room:reaction', async (data) => {
        try {
          const { roomId, emoji } = data;
          if (!roomId || !emoji) return;

          const now = Date.now();
          if (socket.data.lastReactionAt && now - socket.data.lastReactionAt < 100) {
            return; // Throttle clicks faster than 100ms
          }
          socket.data.lastReactionAt = now;

          const room = await this.resolveRoom(roomId);
          const canonicalRoomId = room ? room.id : roomId;

          let membership = await this.membershipRepository.findByRoomAndUser(canonicalRoomId, user.id);
          if (!membership && user.clerkUserId) {
            membership = await this.membershipRepository.findByRoomAndUser(canonicalRoomId, user.clerkUserId);
          }

          const effectiveNickname =
            membership?.nickname ||
            (data as any).userName ||
            user.displayName ||
            (user.email ? user.email.split('@')[0] : 'Member');

          const reactionPayload = {
            userId: user.id,
            userName: effectiveNickname,
            emoji,
          };

          if (this.roomPubSubService) {
            this.roomPubSubService.publish(canonicalRoomId, 'ROOM_REACTION', reactionPayload, user.id).catch(() => {});
          }
          this.io.to(`room:${canonicalRoomId}`).emit('room:reaction', reactionPayload);
        } catch (err) {
          console.warn('[Socket room:reaction warning]:', err);
        }
      });

      // Handle live nickname update
      socket.on('room:nickname', async (data, callback) => {
        try {
          const { roomId, nickname } = data;
          if (!roomId || !nickname || typeof nickname !== 'string') {
            callback?.({ success: false, error: 'Invalid nickname payload' });
            return;
          }

          const room = await this.resolveRoom(roomId);
          if (!room) {
            callback?.({ success: false, error: 'Room not found' });
            return;
          }

          const canonicalRoomId = room.id;
          const membership = await this.membershipRepository.findByRoomAndUser(canonicalRoomId, user.id);
          if (membership) {
            await this.membershipRepository.updateNickname(membership.id, nickname.trim());
          }

          const updatePayload = {
            userId: user.id,
            nickname: nickname.trim(),
            displayName: nickname.trim(),
          };

          if (this.roomPubSubService) {
            await this.roomPubSubService.publish(canonicalRoomId, 'ROOM_MEMBER_UPDATED', updatePayload, user.id);
          } else {
            this.io.to(`room:${canonicalRoomId}`).emit('room:member_updated', updatePayload);
          }

          callback?.({ success: true });
        } catch (err) {
          console.error('[Socket room:nickname] error:', err);
          callback?.({ success: false, error: 'Failed to update nickname' });
        }
      });

      // Handle live room settings update
      socket.on('room:settings_update', async (data, callback) => {
        try {
          const { roomId, settings } = data;
          const room = await this.resolveRoom(roomId);
          if (!room) {
            callback?.({ success: false, error: 'Room not found' });
            return;
          }

          const canonicalRoomId = room.id;
          const isOwner = room.ownerId === user.id || room.ownerId === user.clerkUserId;
          if (!isOwner) {
            callback?.({ success: false, error: 'Only room host can modify settings' });
            return;
          }

          const updated = await this.settingsRepository.update(canonicalRoomId, settings as any);
          
          // Invalidate cache
          this.settingsCache.delete(canonicalRoomId);
          this.roomCache.delete(canonicalRoomId);

          const settingsPayload = {
            roomId: canonicalRoomId,
            settings: updated,
          };

          if (this.roomPubSubService) {
            await this.roomPubSubService.publish(canonicalRoomId, 'ROOM_SETTINGS_UPDATED', settingsPayload, user.id);
          } else {
            this.io.to(`room:${canonicalRoomId}`).emit('room:settings_updated', settingsPayload);
          }

          callback?.({ success: true });
        } catch (err) {
          console.error('[Socket room:settings_update] error:', err);
          callback?.({ success: false, error: 'Settings update failed' });
        }
      });

      // Handle heartbeat via Session Accumulator
      socket.on('playback:heartbeat', async () => {
        if (socket.data.watchSessionId) {
          if (this.sessionAccumulator) {
            await this.sessionAccumulator.recordHeartbeat(socket.data.watchSessionId, 15);
          } else {
            await this.sessionRepository.heartbeatWatchSession(socket.data.watchSessionId);
          }
        }
      });

      // Handle chat messages with MongoDB persistence, nickname resolution, and rate limiting
      socket.on('chat:send', async (data) => {
        try {
          const { roomId, text } = data;
          if (!text || text.trim().length === 0) return;

          const room = await this.resolveRoom(roomId);
          const canonicalRoomId = room ? room.id : roomId;

          // Resolve member nickname and role
          let membership = await this.membershipRepository.findByRoomAndUser(canonicalRoomId, user.id);
          if (!membership && user.clerkUserId) {
            membership = await this.membershipRepository.findByRoomAndUser(canonicalRoomId, user.clerkUserId);
          }

          const effectiveNickname =
            membership?.nickname ||
            data.userNickname ||
            data.userName ||
            user.displayName ||
            (user.email ? user.email.split('@')[0] : 'Member');

          const isHost = room ? (room.ownerId === user.id || room.ownerId === user.clerkUserId) : false;
          const userRole = isHost ? 'HOST' : (membership?.role || 'PARTICIPANT');

          const savedMessage = await this.chatService.sendMessage(user.id, {
            roomId: canonicalRoomId,
            message: text.trim(),
            type: 'TEXT',
          });

          const messagePayload = {
            id: savedMessage.id,
            senderId: user.id,
            senderName: effectiveNickname,
            userNickname: effectiveNickname,
            userRole,
            userAvatar: user.avatarUrl || null,
            text: savedMessage.message,
            sentAt: savedMessage.createdAt.toISOString(),
          };

          if (this.roomPubSubService) {
            this.roomPubSubService.publish(canonicalRoomId, 'CHAT_MESSAGE' as any, messagePayload, user.id).catch(() => {});
          }
          this.io.to(`room:${canonicalRoomId}`).emit('chat:message', messagePayload);
        } catch (err) {
          console.warn('[Socket chat:send warning]:', err instanceof Error ? err.message : err);
        }
      });

      // Handle WebRTC Screen Sharing signaling (with RBAC authorization)
      socket.on('screenshare:signal', async (data) => {
        try {
          const { roomId, signal } = data;
          const room = await this.resolveRoom(roomId);
          if (!room) return;

          const canonicalRoomId = room.id;

          // Verify RBAC permission for SCREEN_SHARE using cached settings & socket role
          const settings = await this.getSettingsCached(canonicalRoomId);
          const isOwner = socket.data.isOwner !== undefined ? socket.data.isOwner : (room.ownerId === user.id || room.ownerId === user.clerkUserId);
          const role: RoomRole = isOwner
            ? 'HOST'
            : ((socket.data.role as RoomRole) || 'VIEWER');

          const isAllowed = this.rbacEngine.can(role, settings, Permission.SCREEN_SHARE);
          if (!isAllowed) return;

          const channel = `room:${canonicalRoomId}`;
          socket.to(channel).emit('screenshare:signal', {
            senderId: user.id,
            signal,
          });
        } catch (err) {
          console.warn('[Socket screenshare:signal] error:', err);
        }
      });

      // Handle explicit room leave (client emits on unmount before disconnect)
      socket.on('room:leave', async (data) => {
        try {
          const { roomId } = data;
          const room = await this.resolveRoom(roomId);
          const canonicalRoomId = room ? room.id : roomId;
          const channel = `room:${canonicalRoomId}`;

          // Clean up Redis presence
          await this.presenceCache.removeSocket(socket.id);

          // End watch session and flush accumulated time
          if (socket.data.watchSessionId) {
            if (this.sessionAccumulator) {
              await this.sessionAccumulator.flushSession(socket.data.watchSessionId);
            }
            await this.sessionRepository.endWatchSession(socket.data.watchSessionId);
            socket.data.watchSessionId = undefined;
          }

          // Leave socket.io room channel
          await socket.leave(channel);
          socket.data.currentRoomId = undefined;

          // Broadcast to remaining room members
          socket.to(channel).emit('room:member_left', {
            userId: user.id,
          });
        } catch (err) {
          console.warn('[Socket room:leave] error:', err);
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        const { roomId } = await this.presenceCache.removeSocket(socket.id);

        if (socket.data.watchSessionId) {
          if (this.sessionAccumulator) {
            await this.sessionAccumulator.flushSession(socket.data.watchSessionId);
          }
          await this.sessionRepository.endWatchSession(socket.data.watchSessionId);
        }

        const activeRoom = roomId || socket.data.currentRoomId;
        if (activeRoom) {
          socket.to(`room:${activeRoom}`).emit('room:member_left', {
            userId: user.id,
          });
        }
      });
    });
  }
}
