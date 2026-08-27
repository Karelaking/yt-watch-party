export type RoomRole = 'HOST' | 'MODERATOR' | 'PARTICIPANT' | 'VIEWER';
export type MembershipStatus = 'ACTIVE' | 'LEFT' | 'REMOVED' | 'BANNED';

export enum Permission {
  // Room Management
  ROOM_VIEW = 'ROOM_VIEW',
  ROOM_UPDATE_INFO = 'ROOM_UPDATE_INFO',
  ROOM_UPDATE_SETTINGS = 'ROOM_UPDATE_SETTINGS',
  ROOM_DELETE = 'ROOM_DELETE',
  ROOM_TRANSFER_HOST = 'ROOM_TRANSFER_HOST',

  // Member Management
  MEMBER_INVITE = 'MEMBER_INVITE',
  MEMBER_KICK = 'MEMBER_KICK',
  MEMBER_BAN = 'MEMBER_BAN',
  MEMBER_ROLE_CHANGE = 'MEMBER_ROLE_CHANGE',

  // Playback Control
  PLAYBACK_CONTROL = 'PLAYBACK_CONTROL',
  PLAYBACK_CHANGE_MEDIA = 'PLAYBACK_CHANGE_MEDIA',

  // Playlist Management
  PLAYLIST_MANAGE = 'PLAYLIST_MANAGE',

  // Collaboration / Interaction
  SCREEN_SHARE = 'SCREEN_SHARE',
  CHAT_SEND = 'CHAT_SEND',
}

export interface RoomSettingsSnapshot {
  allowGuestJoin: boolean;
  requireApprovalToJoin: boolean;
  allowMemberInvite: boolean;
  allowChat: boolean;
  slowModeSeconds: number;
  allowScreenShare: boolean;
  syncPlayback: boolean;
  autoplayNext: boolean;
  onlyHostCanControlPlayback: boolean;
  allowModeratorPlaybackControl: boolean;
  allowPlaylistControl: boolean;
  onlyHostCanManagePlaylist: boolean;
  disconnectOnHostLeave: boolean;
}

export const ROLE_HIERARCHY: Record<RoomRole, number> = {
  HOST: 4,
  MODERATOR: 3,
  PARTICIPANT: 2,
  VIEWER: 1,
};
