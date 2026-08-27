import { describe, it, expect, vi } from 'vitest';
import { ChatService } from '../src/modules/chat/services/chat.service.js';
import type { IMessageRepository, MessageEntity } from '../src/modules/chat/repositories/message.repository.interface.js';
import type { IRoomRepository, IRoomSettingsRepository, RoomEntity, RoomSettingsEntity } from '../src/modules/rooms/repositories/room.repository.interface.js';
import type { IRateLimiterService } from '../src/infrastructure/redis/rate-limiter.service.js';

describe('ChatService', () => {
  const mockRoom: RoomEntity = {
    id: 'room-1',
    code: 'ABC123',
    slug: null,
    name: 'Test Room',
    description: null,
    ownerId: 'owner-1',
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    maxMembers: 50,
    discoverable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    endedAt: null,
    archivedAt: null,
  };

  const mockSettings: RoomSettingsEntity = {
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

  const mockMessage: MessageEntity = {
    id: 'msg-1',
    roomId: 'room-1',
    senderId: 'user-1',
    message: 'Hello world!',
    type: 'TEXT',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should successfully send message when chat is enabled and within rate limit', async () => {
    const mockMessageRepo: IMessageRepository = {
      create: vi.fn(async () => mockMessage),
      findById: vi.fn(async () => mockMessage),
      listByRoom: vi.fn(async () => ({ messages: [mockMessage], nextCursor: null })),
      edit: vi.fn(async () => mockMessage),
      softDelete: vi.fn(async () => true),
    };

    const mockRoomRepo: IRoomRepository = {
      findById: vi.fn(async () => mockRoom),
      findByCode: vi.fn(async () => mockRoom),
      findBySlug: vi.fn(async () => null),
      listPublic: vi.fn(async () => [mockRoom]),
      listUserRooms: vi.fn(async () => [mockRoom]),
      create: vi.fn(async () => mockRoom),
      update: vi.fn(async () => mockRoom),
      delete: vi.fn(async () => true),
    };

    const mockSettingsRepo: IRoomSettingsRepository = {
      findByRoomId: vi.fn(async () => mockSettings),
      create: vi.fn(async () => mockSettings),
      update: vi.fn(async () => mockSettings),
    };

    const mockRateLimiter: IRateLimiterService = {
      checkUserMessageRate: vi.fn(async () => ({ allowed: true, remaining: 9, resetMs: 3000 })),
      checkUserRequestRate: vi.fn(async () => ({ allowed: true, remaining: 59, resetMs: 60000 })),
      checkIpRequestRate: vi.fn(async () => ({ allowed: true, remaining: 119, resetMs: 60000 })),
    };

    const chatService = new ChatService(mockMessageRepo, mockRoomRepo, mockSettingsRepo, mockRateLimiter);

    const result = await chatService.sendMessage('user-1', {
      roomId: 'room-1',
      message: 'Hello world!',
      type: 'TEXT',
    });

    expect(result.id).toBe('msg-1');
    expect(result.message).toBe('Hello world!');
    expect(mockMessageRepo.create).toHaveBeenCalledOnce();
  });

  it('should throw ForbiddenError when chat is disabled in room settings', async () => {
    const mockMessageRepo: IMessageRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      listByRoom: vi.fn(),
      edit: vi.fn(),
      softDelete: vi.fn(),
    };

    const mockRoomRepo: IRoomRepository = {
      findById: vi.fn(async () => mockRoom),
      findByCode: vi.fn(),
      findBySlug: vi.fn(),
      listPublic: vi.fn(),
      listUserRooms: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const mockSettingsRepo: IRoomSettingsRepository = {
      findByRoomId: vi.fn(async () => ({ ...mockSettings, allowChat: false })),
      create: vi.fn(),
      update: vi.fn(),
    };

    const mockRateLimiter: IRateLimiterService = {
      checkUserMessageRate: vi.fn(),
      checkUserRequestRate: vi.fn(),
      checkIpRequestRate: vi.fn(),
    };

    const chatService = new ChatService(mockMessageRepo, mockRoomRepo, mockSettingsRepo, mockRateLimiter);

    await expect(
      chatService.sendMessage('user-1', {
        roomId: 'room-1',
        message: 'Hello world!',
        type: 'TEXT',
      })
    ).rejects.toThrow('Chat is disabled for this room');
  });

  it('should throw ForbiddenError when rate limited under slow mode', async () => {
    const mockMessageRepo: IMessageRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      listByRoom: vi.fn(),
      edit: vi.fn(),
      softDelete: vi.fn(),
    };

    const mockRoomRepo: IRoomRepository = {
      findById: vi.fn(async () => mockRoom),
      findByCode: vi.fn(),
      findBySlug: vi.fn(),
      listPublic: vi.fn(),
      listUserRooms: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const mockSettingsRepo: IRoomSettingsRepository = {
      findByRoomId: vi.fn(async () => ({ ...mockSettings, slowModeSeconds: 10 })),
      create: vi.fn(),
      update: vi.fn(),
    };

    const mockRateLimiter: IRateLimiterService = {
      checkUserMessageRate: vi.fn(async () => ({ allowed: false, remaining: 0, resetMs: 8000 })),
      checkUserRequestRate: vi.fn(),
      checkIpRequestRate: vi.fn(),
    };

    const chatService = new ChatService(mockMessageRepo, mockRoomRepo, mockSettingsRepo, mockRateLimiter);

    await expect(
      chatService.sendMessage('user-1', {
        roomId: 'room-1',
        message: 'Hello world!',
        type: 'TEXT',
      })
    ).rejects.toThrow('Slow mode active');
  });
});
