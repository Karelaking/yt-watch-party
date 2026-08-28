/**
 * Singleton Socket.IO client factory.
 * Typed to match the backend's ServerToClientEvents / ClientToServerEvents.
 */
import { io, Socket } from "socket.io-client";

// ─── Event type mirrors (kept in-sync with backend/src/realtime/socket.types.ts) ───

export interface PlaybackStateSnapshot {
  mediaId: string | null;
  media?: any;
  position: number;
  isPlaying: boolean;
  playbackRate: number;
  version: number;
  serverTimestamp: string;
}

export interface ClientSyncPayload {
  action: "PLAY" | "PAUSE" | "SEEK" | "CHANGE_VIDEO" | "CHANGE_RATE";
  position: number;
  playbackRate?: number;
  mediaId?: string | null;
}

export interface ServerToClientEvents {
  "playback:sync": (state: PlaybackStateSnapshot) => void;
  "playback:action": (data: {
    actorId: string;
    action: string;
    position: number;
    playbackRate?: number;
    mediaId?: string | null;
    version: number;
  }) => void;
  "playlist:sync": (data: { playlistId: string; items: any[] }) => void;
  "room:member_joined": (data: {
    userId: string;
    role: string;
    displayName?: string | null;
  }) => void;
  "room:member_left": (data: { userId: string }) => void;
  "room:role_changed": (data: { userId: string; newRole: string }) => void;
  "room:reaction": (data: { userId: string; userName: string; emoji: string }) => void;
  "room:settings_updated": (data: { roomId: string; settings: any }) => void;
  "chat:message": (data: {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    sentAt: string;
  }) => void;
  "screenshare:signal": (data: { senderId: string; signal: unknown }) => void;
  error: (data: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  "room:join": (
    data: { roomId: string },
    callback?: (response: {
      success: boolean;
      state?: PlaybackStateSnapshot;
      error?: string;
    }) => void
  ) => void;
  "room:leave": (data: { roomId: string }) => void;
  "playback:action": (
    data: { roomId: string } & ClientSyncPayload,
    callback?: (response: { success: boolean; state?: PlaybackStateSnapshot; error?: string }) => void
  ) => void;
  "playback:heartbeat": (data: {
    roomId: string;
    clientPosition: number;
  }) => void;
  "playlist:action": (
    data: {
      roomId: string;
      playlistId?: string;
      action: "ADD" | "REMOVE" | "REORDER";
      payload: unknown;
    },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  "room:reaction": (data: { roomId: string; emoji: string }) => void;
  "room:settings_update": (
    data: { roomId: string; settings: unknown },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  "chat:send": (data: { roomId: string; text: string }) => void;
  "screenshare:signal": (data: {
    roomId: string;
    targetUserId?: string;
    signal: unknown;
  }) => void;
}

// ─── Singleton state ───────────────────────────────────────────────────────────

let _socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let _currentToken: string | null = null;
let _tokenGetter: (() => Promise<string | null>) | null = null;

function resolveWsUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl;
  }
  // Dev fallback: connect to the backend on the same host that served this
  // page, so LAN devices work without hardcoding localhost.
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      return `${window.location.protocol}//${host}:3001`;
    }
  }
  return "https://yt-watch-party.up.railway.app";
}

export function getSocket(
  token: string,
  getTokenFn?: () => Promise<string | null>
): Socket<ServerToClientEvents, ClientToServerEvents> {
  const wsUrl = resolveWsUrl();

  if (getTokenFn) {
    _tokenGetter = getTokenFn;
  }
  _currentToken = token;

  // Reconnect if socket was disconnected
  if (_socket && !_socket.connected) {
    _socket.disconnect();
    _socket = null;
  }

  if (!_socket) {
    _socket = io(wsUrl, {
      auth: async (cb: (data: { token: string | null }) => void) => {
        try {
          const freshToken = _tokenGetter ? await _tokenGetter() : _currentToken;
          cb({ token: freshToken || _currentToken });
        } catch {
          cb({ token: _currentToken });
        }
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    _socket.on("connect_error", async (err) => {
      if (err.message && err.message.toLowerCase().includes("auth") && _tokenGetter) {
        try {
          const freshToken = await _tokenGetter();
          if (freshToken && _socket) {
            _currentToken = freshToken;
            _socket.auth = { token: freshToken };
            _socket.connect();
          }
        } catch {
          // ignore
        }
      }
    });
  }

  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
    _currentToken = null;
    _tokenGetter = null;
  }
}
