/**
 * Centralized, type-safe Redis key taxonomy for the WatchParty platform.
 * Prefix: watchparty:
 */
export const RedisKeys = {
  PREFIX: 'watchparty',

  // Room State & Presence
  roomPresence: (roomId: string): string => `watchparty:room:${roomId}:presence`,
  roomConnections: (roomId: string): string => `watchparty:room:${roomId}:connections`,
  roomPlayback: (roomId: string): string => `watchparty:room:${roomId}:playback`,
  roomState: (roomId: string): string => `watchparty:room:${roomId}:state`,
  roomTyping: (roomId: string): string => `watchparty:room:${roomId}:typing`,
  roomViewers: (roomId: string): string => `watchparty:room:${roomId}:viewers`,

  // Concurrency & Distributed Locks
  lockPlayback: (roomId: string): string => `watchparty:room:${roomId}:lock:playback`,
  lockPlaylist: (roomId: string): string => `watchparty:room:${roomId}:lock:playlist`,

  // Global User Presence
  userPresence: (userId: string): string => `watchparty:user:${userId}:presence`,

  // Socket Identifiers
  socketUser: (socketId: string): string => `watchparty:socket:${socketId}:user`,
  socketRoom: (socketId: string): string => `watchparty:socket:${socketId}:room`,

  // Caching & Lookups
  roomMeta: (roomId: string): string => `watchparty:room:${roomId}:meta`,
  roomSettings: (roomId: string): string => `watchparty:room:${roomId}:settings`,
  roomBans: (roomId: string): string => `watchparty:room:${roomId}:bans`,

  // Sessions & Metrics Accumulation
  sessionsPendingWatchTime: (): string => `watchparty:sessions:pending_watch_time`,

  // Rate Limiting
  rateUserMessages: (userId: string): string => `watchparty:rate:user:${userId}:messages`,
  rateUserRequests: (userId: string): string => `watchparty:rate:user:${userId}:requests`,
  rateIpRequests: (ip: string): string => `watchparty:rate:ip:${ip}:requests`,

  // Pub-Sub Topics & Channels
  pubsubRoom: (roomId: string): string => `watchparty:pubsub:room:${roomId}`,
  pubsubPattern: (): string => `watchparty:pubsub:room:*`,
} as const;

/**
 * Standard Redis Key Expiration (TTL) policies.
 */
export const RedisTTL = {
  // Presence & Connections (Seconds)
  SOCKET_USER: 86400, // 24 hours (cleaned up on disconnect)
  SOCKET_ROOM: 86400, // 24 hours (cleaned up on disconnect)
  ROOM_PRESENCE: 86400, // 24 hours
  ROOM_CONNECTIONS: 86400, // 24 hours
  ROOM_VIEWERS: 86400, // 24 hours
  USER_PRESENCE_ONLINE: 86400, // 24 hours
  USER_PRESENCE_OFFLINE: 3600, // 1 hour for offline state cache

  // Ephemeral Room States (Seconds)
  TYPING_INDICATOR: 5, // 5 seconds
  PENDING_WATCH_TIME: 86400, // 24 hours safety TTL
  PROCESSING_BATCH: 600, // 10 minutes safety TTL for in-flight batches

  // Distributed Locks (Milliseconds)
  LOCK_PLAYBACK_MS: 3000, // 3 seconds
  LOCK_PLAYLIST_MS: 3000, // 3 seconds

  // Rate Limiting (Milliseconds)
  RATE_USER_MESSAGES_WINDOW_MS: 5000, // 5 seconds
  RATE_USER_REQUESTS_WINDOW_MS: 60000, // 1 minute
  RATE_IP_REQUESTS_WINDOW_MS: 60000, // 1 minute
} as const;
