/**
 * TypeScript definitions mapped directly from prisma/contract.prisma
 */

// ============================================================
// ENUMS
// ============================================================

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type RoomStatus = "ACTIVE" | "PAUSED" | "ENDED" | "ARCHIVED";

export type RoomVisibility = "PUBLIC" | "PRIVATE" | "UNLISTED";

export type RoomRole = "HOST" | "MODERATOR" | "PARTICIPANT" | "VIEWER";

export type MembershipStatus = "ACTIVE" | "LEFT" | "REMOVED" | "BANNED";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "REVOKED";

export type BanType = "USER" | "IP" | "DEVICE";

export type MediaType = "VIDEO" | "AUDIO" | "STREAM" | "SCREEN" | "EXTERNAL";

export type MediaProvider = "YOUTUBE" | "VIMEO" | "TWITCH" | "DIRECT_URL" | "HLS" | "DASH" | "CUSTOM";

export type PlaylistStatus = "ACTIVE" | "ARCHIVED";

export type WatchSessionStatus = "ACTIVE" | "ENDED";

export type ScreenShareStatus = "ACTIVE" | "ENDED";

export type PlaybackAction = "PLAY" | "PAUSE" | "SEEK" | "CHANGE_VIDEO" | "CHANGE_RATE";

export type RoomEventType =
  | "ROOM_CREATED"
  | "ROOM_UPDATED"
  | "ROOM_ENDED"
  | "USER_JOINED"
  | "USER_LEFT"
  | "USER_REMOVED"
  | "USER_BANNED"
  | "ROLE_ASSIGNED"
  | "HOST_TRANSFERRED"
  | "MEDIA_ADDED"
  | "MEDIA_REMOVED"
  | "MEDIA_CHANGED"
  | "PLAYBACK_PLAY"
  | "PLAYBACK_PAUSE"
  | "PLAYBACK_SEEK"
  | "PLAYBACK_RATE_CHANGED"
  | "PLAYLIST_CREATED"
  | "PLAYLIST_UPDATED"
  | "PLAYLIST_ITEM_ADDED"
  | "PLAYLIST_ITEM_REMOVED"
  | "PLAYLIST_ITEM_REORDERED"
  | "SCREEN_SHARE_STARTED"
  | "SCREEN_SHARE_ENDED"
  | "SETTINGS_UPDATED";

// ============================================================
// MODELS
// ============================================================

export interface User {
  id: string;
  clerkUserId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSettings {
  id: string;
  roomId: string;
  // Joining
  allowGuestJoin: boolean;
  requireApprovalToJoin: boolean;
  allowMemberInvite: boolean;
  // Chat
  allowChat: boolean;
  slowModeSeconds: number;
  // Screen sharing
  allowScreenShare: boolean;
  // Playback
  syncPlayback: boolean;
  autoplayNext: boolean;
  onlyHostCanControlPlayback: boolean;
  allowModeratorPlaybackControl: boolean;
  // Playlist
  allowPlaylistControl: boolean;
  onlyHostCanManagePlaylist: boolean;
  // Room lifecycle
  disconnectOnHostLeave: boolean;
  autoArchive: boolean;
  autoArchiveAfterMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  roomId: string;
  type: MediaType;
  provider: MediaProvider;
  externalId: string;
  sourceUrl: string;
  title: string | null;
  description?: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  mediaId: string;
  media: Media;
  position: number;
  addedById?: string | null;
  addedByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Playlist {
  id: string;
  roomId: string;
  createdById: string;
  name: string;
  description?: string | null;
  status: PlaylistStatus;
  createdAt: string;
  updatedAt: string;
  items: PlaylistItem[];
}

export interface PlaybackState {
  id: string;
  roomId: string;
  mediaId: string | null;
  media?: Media | null;
  position: number;
  isPlaying: boolean;
  playbackRate: number;
  version: number;
  serverTimestamp: string;
  lastAction?: PlaybackAction | null;
  lastActionById?: string | null;
  lastActionByName?: string | null;
  updatedAt: string;
}

export interface RoleHistory {
  id: string;
  membershipId: string;
  previousRole?: RoomRole | null;
  newRole: RoomRole;
  changedById: string;
  changedByName: string;
  changedAt: string;
  reason?: string | null;
}

export interface RoomMembership {
  id: string;
  roomId: string;
  userId: string;
  user: User;
  role: RoomRole;
  status: MembershipStatus;
  nickname?: string | null;
  joinedAt: string;
  leftAt?: string | null;
  lastSeenAt?: string | null;
  roleHistory?: RoleHistory[];
}

export interface RoomBan {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  createdById: string;
  createdByName: string;
  type: BanType;
  reason?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface RoomInvitation {
  id: string;
  roomId: string;
  inviterId: string;
  inviterName: string;
  inviteeId?: string | null;
  inviteeEmail?: string | null;
  tokenHash: string;
  inviteUrl: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}

export interface ScreenShareSession {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  status: ScreenShareStatus;
  startedAt: string;
  endedAt?: string | null;
}

export interface WatchSession {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  status: WatchSessionStatus;
  joinedAt: string;
  leftAt?: string | null;
  totalWatchSeconds: number;
  lastHeartbeatAt?: string | null;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  userRole: RoomRole;
  content: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  createdAt: string;
}

export interface RoomEvent {
  id: string;
  roomId: string;
  actorId?: string | null;
  actorName?: string | null;
  type: RoomEventType;
  payload?: unknown;
  createdAt: string;
}

export interface Room {
  id: string;
  code: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  ownerId: string;
  owner?: User;
  status: RoomStatus;
  visibility: RoomVisibility;
  maxMembers: number;
  discoverable: boolean;
  createdAt: string;
  updatedAt: string;
  endedAt?: string | null;
  archivedAt?: string | null;

  // Relations
  settings: RoomSettings;
  memberships: RoomMembership[];
  media: Media[];
  playlists: Playlist[];
  playbackState: PlaybackState;
  events: RoomEvent[];
  chatMessages: ChatMessage[];
  bans: RoomBan[];
  invitations: RoomInvitation[];
  activeScreenShare?: ScreenShareSession | null;
  watchSessions: WatchSession[];
}

export function normalizeRoom(raw: any, rawSettings?: any): Room {
  const entity = raw.room ? raw.room : raw;
  const settings = raw.settings || rawSettings || {
    id: `settings-${entity.id}`,
    roomId: entity.id,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    id: entity.id,
    code: entity.code,
    slug: entity.slug ?? null,
    name: entity.name,
    description: entity.description ?? null,
    ownerId: entity.ownerId,
    owner: entity.owner
      ? {
          id: entity.owner.id || entity.ownerId,
          clerkUserId: entity.owner.clerkUserId || entity.owner.id || entity.ownerId,
          username: entity.owner.username || "Host",
          displayName: entity.owner.displayName || "Host",
          avatarUrl: entity.owner.avatarUrl || null,
          email: entity.owner.email || null,
          status: entity.owner.status || "ACTIVE",
          createdAt: typeof entity.owner.createdAt === "string" ? entity.owner.createdAt : new Date(entity.owner.createdAt || Date.now()).toISOString(),
          updatedAt: typeof entity.owner.updatedAt === "string" ? entity.owner.updatedAt : new Date(entity.owner.updatedAt || Date.now()).toISOString(),
        }
      : {
          id: entity.ownerId,
          clerkUserId: entity.ownerId,
          username: "Host",
          displayName: "Host",
          avatarUrl: null,
          email: null,
          status: "ACTIVE",
          createdAt: typeof entity.createdAt === "string" ? entity.createdAt : new Date(entity.createdAt || Date.now()).toISOString(),
          updatedAt: typeof entity.updatedAt === "string" ? entity.updatedAt : new Date(entity.updatedAt || Date.now()).toISOString(),
        },
    status: entity.status || "ACTIVE",
    visibility: entity.visibility || "PUBLIC",
    maxMembers: entity.maxMembers || 50,
    discoverable: entity.discoverable ?? true,
    createdAt: typeof entity.createdAt === "string" ? entity.createdAt : new Date(entity.createdAt || Date.now()).toISOString(),
    updatedAt: typeof entity.updatedAt === "string" ? entity.updatedAt : new Date(entity.updatedAt || Date.now()).toISOString(),
    endedAt: entity.endedAt ? (typeof entity.endedAt === "string" ? entity.endedAt : new Date(entity.endedAt).toISOString()) : null,
    archivedAt: entity.archivedAt ? (typeof entity.archivedAt === "string" ? entity.archivedAt : new Date(entity.archivedAt).toISOString()) : null,
    settings: {
      id: settings.id || `settings-${entity.id}`,
      roomId: entity.id,
      allowGuestJoin: settings.allowGuestJoin ?? true,
      requireApprovalToJoin: settings.requireApprovalToJoin ?? false,
      allowMemberInvite: settings.allowMemberInvite ?? true,
      allowChat: settings.allowChat ?? true,
      slowModeSeconds: settings.slowModeSeconds ?? 0,
      allowScreenShare: settings.allowScreenShare ?? true,
      syncPlayback: settings.syncPlayback ?? true,
      autoplayNext: settings.autoplayNext ?? true,
      onlyHostCanControlPlayback: settings.onlyHostCanControlPlayback ?? false,
      allowModeratorPlaybackControl: settings.allowModeratorPlaybackControl ?? true,
      allowPlaylistControl: settings.allowPlaylistControl ?? true,
      onlyHostCanManagePlaylist: settings.onlyHostCanManagePlaylist ?? false,
      disconnectOnHostLeave: settings.disconnectOnHostLeave ?? false,
      autoArchive: settings.autoArchive ?? false,
      createdAt: typeof settings.createdAt === "string" ? settings.createdAt : new Date(settings.createdAt || Date.now()).toISOString(),
      updatedAt: typeof settings.updatedAt === "string" ? settings.updatedAt : new Date(settings.updatedAt || Date.now()).toISOString(),
    },
    memberships: Array.isArray(entity.memberships)
      ? entity.memberships.map((m: any) => ({
          ...m,
          user: m.user
            ? {
                ...m.user,
                clerkUserId: m.user.clerkUserId || m.user.id || m.userId,
              }
            : {
                id: m.userId,
                clerkUserId: m.userId,
                displayName: m.nickname || "User",
                username: m.nickname || "user",
                avatarUrl: null,
                email: null,
                status: "ACTIVE",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
        }))
      : [],
    media: Array.isArray(entity.media) ? entity.media : [],
    playlists: Array.isArray(entity.playlists) ? entity.playlists : [],
    playbackState: entity.playbackState || {
      id: `pb-${entity.id}`,
      roomId: entity.id,
      mediaId: null,
      position: 0,
      isPlaying: false,
      playbackRate: 1.0,
      version: 1,
      serverTimestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    events: Array.isArray(entity.events) ? entity.events : [],
    chatMessages: Array.isArray(entity.chatMessages) ? entity.chatMessages : [],
    bans: Array.isArray(entity.bans) ? entity.bans : [],
    invitations: Array.isArray(entity.invitations) ? entity.invitations : [],
    activeScreenShare: entity.activeScreenShare ?? null,
    watchSessions: Array.isArray(entity.watchSessions) ? entity.watchSessions : [],
  };
}

