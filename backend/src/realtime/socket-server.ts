import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../config/env.config.js';
import { container } from '../core/di/container.js';
import { TYPES } from '../core/di/identifiers.js';
import { createRedisClient } from '../infrastructure/database/redis.js';
import type { IAuthService } from '../modules/auth/interfaces/auth.service.interface.js';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from './socket.types.js';

export function createSocketServer(
  httpServer: HttpServer
): SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> {
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((s) => s.trim());

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    {
      cors: {
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
      },
      pingTimeout: 20000,
      pingInterval: 10000,
    }
  );

  // Setup Redis Adapter for multi-instance horizontal scaling
  try {
    const pubClient = createRedisClient();
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log('📡 Socket.IO Redis adapter attached for horizontal scaling');
  } catch (err) {
    console.warn('[Socket.IO Redis Adapter Warning]: Falling back to in-memory adapter:', err);
  }

  // Authentication Handshake Middleware using Clerk
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.['token'] ||
        (socket.handshake.headers['authorization']?.split(' ')[1] ?? null);

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const authService = container.resolve<IAuthService>(TYPES.AuthService);
      const user = await authService.verifyToken(token);

      socket.data.user = user;
      next();
    } catch (err) {
      console.warn('[Socket Auth] Authentication failed:', err);
      next(new Error('Authentication failed'));
    }
  });

  return io;
}
