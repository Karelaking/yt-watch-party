import type { AuthUserContext } from '../modules/auth/auth.types.js';
import type { PlaybackStateSnapshot, ClientSyncPayload } from '../modules/playback/engine/playback-sync.engine.js';

export interface ServerToClientEvents {
  'playback:sync': (state: PlaybackStateSnapshot & { media?: unknown }) => void;
  'playback:action': (data: {
    actorId: string;
    action: string;
    position: number;
    playbackRate?: number;
    mediaId?: string | null;
    version: number;
  }) => void;
  'playlist:sync': (data: { playlistId: string; items: unknown[] }) => void;
  'room:member_joined': (data: { userId: string; role: string; displayName?: string | null }) => void;
  'room:member_left': (data: { userId: string; reason?: string }) => void;
  'room:member_updated': (data: { userId: string; nickname?: string | null; displayName?: string | null }) => void;
  'room:role_changed': (data: { userId: string; newRole: string; role?: string }) => void;
  'room:reaction': (data: { userId: string; userName: string; emoji: string }) => void;
  'room:settings_updated': (data: { roomId: string; settings: unknown }) => void;
  'chat:message': (data: { id: string; senderId: string; senderName: string; text: string; sentAt: string }) => void;
  'screenshare:signal': (data: { senderId: string; signal: unknown }) => void;
  'error': (data: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'room:join': (data: { roomId: string }, callback?: (response: { success: boolean; state?: PlaybackStateSnapshot & { media?: unknown }; error?: string }) => void) => void;
  'room:leave': (data: { roomId: string }) => void;
  'playback:action': (data: { roomId: string } & ClientSyncPayload, callback?: (response: { success: boolean; state?: PlaybackStateSnapshot & { media?: unknown }; error?: string }) => void) => void;
  'playback:heartbeat': (data: { roomId: string; clientPosition: number }) => void;
  'playlist:action': (data: { roomId: string; playlistId?: string; action: 'ADD' | 'REMOVE' | 'REORDER'; payload: unknown }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'room:reaction': (data: { roomId: string; emoji: string }) => void;
  'room:nickname': (data: { roomId: string; nickname: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'room:settings_update': (data: { roomId: string; settings: unknown }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'chat:send': (data: { roomId: string; text: string }) => void;
  'screenshare:signal': (data: { roomId: string; targetUserId?: string; signal: unknown }) => void;
}

export interface SocketData {
  user: AuthUserContext;
  currentRoomId?: string;
  watchSessionId?: string;
  role?: string;
  isOwner?: boolean;
  lastReactionAt?: number;
}
