import { describe, it, expect, vi } from 'vitest';
import { Room } from '../src/realtime/domain/room.js';
import { RoomManager } from '../src/realtime/domain/room-manager.js';
import { Participant } from '../src/realtime/domain/participant.js';

const mockUser = {
  id: 'user-1',
  clerkUserId: 'clerk_1',
  displayName: 'Alice',
  email: 'alice@example.com',
  avatarUrl: null,
};

const mockUser2 = {
  id: 'user-2',
  clerkUserId: 'clerk_2',
  displayName: 'Bob',
  email: 'bob@example.com',
  avatarUrl: null,
};

const mockRoomEntity = {
  id: 'room-1',
  code: 'ABC123',
  name: 'Test Party',
  ownerId: 'user-1',
};

describe('Room', () => {
  describe('construction', () => {
    it('should create from entity via factory', () => {
      const room = Room.fromEntity(mockRoomEntity, { allowChat: true });
      expect(room.id).toBe('room-1');
      expect(room.code).toBe('ABC123');
      expect(room.name).toBe('Test Party');
      expect(room.ownerId).toBe('user-1');
      expect(room.channel).toBe('room:room-1');
      expect(room.settings).toEqual({ allowChat: true });
    });
  });

  describe('participant management', () => {
    it('should add and retrieve participants', () => {
      const room = Room.fromEntity(mockRoomEntity);
      const p = Participant.fromAuthContext(mockUser, 'sock-1', 'HOST', true);

      room.addParticipant(p);
      expect(room.participantCount).toBe(1);
      expect(room.getParticipant('sock-1')).toBe(p);
      expect(room.hasUser('user-1')).toBe(true);
      expect(room.hasUser('user-2')).toBe(false);
    });

    it('should find participant by user ID', () => {
      const room = Room.fromEntity(mockRoomEntity);
      const p = Participant.fromAuthContext(mockUser, 'sock-1', 'HOST', true);
      room.addParticipant(p);

      expect(room.findParticipantByUserId('user-1')).toBe(p);
      expect(room.findParticipantByUserId('clerk_1')).toBe(p);
      expect(room.findParticipantByUserId('unknown')).toBeUndefined();
    });

    it('should remove participant by socket ID', () => {
      const room = Room.fromEntity(mockRoomEntity);
      const p = Participant.fromAuthContext(mockUser, 'sock-1', 'HOST', true);
      room.addParticipant(p);

      const removed = room.removeParticipant('sock-1');
      expect(removed).toBe(p);
      expect(room.participantCount).toBe(0);
    });

    it('should remove participant by user ID', () => {
      const room = Room.fromEntity(mockRoomEntity);
      const p1 = Participant.fromAuthContext(mockUser, 'sock-1', 'HOST', true);
      const p2 = Participant.fromAuthContext(mockUser, 'sock-2', 'HOST', true); // same user, 2 sockets
      room.addParticipant(p1);
      room.addParticipant(p2);

      const removed = room.removeParticipantByUserId('user-1');
      expect(removed).toHaveLength(2);
      expect(room.participantCount).toBe(0);
    });

    it('should return all participants as array', () => {
      const room = Room.fromEntity(mockRoomEntity);
      const p1 = Participant.fromAuthContext(mockUser, 'sock-1', 'HOST', true);
      const p2 = Participant.fromAuthContext(mockUser2, 'sock-2', 'PARTICIPANT', false);
      room.addParticipant(p1);
      room.addParticipant(p2);

      expect(room.participants).toHaveLength(2);
    });
  });

  describe('ownership', () => {
    it('should check isOwner', () => {
      const room = Room.fromEntity(mockRoomEntity);
      expect(room.isOwner('user-1')).toBe(true);
      expect(room.isOwner('user-2')).toBe(false);
    });

    it('should transfer ownership', () => {
      const room = Room.fromEntity(mockRoomEntity);
      room.transferOwnership('user-2');
      expect(room.ownerId).toBe('user-2');
      expect(room.isOwner('user-2')).toBe(true);
      expect(room.isOwner('user-1')).toBe(false);
    });
  });

  describe('settings', () => {
    it('should update settings', () => {
      const room = Room.fromEntity(mockRoomEntity, { allowChat: false });
      room.updateSettings({ allowChat: true, slowModeSeconds: 5 });
      expect(room.settings).toEqual({ allowChat: true, slowModeSeconds: 5 });
    });

    it('should invalidate settings', () => {
      const room = Room.fromEntity(mockRoomEntity, { allowChat: true });
      room.invalidateSettings();
      expect(room.settings).toBeNull();
    });
  });

  describe('broadcast', () => {
    it('should emit to the correct room channel', () => {
      const room = Room.fromEntity(mockRoomEntity);
      const mockEmit = vi.fn();
      const mockIo = {
        to: vi.fn(() => ({ emit: mockEmit })),
      } as any;

      room.broadcast(mockIo, 'room:member_joined', { userId: 'u1', role: 'HOST' });
      expect(mockIo.to).toHaveBeenCalledWith('room:room-1');
      expect(mockEmit).toHaveBeenCalledWith('room:member_joined', { userId: 'u1', role: 'HOST' });
    });
  });

  describe('serialization', () => {
    it('should produce correct participant list', () => {
      const room = Room.fromEntity(mockRoomEntity);
      const p1 = Participant.fromAuthContext(mockUser, 'sock-1', 'HOST', true, 'AliceNick');
      const p2 = Participant.fromAuthContext(mockUser2, 'sock-2', 'PARTICIPANT', false);
      room.addParticipant(p1);
      room.addParticipant(p2);

      const list = room.toParticipantList();
      expect(list).toEqual([
        { userId: 'user-1', role: 'HOST', displayName: 'AliceNick' },
        { userId: 'user-2', role: 'PARTICIPANT', displayName: 'Bob' },
      ]);
    });
  });
});

describe('RoomManager', () => {
  it('should create rooms lazily via getOrCreate', () => {
    const manager = new RoomManager();
    expect(manager.size).toBe(0);

    const room = manager.getOrCreate(mockRoomEntity, { allowChat: true });
    expect(room.id).toBe('room-1');
    expect(manager.size).toBe(1);

    // Should return the same instance on second call
    const same = manager.getOrCreate(mockRoomEntity);
    expect(same).toBe(room);
    expect(manager.size).toBe(1);
  });

  it('should get and has', () => {
    const manager = new RoomManager();
    expect(manager.has('room-1')).toBe(false);
    expect(manager.get('room-1')).toBeUndefined();

    manager.getOrCreate(mockRoomEntity);
    expect(manager.has('room-1')).toBe(true);
    expect(manager.get('room-1')).toBeDefined();
  });

  it('should remove rooms', () => {
    const manager = new RoomManager();
    manager.getOrCreate(mockRoomEntity);
    expect(manager.remove('room-1')).toBe(true);
    expect(manager.size).toBe(0);
  });

  it('should cleanup empty rooms', () => {
    const manager = new RoomManager();
    const room = manager.getOrCreate(mockRoomEntity);

    // Room has no participants — should cleanup
    expect(manager.cleanupIfEmpty('room-1')).toBe(true);
    expect(manager.size).toBe(0);
  });

  it('should NOT cleanup rooms with participants', () => {
    const manager = new RoomManager();
    const room = manager.getOrCreate(mockRoomEntity);
    room.addParticipant(Participant.fromAuthContext(mockUser, 's1', 'HOST', true));

    expect(manager.cleanupIfEmpty('room-1')).toBe(false);
    expect(manager.size).toBe(1);
  });
});
