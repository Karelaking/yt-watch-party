import { describe, it, expect, vi } from 'vitest';
import { Participant } from '../src/realtime/domain/participant.js';
import { Permission } from '../src/modules/rbac/permissions.js';
import type { IRbacPolicyEngine } from '../src/modules/rbac/rbac-policy-engine.js';

describe('Participant', () => {
  const mockUser = {
    id: 'user-1',
    clerkUserId: 'clerk_1',
    displayName: 'Alice',
    email: 'alice@example.com',
    avatarUrl: 'https://img.clerk.com/alice.jpg',
  };

  describe('construction & factory', () => {
    it('should create from auth context via factory method', () => {
      const p = Participant.fromAuthContext(mockUser, 'sock-1', 'PARTICIPANT', false, 'AliceNick');

      expect(p.userId).toBe('user-1');
      expect(p.clerkUserId).toBe('clerk_1');
      expect(p.socketId).toBe('sock-1');
      expect(p.displayName).toBe('Alice');
      expect(p.email).toBe('alice@example.com');
      expect(p.avatarUrl).toBe('https://img.clerk.com/alice.jpg');
      expect(p.role).toBe('PARTICIPANT');
      expect(p.isOwner).toBe(false);
      expect(p.nickname).toBe('AliceNick');
    });

    it('should handle null/undefined optional fields', () => {
      const p = Participant.fromAuthContext(
        { id: 'u2' },
        'sock-2',
        'VIEWER',
        false,
      );

      expect(p.clerkUserId).toBeNull();
      expect(p.displayName).toBeNull();
      expect(p.email).toBeNull();
      expect(p.avatarUrl).toBeNull();
      expect(p.nickname).toBeNull();
    });
  });

  describe('role management', () => {
    it('should promote to a new role', () => {
      const p = Participant.fromAuthContext(mockUser, 'sock-1', 'PARTICIPANT', false);
      expect(p.role).toBe('PARTICIPANT');

      p.promote('MODERATOR');
      expect(p.role).toBe('MODERATOR');

      p.promote('HOST');
      expect(p.role).toBe('HOST');
    });

    it('should check hasRoleAtLeast correctly', () => {
      const host = Participant.fromAuthContext(mockUser, 's', 'HOST', true);
      expect(host.hasRoleAtLeast('HOST')).toBe(true);
      expect(host.hasRoleAtLeast('MODERATOR')).toBe(true);
      expect(host.hasRoleAtLeast('PARTICIPANT')).toBe(true);
      expect(host.hasRoleAtLeast('VIEWER')).toBe(true);

      const participant = Participant.fromAuthContext(mockUser, 's', 'PARTICIPANT', false);
      expect(participant.hasRoleAtLeast('HOST')).toBe(false);
      expect(participant.hasRoleAtLeast('MODERATOR')).toBe(false);
      expect(participant.hasRoleAtLeast('PARTICIPANT')).toBe(true);
      expect(participant.hasRoleAtLeast('VIEWER')).toBe(true);

      const viewer = Participant.fromAuthContext(mockUser, 's', 'VIEWER', false);
      expect(viewer.hasRoleAtLeast('PARTICIPANT')).toBe(false);
      expect(viewer.hasRoleAtLeast('VIEWER')).toBe(true);
    });
  });

  describe('nickname management', () => {
    it('should set and get nickname', () => {
      const p = Participant.fromAuthContext(mockUser, 's', 'PARTICIPANT', false);
      expect(p.nickname).toBeNull();

      p.setNickname('CoolAlice');
      expect(p.nickname).toBe('CoolAlice');
    });
  });

  describe('permission queries', () => {
    it('should always allow owner regardless of role', () => {
      const mockEngine: IRbacPolicyEngine = {
        can: vi.fn(() => false),
        hasRoleAtLeast: vi.fn(() => false),
      };

      const owner = Participant.fromAuthContext(mockUser, 's', 'PARTICIPANT', true);
      expect(owner.can(Permission.PLAYBACK_CONTROL, null, mockEngine)).toBe(true);
      // Should NOT delegate to engine for owner
      expect(mockEngine.can).not.toHaveBeenCalled();
    });

    it('should delegate to RBAC engine for non-owners', () => {
      const mockEngine: IRbacPolicyEngine = {
        can: vi.fn(() => false),
        hasRoleAtLeast: vi.fn(() => false),
      };

      const participant = Participant.fromAuthContext(mockUser, 's', 'PARTICIPANT', false);
      const result = participant.can(Permission.PLAYBACK_CONTROL, { onlyHostCanControlPlayback: true }, mockEngine);

      expect(result).toBe(false);
      expect(mockEngine.can).toHaveBeenCalledWith('PARTICIPANT', { onlyHostCanControlPlayback: true }, Permission.PLAYBACK_CONTROL);
    });
  });

  describe('display name resolution', () => {
    it('should prefer nickname over displayName', () => {
      const p = Participant.fromAuthContext(mockUser, 's', 'PARTICIPANT', false, 'NickAlice');
      expect(p.resolveDisplayName()).toBe('NickAlice');
    });

    it('should fall back to displayName when no nickname', () => {
      const p = Participant.fromAuthContext(mockUser, 's', 'PARTICIPANT', false);
      expect(p.resolveDisplayName()).toBe('Alice');
    });

    it('should fall back to email prefix when no displayName', () => {
      const p = Participant.fromAuthContext(
        { id: 'u', email: 'bob@test.com' },
        's',
        'PARTICIPANT',
        false,
      );
      expect(p.resolveDisplayName()).toBe('bob');
    });

    it('should fall back to Member when nothing available', () => {
      const p = Participant.fromAuthContext({ id: 'u' }, 's', 'PARTICIPANT', false);
      expect(p.resolveDisplayName()).toBe('Member');
    });
  });

  describe('serialization', () => {
    it('should produce correct member payload', () => {
      const p = Participant.fromAuthContext(mockUser, 's', 'MODERATOR', false, 'ModAlice');
      const payload = p.toMemberPayload();

      expect(payload).toEqual({
        userId: 'user-1',
        role: 'MODERATOR',
        displayName: 'ModAlice',
      });
    });

    it('should produce correct chat sender payload', () => {
      const p = Participant.fromAuthContext(mockUser, 's', 'HOST', true, 'HostAlice');
      const payload = p.toChatSenderPayload();

      expect(payload).toEqual({
        senderId: 'user-1',
        senderName: 'HostAlice',
        userNickname: 'HostAlice',
        userRole: 'HOST',
        userAvatar: 'https://img.clerk.com/alice.jpg',
      });
    });
  });
});
