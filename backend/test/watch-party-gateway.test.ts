import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WatchPartyGateway } from '../src/realtime/gateways/watch-party.gateway.js';
import type { IPlaybackService } from '../src/modules/playback/services/playback.service.js';
import type { IRoomRepository, IRoomSettingsRepository } from '../src/modules/rooms/repositories/room.repository.interface.js';
import type { IMembershipRepository, IBanRepository } from '../src/modules/memberships/repositories/membership.repository.interface.js';
import type { ISessionRepository } from '../src/modules/sessions/repositories/session.repository.interface.js';
import type { IRbacPolicyEngine } from '../src/modules/rbac/rbac-policy-engine.js';
import type { IEventDispatcher } from '../src/core/events/index.js';
import type { IPresenceCache } from '../src/infrastructure/cache/presence.cache.js';
import type { IChatService } from '../src/modules/chat/services/chat.service.js';
import type { IDistributedLockService } from '../src/infrastructure/redis/redis-lock.service.js';

describe('WatchPartyGateway', () => {
  let mockIo: any;
  let mockPlaybackService: IPlaybackService;
  let mockRoomRepository: IRoomRepository;
  let mockSettingsRepository: IRoomSettingsRepository;
  let mockMembershipRepository: IMembershipRepository;
  let mockBanRepository: IBanRepository;
  let mockSessionRepository: ISessionRepository;
  let mockRbacEngine: IRbacPolicyEngine;
  let mockEventDispatcher: IEventDispatcher;
  let mockPresenceCache: IPresenceCache;
  let mockChatService: IChatService;
  let mockLockService: IDistributedLockService;

  let connectionHandler: (socket: any) => void;
  let broadcastEmitMap: Record<string, any[]>;

  const mockRoom = {
    id: 'room-1',
    code: 'ROOM01',
    slug: null,
    name: 'Test Party',
    description: null,
    ownerId: 'host-user',
    status: 'ACTIVE' as const,
    visibility: 'PUBLIC' as const,
    maxMembers: 50,
    discoverable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    endedAt: null,
    archivedAt: null,
  };

  const mockSettings = {
    id: 'settings-1',
    roomId: 'room-1',
    allowGuestJoin: true,
    requireApprovalToJoin: false,
    allowMemberInvite: true,
    allowChat: true,
    slowModeSeconds: 0,
    allowScreenShare: true,
    syncPlayback: true,
    autoplayNext: true,
    onlyHostCanControlPlayback: false,
    allowModeratorPlaybackControl: true,
    allowPlaylistControl: true,
    onlyHostCanManagePlaylist: false,
    disconnectOnHostLeave: false,
    autoArchive: false,
    autoArchiveAfterMinutes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPlaybackState = {
    id: 'pb-1',
    roomId: 'room-1',
    mediaId: 'media-1',
    position: 25.5,
    isPlaying: true,
    playbackRate: 1.0,
    version: 3,
    serverTimestamp: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    broadcastEmitMap = {};

    mockIo = {
      on: vi.fn((event: string, handler: any) => {
        if (event === 'connection') {
          connectionHandler = handler;
        }
      }),
      to: vi.fn((channel: string) => ({
        emit: vi.fn((event: string, payload: any) => {
          if (!broadcastEmitMap[channel]) broadcastEmitMap[channel] = [];
          broadcastEmitMap[channel].push({ event, payload });
        }),
      })),
    };

    mockPlaybackService = {
      getState: vi.fn(async () => mockPlaybackState),
      getCurrentCalculatedPosition: vi.fn(async () => ({
        position: 25.5,
        isPlaying: true,
        playbackRate: 1.0,
        version: 3,
      })),
      dispatchAction: vi.fn(async (_roomId, _actorId, payload) => ({
        ...mockPlaybackState,
        isPlaying: payload.action === 'PLAY',
        position: payload.position ?? 0,
        version: mockPlaybackState.version + 1,
      })),
      getHistory: vi.fn(async () => []),
    };

    mockRoomRepository = {
      findById: vi.fn(async () => mockRoom),
      findByCode: vi.fn(async () => mockRoom),
      findBySlug: vi.fn(async () => null),
      listPublic: vi.fn(async () => [mockRoom]),
      listUserRooms: vi.fn(async () => [mockRoom]),
      create: vi.fn(async () => mockRoom),
      update: vi.fn(async () => mockRoom),
      delete: vi.fn(async () => true),
    };

    mockSettingsRepository = {
      findByRoomId: vi.fn(async () => mockSettings),
      create: vi.fn(async () => mockSettings),
      update: vi.fn(async () => mockSettings),
    };

    mockMembershipRepository = {
      findByRoomAndUser: vi.fn(async () => null),
      listByRoom: vi.fn(async () => []),
      create: vi.fn(async () => ({} as any)),
      updateRole: vi.fn(async () => ({} as any)),
      delete: vi.fn(async () => true),
      findRoleHistory: vi.fn(async () => []),
      recordRoleChange: vi.fn(async () => {}),
    };

    mockBanRepository = {
      findActiveBan: vi.fn(async () => null),
      banUser: vi.fn(async () => ({} as any)),
      unbanUser: vi.fn(async () => true),
      listRoomBans: vi.fn(async () => []),
    };

    mockSessionRepository = {
      startWatchSession: vi.fn(async () => ({ id: 'session-1' } as any)),
      heartbeatWatchSession: vi.fn(async () => {}),
      endWatchSession: vi.fn(async () => {}),
    };

    mockRbacEngine = {
      can: vi.fn(() => true),
      hasRoleAtLeast: vi.fn(() => true),
    };

    mockEventDispatcher = {
      subscribe: vi.fn(),
      publish: vi.fn(),
    };

    mockPresenceCache = {
      addSocketToRoom: vi.fn(async () => {}),
      removeSocket: vi.fn(async () => ({ roomId: 'room-1', userId: 'user-1' })),
      getRoomUsers: vi.fn(async () => []),
      getUserActiveRooms: vi.fn(async () => []),
    };

    mockChatService = {
      sendMessage: vi.fn(async () => ({
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        message: 'Hello!',
        type: 'TEXT',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      getRoomMessages: vi.fn(async () => ({ messages: [], nextCursor: null })),
    };

    mockLockService = {
      withLock: vi.fn(async (_key, _ttl, fn) => fn()),
      acquire: vi.fn(async () => true),
      release: vi.fn(async () => true),
    };

    new WatchPartyGateway(
      mockIo,
      mockPlaybackService,
      mockRoomRepository,
      mockSettingsRepository,
      mockMembershipRepository,
      mockBanRepository,
      mockSessionRepository,
      mockRbacEngine,
      mockEventDispatcher,
      mockPresenceCache,
      mockChatService,
      mockLockService
    );
  });

  function createMockSocket(user: { id: string; displayName?: string }) {
    const socketEventHandlers: Record<string, Function> = {};
    const socketBroadcastToMap: Record<string, any[]> = {};

    const mockSocket = {
      id: `socket-${user.id}`,
      data: { user, currentRoomId: undefined, watchSessionId: undefined },
      join: vi.fn(async () => {}),
      on: vi.fn((event: string, handler: Function) => {
        socketEventHandlers[event] = handler;
      }),
      to: vi.fn((channel: string) => ({
        emit: vi.fn((event: string, payload: any) => {
          if (!socketBroadcastToMap[channel]) socketBroadcastToMap[channel] = [];
          socketBroadcastToMap[channel].push({ event, payload });
        }),
      })),
    };

    connectionHandler(mockSocket);

    return {
      socket: mockSocket,
      handlers: socketEventHandlers,
      broadcastTo: socketBroadcastToMap,
    };
  }

  it('should handle room:join successfully and return playback state', async () => {
    const user1 = { id: 'user-1', displayName: 'Alice' };
    const { socket, handlers } = createMockSocket(user1);

    const callback = vi.fn();
    await handlers['room:join']({ roomId: 'room-1' }, callback);

    expect(socket.join).toHaveBeenCalledWith('room:room-1');
    expect(mockPresenceCache.addSocketToRoom).toHaveBeenCalledWith(socket.id, 'user-1', 'room-1');
    expect(mockSessionRepository.startWatchSession).toHaveBeenCalledWith('room-1', 'user-1');
    expect(mockPlaybackService.getState).toHaveBeenCalledWith('room-1');
    expect(callback).toHaveBeenCalledWith({ success: true, state: mockPlaybackState });
  });

  it('should reject room:join if user is banned', async () => {
    mockBanRepository.findActiveBan = vi.fn(async () => ({ id: 'ban-1' } as any));

    const userBanned = { id: 'banned-user', displayName: 'Bad Actor' };
    const { socket, handlers } = createMockSocket(userBanned);

    const callback = vi.fn();
    await handlers['room:join']({ roomId: 'room-1' }, callback);

    expect(callback).toHaveBeenCalledWith({ success: false, error: 'User is banned from this room' });
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('should handle playback:action (PLAY) under Redis distributed lock and broadcast sync', async () => {
    const user1 = { id: 'user-1', displayName: 'Alice' };
    const { handlers } = createMockSocket(user1);

    const callback = vi.fn();
    await handlers['playback:action'](
      { roomId: 'room-1', action: 'PLAY', position: 10, playbackRate: 1.0 },
      callback
    );

    expect(mockLockService.withLock).toHaveBeenCalled();
    expect(mockPlaybackService.dispatchAction).toHaveBeenCalledWith('room-1', 'user-1', {
      action: 'PLAY',
      position: 10,
      playbackRate: 1.0,
      mediaId: undefined,
    });
    expect(mockIo.to).toHaveBeenCalledWith('room:room-1');
    expect(callback).toHaveBeenCalledWith({ success: true, state: expect.objectContaining({ isPlaying: true, position: 10 }) });
  });

  it('should handle playback:action (PAUSE) and broadcast sync', async () => {
    const user1 = { id: 'user-1', displayName: 'Alice' };
    const { handlers } = createMockSocket(user1);

    const callback = vi.fn();
    await handlers['playback:action'](
      { roomId: 'room-1', action: 'PAUSE', position: 42, playbackRate: 1.0 },
      callback
    );

    expect(mockPlaybackService.dispatchAction).toHaveBeenCalledWith('room-1', 'user-1', {
      action: 'PAUSE',
      position: 42,
      playbackRate: 1.0,
      mediaId: undefined,
    });
    expect(mockIo.to).toHaveBeenCalledWith('room:room-1');
    expect(callback).toHaveBeenCalledWith({ success: true, state: expect.objectContaining({ isPlaying: false, position: 42 }) });
  });

  it('should handle playback:action (SEEK) and broadcast sync', async () => {
    const user1 = { id: 'user-1', displayName: 'Alice' };
    const { handlers } = createMockSocket(user1);

    const callback = vi.fn();
    await handlers['playback:action'](
      { roomId: 'room-1', action: 'SEEK', position: 180 },
      callback
    );

    expect(mockPlaybackService.dispatchAction).toHaveBeenCalledWith('room-1', 'user-1', {
      action: 'SEEK',
      position: 180,
      playbackRate: undefined,
      mediaId: undefined,
    });
    expect(callback).toHaveBeenCalledWith({ success: true, state: expect.objectContaining({ position: 180 }) });
  });

  it('should handle chat:send and broadcast chat:message to room', async () => {
    const user1 = { id: 'user-1', displayName: 'Alice' };
    const { handlers } = createMockSocket(user1);

    await handlers['chat:send']({ roomId: 'room-1', text: 'Hey everyone!' });

    expect(mockChatService.sendMessage).toHaveBeenCalledWith('user-1', {
      roomId: 'room-1',
      message: 'Hey everyone!',
      type: 'TEXT',
    });
    expect(mockIo.to).toHaveBeenCalledWith('room:room-1');
  });

  it('should handle screenshare:signal and relay to peer room channel', async () => {
    const user1 = { id: 'user-1', displayName: 'Alice' };
    const { socket, handlers } = createMockSocket(user1);

    await handlers['screenshare:signal']({ roomId: 'room-1', signal: { type: 'offer', sdp: 'xyz' } });

    expect(socket.to).toHaveBeenCalledWith('room:room-1');
  });

  it('should handle socket disconnect and notify room members', async () => {
    const user1 = { id: 'user-1', displayName: 'Alice' };
    const { socket, handlers } = createMockSocket(user1);
    socket.data.currentRoomId = 'room-1';
    socket.data.watchSessionId = 'session-1';

    await handlers['disconnect']();

    expect(mockPresenceCache.removeSocket).toHaveBeenCalledWith(socket.id);
    expect(mockSessionRepository.endWatchSession).toHaveBeenCalledWith('session-1');
    expect(socket.to).toHaveBeenCalledWith('room:room-1');
  });
});
