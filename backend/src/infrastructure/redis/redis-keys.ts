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
