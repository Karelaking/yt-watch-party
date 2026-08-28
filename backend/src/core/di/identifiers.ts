export const TYPES = {
  // Databases & Clients
  PrismaDb: Symbol.for('PrismaDb'),
  RedisClient: Symbol.for('RedisClient'),

  // Caching & Redis Services
  CacheService: Symbol.for('CacheService'),
  DistributedLockService: Symbol.for('DistributedLockService'),
  RateLimiterService: Symbol.for('RateLimiterService'),
  PlaybackStateCache: Symbol.for('PlaybackStateCache'),
  PresenceCache: Symbol.for('PresenceCache'),
  RoomPubSubService: Symbol.for('RoomPubSubService'),
  SessionAccumulatorService: Symbol.for('SessionAccumulatorService'),

  // Repositories
  UserRepository: Symbol.for('UserRepository'),
  UserDeviceRepository: Symbol.for('UserDeviceRepository'),
  RoomRepository: Symbol.for('RoomRepository'),
  RoomSettingsRepository: Symbol.for('RoomSettingsRepository'),
  MembershipRepository: Symbol.for('MembershipRepository'),
  BanRepository: Symbol.for('BanRepository'),
  InvitationRepository: Symbol.for('InvitationRepository'),
  MediaRepository: Symbol.for('MediaRepository'),
  PlaylistRepository: Symbol.for('PlaylistRepository'),
  PlaybackRepository: Symbol.for('PlaybackRepository'),
  PlaybackHistoryRepository: Symbol.for('PlaybackHistoryRepository'),
  WatchSessionRepository: Symbol.for('WatchSessionRepository'),
  ScreenShareSessionRepository: Symbol.for('ScreenShareSessionRepository'),
  RoomEventRepository: Symbol.for('RoomEventRepository'),
  WebhookEventRepository: Symbol.for('WebhookEventRepository'),
  MessageRepository: Symbol.for('MessageRepository'),

  // Infrastructure & Adapters
  ClerkClientAdapter: Symbol.for('ClerkClientAdapter'),
  MediaProviderStrategy: Symbol.for('MediaProviderStrategy'),
  EventDispatcher: Symbol.for('EventDispatcher'),

  // Application Services
  AuthService: Symbol.for('AuthService'),
  RbacPolicyEngine: Symbol.for('RbacPolicyEngine'),
  UserService: Symbol.for('UserService'),
  RoomService: Symbol.for('RoomService'),
  RoomSettingsService: Symbol.for('RoomSettingsService'),
  MembershipService: Symbol.for('MembershipService'),
  BanService: Symbol.for('BanService'),
  InvitationService: Symbol.for('InvitationService'),
  MediaService: Symbol.for('MediaService'),
  PlaylistService: Symbol.for('PlaylistService'),
  PlaybackSyncEngine: Symbol.for('PlaybackSyncEngine'),
  PlaybackService: Symbol.for('PlaybackService'),
  WatchSessionService: Symbol.for('WatchSessionService'),
  WebhookSyncService: Symbol.for('WebhookSyncService'),
  ChatService: Symbol.for('ChatService'),

  // Controllers
  UserController: Symbol.for('UserController'),
  RoomController: Symbol.for('RoomController'),
  RoomSettingsController: Symbol.for('RoomSettingsController'),
  MembershipController: Symbol.for('MembershipController'),
  BanController: Symbol.for('BanController'),
  InvitationController: Symbol.for('InvitationController'),
  MediaController: Symbol.for('MediaController'),
  PlaylistController: Symbol.for('PlaylistController'),
  PlaybackController: Symbol.for('PlaybackController'),
  WebhookController: Symbol.for('WebhookController'),
  ChatController: Symbol.for('ChatController'),

  // Realtime Gateway
  WatchPartyGateway: Symbol.for('WatchPartyGateway'),
} as const;

export type ServiceIdentifier = (typeof TYPES)[keyof typeof TYPES];
