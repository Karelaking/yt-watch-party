import {
  type RoomRole,
  type RoomSettingsSnapshot,
  Permission,
  ROLE_HIERARCHY,
} from './permissions.js';
import type { IService } from '../../core/interfaces/index.js';

export interface IRbacPolicyEngine extends IService {
  can(role: RoomRole, settings: Partial<RoomSettingsSnapshot> | null | undefined, permission: Permission): boolean;
  hasRoleAtLeast(currentRole: RoomRole, targetRole: RoomRole): boolean;
}

export class RbacPolicyEngine implements IRbacPolicyEngine {
  public hasRoleAtLeast(currentRole: RoomRole, targetRole: RoomRole): boolean {
    return (ROLE_HIERARCHY[currentRole] ?? 0) >= (ROLE_HIERARCHY[targetRole] ?? 0);
  }

  public can(
    role: RoomRole,
    settings: Partial<RoomSettingsSnapshot> | null | undefined,
    permission: Permission
  ): boolean {
    // HOST has absolute permissions in the room
    if (role === 'HOST') {
      return true;
    }

    // Default settings if null
    const s: RoomSettingsSnapshot = {
      allowGuestJoin: false,
      requireApprovalToJoin: false,
      allowMemberInvite: true,
      allowChat: true,
      slowModeSeconds: 0,
      allowScreenShare: true,
      syncPlayback: true,
      autoplayNext: true,
      onlyHostCanControlPlayback: true,
      allowModeratorPlaybackControl: true,
      allowPlaylistControl: true,
      onlyHostCanManagePlaylist: false,
      disconnectOnHostLeave: false,
      ...settings,
    };

    switch (permission) {
      case Permission.ROOM_VIEW:
        return true;

      case Permission.ROOM_UPDATE_INFO:
      case Permission.ROOM_UPDATE_SETTINGS:
      case Permission.ROOM_DELETE:
      case Permission.ROOM_TRANSFER_HOST:
      case Permission.MEMBER_ROLE_CHANGE:
        // Exclusively HOST
        return false;

      case Permission.MEMBER_KICK:
      case Permission.MEMBER_BAN:
        // MODERATOR can moderate if they are at least MODERATOR
        return role === 'MODERATOR';

      case Permission.MEMBER_INVITE:
        if (role === 'MODERATOR') return true;
        if (role === 'PARTICIPANT') return s.allowMemberInvite;
        return false;

      case Permission.PLAYBACK_CONTROL:
      case Permission.PLAYBACK_CHANGE_MEDIA:
        // Per spec: only HOST and MODERATOR may control playback.
        // PARTICIPANT and VIEWER are always "watch only".
        // The `onlyHostCanControlPlayback` setting governs whether
        // Moderators are also allowed (false = Host+Mod, true = Host only).
        if (role === 'MODERATOR') {
          return !s.onlyHostCanControlPlayback && s.allowModeratorPlaybackControl;
        }
        return false; // PARTICIPANT and VIEWER cannot control playback

      case Permission.PLAYLIST_MANAGE:
        if (!s.allowPlaylistControl) return false;
        if (role === 'MODERATOR') return true;
        if (role === 'PARTICIPANT') {
          return !s.onlyHostCanManagePlaylist;
        }
        return false; // VIEWER cannot manage playlist

      case Permission.SCREEN_SHARE:
        if (!s.allowScreenShare) return false;
        return role === 'MODERATOR' || role === 'PARTICIPANT';

      case Permission.CHAT_SEND:
        if (!s.allowChat) return false;
        return true; // All active roles can chat if enabled

      default:
        return false;
    }
  }
}

export const rbacPolicyEngine = new RbacPolicyEngine();
