import { container } from './container.js';
import { TYPES } from './identifiers.js';

// Database & Caching Infrastructure
import { prisma } from '../../infrastructure/database/prisma.js';
import { getRedis } from '../../infrastructure/database/redis.js';
import { RedisLockService } from '../../infrastructure/redis/redis-lock.service.js';
import { RedisRateLimiterService } from '../../infrastructure/redis/rate-limiter.service.js';
import { RedisCacheService } from '../../infrastructure/cache/redis-cache.service.js';
import { RedisPlaybackStateCache } from '../../infrastructure/cache/playback-state.cache.js';
import { RedisPresenceCache } from '../../infrastructure/cache/presence.cache.js';
import { RoomPubSubService } from '../../infrastructure/redis/room-pubsub.service.js';
import { SessionAccumulatorService } from '../../infrastructure/redis/session-accumulator.service.js';

// Repositories
import { PrismaUserRepository, PrismaUserDeviceRepository } from '../../modules/users/repositories/prisma-user.repository.js';
import { PrismaRoomRepository, PrismaRoomSettingsRepository } from '../../modules/rooms/repositories/prisma-room.repository.js';
import {
  PrismaMembershipRepository,
  PrismaBanRepository,
  PrismaInvitationRepository,
} from '../../modules/memberships/repositories/prisma-membership.repository.js';
import { PrismaMediaRepository } from '../../modules/media/repositories/prisma-media.repository.js';
import { PrismaPlaylistRepository } from '../../modules/playlists/repositories/prisma-playlist.repository.js';
import { PrismaPlaybackRepository } from '../../modules/playback/repositories/prisma-playback.repository.js';
import { PrismaSessionRepository } from '../../modules/sessions/index.js';
import { PrismaWebhookRepository } from '../../modules/webhooks/repositories/prisma-webhook.repository.js';
import { MongooseMessageRepository } from '../../modules/chat/repositories/mongoose-message.repository.js';

// Infrastructure & Adapters
import { ClerkClientAdapter } from '../../modules/auth/infrastructure/clerk-client.adapter.js';
import { MediaProviderStrategy } from '../../modules/media/providers/youtube.provider.js';
import { eventDispatcher } from '../events/index.js';
import { rbacPolicyEngine } from '../../modules/rbac/rbac-policy-engine.js';
import { PlaybackSyncEngine } from '../../modules/playback/engine/playback-sync.engine.js';

// Webhook Handlers
import {
  ClerkUserCreatedHandler,
  ClerkUserUpdatedHandler,
  ClerkUserDeletedHandler,
} from '../../modules/webhooks/handlers/webhook-handlers.js';

// Services
import { AuthService } from '../../modules/auth/services/auth.service.js';
import { UserService } from '../../modules/users/services/user.service.js';
import { RoomService } from '../../modules/rooms/services/room.service.js';
import { MembershipService } from '../../modules/memberships/services/membership.service.js';
import { MediaService } from '../../modules/media/services/media.service.js';
import { PlaylistService } from '../../modules/playlists/services/playlist.service.js';
import { PlaybackService } from '../../modules/playback/services/playback.service.js';
import { WebhookSyncService } from '../../modules/webhooks/services/webhook-sync.service.js';
import { ChatService } from '../../modules/chat/services/chat.service.js';

// Controllers
import { UserController } from '../../modules/users/controllers/user.controller.js';
import { RoomController } from '../../modules/rooms/controllers/room.controller.js';
import { MembershipController } from '../../modules/memberships/controllers/membership.controller.js';
import { MediaController } from '../../modules/media/controllers/media.controller.js';
import { PlaylistController } from '../../modules/playlists/controllers/playlist.controller.js';
import { PlaybackController } from '../../modules/playback/controllers/playback.controller.js';
import { WebhookController } from '../../modules/webhooks/controllers/webhook.controller.js';
import { ChatController } from '../../modules/chat/controllers/chat.controller.js';

export function registerDependencies(): void {
  // Core Infrastructure Singletons
  container.registerInstance(TYPES.PrismaDb, prisma);
  container.registerSingleton(TYPES.RedisClient, () => getRedis());

  // Redis & Caching Services
  container.registerSingleton(
    TYPES.DistributedLockService,
    (c) => new RedisLockService(c.resolve(TYPES.RedisClient))
  );
  container.registerSingleton(
    TYPES.RateLimiterService,
    (c) => new RedisRateLimiterService(c.resolve(TYPES.RedisClient))
  );
  container.registerSingleton(
    TYPES.CacheService,
    (c) => new RedisCacheService(c.resolve(TYPES.RedisClient))
  );
  container.registerSingleton(
    TYPES.PlaybackStateCache,
    (c) => new RedisPlaybackStateCache(c.resolve(TYPES.RedisClient))
  );
  container.registerSingleton(
    TYPES.PresenceCache,
    (c) => new RedisPresenceCache(c.resolve(TYPES.RedisClient))
  );
  container.registerSingleton(
    TYPES.RoomPubSubService,
    (c) => new RoomPubSubService(c.resolve(TYPES.RedisClient))
  );
  container.registerSingleton(
    TYPES.SessionAccumulatorService,
    (c) => new SessionAccumulatorService(c.resolve(TYPES.RedisClient), c.resolve(TYPES.PrismaDb))
  );

  // Repositories
  container.registerSingleton(TYPES.UserRepository, (c) => new PrismaUserRepository(c.resolve(TYPES.PrismaDb)));
  container.registerSingleton(TYPES.UserDeviceRepository, (c) => new PrismaUserDeviceRepository(c.resolve(TYPES.PrismaDb)));
  container.registerSingleton(TYPES.RoomRepository, (c) => new PrismaRoomRepository(c.resolve(TYPES.PrismaDb)));
  container.registerSingleton(TYPES.RoomSettingsRepository, (c) => new PrismaRoomSettingsRepository(c.resolve(TYPES.PrismaDb)));
  container.registerSingleton(TYPES.MembershipRepository, (c) => new PrismaMembershipRepository(c.resolve(TYPES.PrismaDb)));
  container.registerSingleton(TYPES.BanRepository, (c) => new PrismaBanRepository(c.resolve(TYPES.PrismaDb)));
  container.registerSingleton(TYPES.InvitationRepository, (c) => new PrismaInvitationRepository(c.resolve(TYPES.PrismaDb)));
  container.registerSingleton(TYPES.MediaRepository, (c) => new PrismaMediaRepository(c.resolve(TYPES.PrismaDb)));
  container.registerSingleton(TYPES.PlaylistRepository, (c) => new PrismaPlaylistRepository(c.resolve(TYPES.PrismaDb)));
  container.registerSingleton(TYPES.PlaybackRepository, (c) => new PrismaPlaybackRepository(c.resolve(TYPES.PrismaDb)));
  container.registerSingleton(TYPES.WatchSessionRepository, (c) => new PrismaSessionRepository(c.resolve(TYPES.PrismaDb)));
  container.registerSingleton(TYPES.WebhookEventRepository, (c) => new PrismaWebhookRepository(c.resolve(TYPES.PrismaDb)));
  container.registerSingleton(TYPES.MessageRepository, () => new MongooseMessageRepository());

  // Domain Infrastructure
  container.registerSingleton(TYPES.ClerkClientAdapter, () => new ClerkClientAdapter());
  container.registerSingleton(TYPES.MediaProviderStrategy, () => new MediaProviderStrategy());
  container.registerInstance(TYPES.EventDispatcher, eventDispatcher);
  container.registerInstance(TYPES.RbacPolicyEngine, rbacPolicyEngine);
  container.registerSingleton(TYPES.PlaybackSyncEngine, () => new PlaybackSyncEngine());

  // Application Services
  container.registerSingleton(
    TYPES.AuthService,
    (c) => new AuthService(c.resolve(TYPES.ClerkClientAdapter), c.resolve(TYPES.UserRepository))
  );

  container.registerSingleton(
    TYPES.UserService,
    (c) => new UserService(c.resolve(TYPES.UserRepository), c.resolve(TYPES.UserDeviceRepository))
  );

  container.registerSingleton(
    TYPES.RoomService,
    (c) =>
      new RoomService(
        c.resolve(TYPES.RoomRepository),
        c.resolve(TYPES.RoomSettingsRepository),
        c.resolve(TYPES.EventDispatcher),
        c.resolve(TYPES.MembershipRepository),
        c.resolve(TYPES.BanRepository),
        c.resolve(TYPES.MessageRepository),
        c.resolve(TYPES.RedisClient)
      )
  );

  container.registerSingleton(
    TYPES.MembershipService,
    (c) =>
      new MembershipService(
        c.resolve(TYPES.MembershipRepository),
        c.resolve(TYPES.BanRepository),
        c.resolve(TYPES.RoomRepository),
        c.resolve(TYPES.RoomSettingsRepository),
        c.resolve(TYPES.EventDispatcher)
      )
  );

  container.registerSingleton(
    TYPES.MediaService,
    (c) => new MediaService(c.resolve(TYPES.MediaRepository), c.resolve(TYPES.MediaProviderStrategy))
  );

  container.registerSingleton(
    TYPES.PlaylistService,
    (c) => new PlaylistService(c.resolve(TYPES.PlaylistRepository), c.resolve(TYPES.MediaService))
  );

  container.registerSingleton(
    TYPES.PlaybackService,
    (c) =>
      new PlaybackService(
        c.resolve(TYPES.PlaybackRepository),
        c.resolve(TYPES.PlaybackSyncEngine),
        c.resolve(TYPES.MediaRepository),
        c.resolve(TYPES.EventDispatcher),
        c.resolve(TYPES.PlaybackStateCache),
        c.resolve(TYPES.RoomPubSubService)
      )
  );

  container.registerSingleton(
    TYPES.ChatService,
    (c) =>
      new ChatService(
        c.resolve(TYPES.MessageRepository),
        c.resolve(TYPES.RoomRepository),
        c.resolve(TYPES.RoomSettingsRepository),
        c.resolve(TYPES.RateLimiterService)
      )
  );

  container.registerSingleton(TYPES.WebhookSyncService, (c) => {
    const userRepo = c.resolve<PrismaUserRepository>(TYPES.UserRepository);
    const dispatcher = c.resolve<typeof eventDispatcher>(TYPES.EventDispatcher);
    const handlers = [
      new ClerkUserCreatedHandler(userRepo, dispatcher),
      new ClerkUserUpdatedHandler(userRepo),
      new ClerkUserDeletedHandler(userRepo),
    ];
    return new WebhookSyncService(c.resolve(TYPES.WebhookEventRepository), handlers);
  });

  // Controllers
  container.registerSingleton(TYPES.UserController, (c) => new UserController(c.resolve(TYPES.UserService)));
  container.registerSingleton(TYPES.RoomController, (c) => new RoomController(c.resolve(TYPES.RoomService)));
  container.registerSingleton(
    TYPES.MembershipController,
    (c) => new MembershipController(c.resolve(TYPES.MembershipService))
  );
  container.registerSingleton(TYPES.MediaController, (c) => new MediaController(c.resolve(TYPES.MediaService)));
  container.registerSingleton(
    TYPES.PlaylistController,
    (c) => new PlaylistController(c.resolve(TYPES.PlaylistService))
  );
  container.registerSingleton(
    TYPES.PlaybackController,
    (c) => new PlaybackController(c.resolve(TYPES.PlaybackService))
  );
  container.registerSingleton(
    TYPES.WebhookController,
    (c) => new WebhookController(c.resolve(TYPES.WebhookSyncService))
  );
  container.registerSingleton(
    TYPES.ChatController,
    (c) => new ChatController(c.resolve(TYPES.ChatService))
  );
}
