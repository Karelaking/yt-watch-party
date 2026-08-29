import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Room } from '../src/realtime/domain/room.js';
import { RoomManager } from '../src/realtime/domain/room-manager.js';
import { Participant } from '../src/realtime/domain/participant.js';
import { MessageHandler, type HandlerContext } from '../src/realtime/domain/message-handler.js';
import { Permission } from '../src/modules/rbac/permissions.js';
import type { IRbacPolicyEngine } from '../src/modules/rbac/rbac-policy-engine.js';
import { ReactionHandler } from '../src/realtime/domain/handlers/reaction.handler.js';
import { SettingsUpdateHandler } from '../src/realtime/domain/handlers/settings-update.handler.js';

// Test concrete class
class DummyTestHandler extends MessageHandler<{ roomId: string; value: string }, { result: string }> {
  protected requiredPermission(): Permission | null {
    return Permission.CHAT_SEND;
  }

  protected async validate(_ctx: HandlerContext, data: { roomId: string; value: string }): Promise<string | null> {
    if (data.value === 'invalid') {
      return 'Value is invalid';
    }
    return null;
  }

  protected async execute(_ctx: HandlerContext, data: { roomId: string; value: string }): Promise<{ result: string }> {
    return { result: `Processed: ${data.value}` };
  }
}

describe('MessageHandler Base & Template Method Pattern', () => {
  let roomManager: RoomManager;
  let participants: Map<string, Participant>;
  let mockRbacEngine: IRbacPolicyEngine;
  let mockIo: any;
  let mockSocket: any;
  let room: Room;
  let participant: Participant;

  beforeEach(() => {
    roomManager = new RoomManager();
    participants = new Map();
    mockRbacEngine = {
      can: vi.fn(() => true),
      hasRoleAtLeast: vi.fn(() => true),
    };

    const mockEmit = vi.fn();
    mockIo = {
      to: vi.fn(() => ({ emit: mockEmit })),
    };

    mockSocket = {
      id: 'socket-1',
      data: {},
    };

    room = roomManager.getOrCreate({
      id: 'room-1',
      code: 'ABC123',
      name: 'Test Room',
      ownerId: 'user-1',
    });

    participant = Participant.fromAuthContext(
      { id: 'user-1', displayName: 'Alice' },
      'socket-1',
      'HOST',
      true,
    );
    participants.set('socket-1', participant);
    room.addParticipant(participant);
  });

  it('should successfully execute template method flow for valid request', async () => {
    const handler = new DummyTestHandler(roomManager, participants, mockRbacEngine);
    const callback = vi.fn();

    await handler.handle(mockIo, mockSocket, { roomId: 'room-1', value: 'hello' }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: true,
      result: 'Processed: hello',
    });
  });

  it('should fail when participant is not registered', async () => {
    participants.clear();
    const handler = new DummyTestHandler(roomManager, participants, mockRbacEngine);
    const callback = vi.fn();

    await handler.handle(mockIo, mockSocket, { roomId: 'room-1', value: 'hello' }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: 'Not authenticated or not in a room',
    });
  });

  it('should fail when room is not found in manager', async () => {
    const handler = new DummyTestHandler(roomManager, participants, mockRbacEngine);
    const callback = vi.fn();

    await handler.handle(mockIo, mockSocket, { roomId: 'non-existent', value: 'hello' }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: 'Room not found',
    });
  });

  it('should fail when permission is denied', async () => {
    // Non-owner participant with denied permission
    const viewer = Participant.fromAuthContext(
      { id: 'user-2', displayName: 'Bob' },
      'socket-2',
      'VIEWER',
      false,
    );
    participants.set('socket-2', viewer);
    room.addParticipant(viewer);

    mockRbacEngine.can = vi.fn(() => false);

    const handler = new DummyTestHandler(roomManager, participants, mockRbacEngine);
    const callback = vi.fn();

    await handler.handle(mockIo, { id: 'socket-2' } as any, { roomId: 'room-1', value: 'hello' }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: 'Permission denied: CHAT_SEND',
    });
  });

  it('should fail when custom validation fails', async () => {
    const handler = new DummyTestHandler(roomManager, participants, mockRbacEngine);
    const callback = vi.fn();

    await handler.handle(mockIo, mockSocket, { roomId: 'room-1', value: 'invalid' }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: 'Value is invalid',
    });
  });
});

describe('Concrete Handlers', () => {
  let roomManager: RoomManager;
  let participants: Map<string, Participant>;
  let mockRbacEngine: IRbacPolicyEngine;
  let mockIo: any;
  let mockSocket: any;
  let room: Room;
  let participant: Participant;

  beforeEach(() => {
    roomManager = new RoomManager();
    participants = new Map();
    mockRbacEngine = {
      can: vi.fn(() => true),
      hasRoleAtLeast: vi.fn(() => true),
    };

    const mockEmit = vi.fn();
    mockIo = {
      to: vi.fn(() => ({ emit: mockEmit })),
    };

    mockSocket = { id: 'socket-1' };

    room = roomManager.getOrCreate({
      id: 'room-1',
      code: 'ABC123',
      name: 'Test Room',
      ownerId: 'user-1',
    });

    participant = Participant.fromAuthContext(
      { id: 'user-1', displayName: 'Alice' },
      'socket-1',
      'HOST',
      true,
    );
    participants.set('socket-1', participant);
    room.addParticipant(participant);
  });

  describe('ReactionHandler', () => {
    it('should validate and broadcast emoji reaction', async () => {
      const handler = new ReactionHandler(roomManager, participants, mockRbacEngine);
      const callback = vi.fn();

      await handler.handle(mockIo, mockSocket, { roomId: 'room-1', emoji: '🔥' }, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          userId: 'user-1',
          userName: 'Alice',
          emoji: '🔥',
        }),
      );
      expect(mockIo.to).toHaveBeenCalledWith('room:room-1');
    });

    it('should reject empty emoji', async () => {
      const handler = new ReactionHandler(roomManager, participants, mockRbacEngine);
      const callback = vi.fn();

      await handler.handle(mockIo, mockSocket, { roomId: 'room-1', emoji: '' }, callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Emoji cannot be empty',
      });
    });
  });

  describe('SettingsUpdateHandler', () => {
    it('should update settings for host', async () => {
      const mockSettingsRepo = {
        update: vi.fn(async (_roomId, s) => ({ ...s, roomId: 'room-1' })),
      } as any;

      const handler = new SettingsUpdateHandler(roomManager, participants, mockRbacEngine, mockSettingsRepo);
      const callback = vi.fn();

      await handler.handle(
        mockIo,
        mockSocket,
        { roomId: 'room-1', settings: { allowChat: false } },
        callback,
      );

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          roomId: 'room-1',
          settings: expect.objectContaining({ allowChat: false }),
        }),
      );
    });

    it('should reject settings update for non-host', async () => {
      const viewer = Participant.fromAuthContext(
        { id: 'user-2', displayName: 'Bob' },
        'socket-2',
        'PARTICIPANT',
        false,
      );
      participants.set('socket-2', viewer);
      room.addParticipant(viewer);

      const mockSettingsRepo = { update: vi.fn() } as any;
      const handler = new SettingsUpdateHandler(roomManager, participants, mockRbacEngine, mockSettingsRepo);
      const callback = vi.fn();

      await handler.handle(
        mockIo,
        { id: 'socket-2' } as any,
        { roomId: 'room-1', settings: { allowChat: false } },
        callback,
      );

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Only room host can modify settings',
      });
    });
  });
});
