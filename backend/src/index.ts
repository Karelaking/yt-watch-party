import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.config.js';
import { prisma } from './infrastructure/database/prisma.js';
import { connectMongoose, disconnectMongoose } from './infrastructure/database/mongoose.js';
import { getRedis, disconnectRedis } from './infrastructure/database/redis.js';
import { createSocketServer } from './realtime/socket-server.js';
import { WatchPartyGateway } from './realtime/gateways/watch-party.gateway.js';
import { container } from './core/di/container.js';
import { TYPES } from './core/di/identifiers.js';
import type { IPlaybackService } from './modules/playback/services/playback.service.js';
import type { IRoomRepository, IRoomSettingsRepository } from './modules/rooms/repositories/room.repository.interface.js';
import type { IMembershipRepository, IBanRepository } from './modules/memberships/repositories/membership.repository.interface.js';
import type { ISessionRepository } from './modules/sessions/repositories/session.repository.interface.js';
import type { IRbacPolicyEngine } from './modules/rbac/rbac-policy-engine.js';
import type { IEventDispatcher } from './core/events/index.js';
import type { IPresenceCache } from './infrastructure/cache/presence.cache.js';
import type { IChatService } from './modules/chat/services/chat.service.js';
import type { IPlaylistService } from './modules/playlists/services/playlist.service.js';
import type { IDistributedLockService } from './infrastructure/redis/redis-lock.service.js';
import type { IRoomPubSubService } from './infrastructure/redis/room-pubsub.service.js';

async function bootstrap(): Promise<void> {
  console.log('🔄 Initializing database connections...');

  // Initialize NeonDB (Prisma), MongoDB (Mongoose), and Redis (ioredis)
  try {
    await prisma.$connect();
    console.log('🐘 NeonDB (PostgreSQL) connected via Prisma ORM');
  } catch (err) {
    console.warn('⚠️ NeonDB connection warning (will retry on query):', err instanceof Error ? err.message : err);
  }

  try {
    await connectMongoose();
  } catch (err) {
    console.warn('⚠️ MongoDB connection warning:', err instanceof Error ? err.message : err);
  }

  try {
    const redis = getRedis();
    if (redis.status === 'wait') {
      await redis.connect();
      console.log('⚡ Redis (Upstash) connected successfully via TLS');
    }
  } catch (err) {
    console.warn('⚠️ Redis connection warning:', err instanceof Error ? err.message : err);
  }

  const app = createApp();
  const httpServer = createServer(app);

  // Initialize WebSockets Realtime Server
  const io = createSocketServer(httpServer);

  // Initialize Realtime Watch Party Gateway
  new WatchPartyGateway(
    io,
    container.resolve<IPlaybackService>(TYPES.PlaybackService),
    container.resolve<IRoomRepository>(TYPES.RoomRepository),
    container.resolve<IRoomSettingsRepository>(TYPES.RoomSettingsRepository),
    container.resolve<IMembershipRepository>(TYPES.MembershipRepository),
    container.resolve<IBanRepository>(TYPES.BanRepository),
    container.resolve<ISessionRepository>(TYPES.WatchSessionRepository),
    container.resolve<IRbacPolicyEngine>(TYPES.RbacPolicyEngine),
    container.resolve<IEventDispatcher>(TYPES.EventDispatcher),
    container.resolve<IPresenceCache>(TYPES.PresenceCache),
    container.resolve<IChatService>(TYPES.ChatService),
    container.resolve<IDistributedLockService>(TYPES.DistributedLockService),
    container.resolve<IPlaylistService>(TYPES.PlaylistService),
    container.resolve<IRoomPubSubService>(TYPES.RoomPubSubService)
  );

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 YouTube Watch Party Server running on http://localhost:${env.PORT}`);
    console.log(`📡 WebSockets listening on ws://localhost:${env.PORT}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
  });


  // Graceful Shutdown Handler
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Gracefully shutting down server...`);

    httpServer.close(async () => {
      console.log('HTTP & WebSocket servers closed.');

      try {
        await Promise.allSettled([
          prisma.$disconnect(),
          disconnectMongoose(),
          disconnectRedis(),
        ]);
        console.log('✅ All database connections closed cleanly.');
      } catch (err) {
        console.error('Error during database disconnection:', err);
      }

      process.exit(0);
    });

    // Force exit if shutdown hangs
    setTimeout(() => {
      console.error('Forcefully terminating after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});