import { describe, it, expect } from 'vitest';
import { RbacPolicyEngine } from '../src/modules/rbac/rbac-policy-engine.js';
import { Permission } from '../src/modules/rbac/permissions.js';

describe('RbacPolicyEngine', () => {
  const engine = new RbacPolicyEngine();

  describe('HOST permissions', () => {
    it('should allow HOST to perform all actions regardless of settings', () => {
      const restrictiveSettings = {
        onlyHostCanControlPlayback: true,
        allowModeratorPlaybackControl: false,
        allowChat: false,
        allowScreenShare: false,
        onlyHostCanManagePlaylist: true,
        allowPlaylistControl: false,
      };

      for (const perm of Object.values(Permission)) {
        expect(engine.can('HOST', restrictiveSettings, perm)).toBe(true);
      }
    });
  });

  describe('MODERATOR permissions', () => {
    it('should allow kick, ban, invite, and chat by default', () => {
      expect(engine.can('MODERATOR', null, Permission.MEMBER_KICK)).toBe(true);
      expect(engine.can('MODERATOR', null, Permission.MEMBER_BAN)).toBe(true);
      expect(engine.can('MODERATOR', null, Permission.MEMBER_INVITE)).toBe(true);
      expect(engine.can('MODERATOR', null, Permission.CHAT_SEND)).toBe(true);
    });

    it('should NOT allow host-exclusive actions (delete room, change settings, transfer host)', () => {
      expect(engine.can('MODERATOR', null, Permission.ROOM_DELETE)).toBe(false);
      expect(engine.can('MODERATOR', null, Permission.ROOM_UPDATE_SETTINGS)).toBe(false);
      expect(engine.can('MODERATOR', null, Permission.ROOM_TRANSFER_HOST)).toBe(false);
      expect(engine.can('MODERATOR', null, Permission.MEMBER_ROLE_CHANGE)).toBe(false);
    });

    it('should respect allowModeratorPlaybackControl when onlyHostCanControlPlayback is true', () => {
      const settingsAllowed = {
        onlyHostCanControlPlayback: true,
        allowModeratorPlaybackControl: true,
      };
      expect(engine.can('MODERATOR', settingsAllowed, Permission.PLAYBACK_CONTROL)).toBe(true);

      const settingsDisallowed = {
        onlyHostCanControlPlayback: true,
        allowModeratorPlaybackControl: false,
      };
      expect(engine.can('MODERATOR', settingsDisallowed, Permission.PLAYBACK_CONTROL)).toBe(false);
    });
  });

  describe('PARTICIPANT permissions', () => {
    it('should allow playback control by default, unless onlyHostCanControlPlayback is enabled', () => {
      expect(engine.can('PARTICIPANT', { onlyHostCanControlPlayback: false }, Permission.PLAYBACK_CONTROL)).toBe(true);
      expect(engine.can('PARTICIPANT', { onlyHostCanControlPlayback: true }, Permission.PLAYBACK_CONTROL)).toBe(false);
    });

    it('should allow playlist management by default, unless onlyHostCanManagePlaylist is enabled', () => {
      expect(engine.can('PARTICIPANT', { allowPlaylistControl: true, onlyHostCanManagePlaylist: false }, Permission.PLAYLIST_MANAGE)).toBe(true);
      expect(engine.can('PARTICIPANT', { allowPlaylistControl: true, onlyHostCanManagePlaylist: true }, Permission.PLAYLIST_MANAGE)).toBe(false);
    });

    it('should not allow kick or ban', () => {
      expect(engine.can('PARTICIPANT', null, Permission.MEMBER_KICK)).toBe(false);
      expect(engine.can('PARTICIPANT', null, Permission.MEMBER_BAN)).toBe(false);
    });
  });

  describe('VIEWER permissions', () => {
    it('should allow viewing and chat (if enabled) but never playback or playlist changes', () => {
      expect(engine.can('VIEWER', null, Permission.ROOM_VIEW)).toBe(true);
      expect(engine.can('VIEWER', { allowChat: true }, Permission.CHAT_SEND)).toBe(true);
      expect(engine.can('VIEWER', { allowChat: false }, Permission.CHAT_SEND)).toBe(false);
      expect(engine.can('VIEWER', null, Permission.PLAYBACK_CONTROL)).toBe(false);
      expect(engine.can('VIEWER', null, Permission.PLAYLIST_MANAGE)).toBe(false);
    });
  });
});
