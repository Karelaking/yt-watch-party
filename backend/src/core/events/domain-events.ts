export interface IDomainEvent<T = unknown> {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: T;
}

export enum DomainEventType {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',

  ROOM_CREATED = 'ROOM_CREATED',
  ROOM_UPDATED = 'ROOM_UPDATED',
  ROOM_ENDED = 'ROOM_ENDED',

  MEMBER_JOINED = 'MEMBER_JOINED',
  MEMBER_LEFT = 'MEMBER_LEFT',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  MEMBER_BANNED = 'MEMBER_BANNED',
  ROLE_CHANGED = 'ROLE_CHANGED',

  PLAYBACK_ACTION = 'PLAYBACK_ACTION',
  MEDIA_ADDED = 'MEDIA_ADDED',
  MEDIA_CHANGED = 'MEDIA_CHANGED',
  PLAYLIST_UPDATED = 'PLAYLIST_UPDATED',

  SCREEN_SHARE_STARTED = 'SCREEN_SHARE_STARTED',
  SCREEN_SHARE_ENDED = 'SCREEN_SHARE_ENDED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
}

export class BaseDomainEvent<T = unknown> implements IDomainEvent<T> {
  public readonly occurredAt: Date = new Date();
  constructor(
    public readonly eventName: string,
    public readonly payload: T
  ) {}
}

export class UserCreatedEvent extends BaseDomainEvent<{ userId: string; clerkUserId: string; email?: string | null }> {
  constructor(payload: { userId: string; clerkUserId: string; email?: string | null }) {
    super(DomainEventType.USER_CREATED, payload);
  }
}

export class RoomCreatedEvent extends BaseDomainEvent<{ roomId: string; code: string; ownerId: string }> {
  constructor(payload: { roomId: string; code: string; ownerId: string }) {
    super(DomainEventType.ROOM_CREATED, payload);
  }
}

export class RoomEndedEvent extends BaseDomainEvent<{ roomId: string }> {
  constructor(payload: { roomId: string }) {
    super(DomainEventType.ROOM_ENDED, payload);
  }
}

export class MemberJoinedEvent extends BaseDomainEvent<{ roomId: string; userId: string; role: string; displayName?: string | null }> {
  constructor(payload: { roomId: string; userId: string; role: string; displayName?: string | null }) {
    super(DomainEventType.MEMBER_JOINED, payload);
  }
}

export class RoleChangedEvent extends BaseDomainEvent<{ roomId: string; userId: string; newRole: string; changedById: string }> {
  constructor(payload: { roomId: string; userId: string; newRole: string; changedById: string }) {
    super(DomainEventType.ROLE_CHANGED, payload);
  }
}

export class MemberLeftEvent extends BaseDomainEvent<{ roomId: string; userId: string }> {
  constructor(payload: { roomId: string; userId: string }) {
    super(DomainEventType.MEMBER_LEFT, payload);
  }
}

export class MemberRemovedEvent extends BaseDomainEvent<{ roomId: string; userId: string; actorId: string }> {
  constructor(payload: { roomId: string; userId: string; actorId: string }) {
    super(DomainEventType.MEMBER_REMOVED, payload);
  }
}

export class MemberBannedEvent extends BaseDomainEvent<{ roomId: string; userId: string; actorId: string; reason?: string }> {
  constructor(payload: { roomId: string; userId: string; actorId: string; reason?: string }) {
    super(DomainEventType.MEMBER_BANNED, payload);
  }
}

export class SettingsUpdatedEvent extends BaseDomainEvent<{ roomId: string; settings: any }> {
  constructor(payload: { roomId: string; settings: any }) {
    super(DomainEventType.SETTINGS_UPDATED, payload);
  }
}

export class PlaybackActionEvent extends BaseDomainEvent<{
  roomId: string;
  actorId: string;
  action: 'PLAY' | 'PAUSE' | 'SEEK' | 'CHANGE_VIDEO' | 'CHANGE_RATE';
  mediaId?: string | null;
  position: number;
  playbackRate: number;
  version: number;
}> {
  constructor(payload: {
    roomId: string;
    actorId: string;
    action: 'PLAY' | 'PAUSE' | 'SEEK' | 'CHANGE_VIDEO' | 'CHANGE_RATE';
    mediaId?: string | null;
    position: number;
    playbackRate: number;
    version: number;
  }) {
    super(DomainEventType.PLAYBACK_ACTION, payload);
  }
}
