import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../config/env.config.js';
import { container } from '../core/di/container.js';
import { TYPES } from '../core/di/identifiers.js';
import { getRedis } from '../infrastructure/database/redis.js';
import type { IAuthService } from '../modules/auth/interfaces/auth.service.interface.js';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from './socket.types.js';

export function createSocketServer(
  httpServer: HttpServer
): SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> {
  const explicitOrigins = [
    'https://watchparty-yt.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    ...env.CORS_ORIGIN.split(',').map((s) => s.trim().replace(/\/$/, '')),
  ];

  const isAllowedOrigin = (origin?: string): boolean => {
    if (!origin) return true;
    const cleanOrigin = origin.replace(/\/$/, '');
    if (explicitOrigins.includes(cleanOrigin) || explicitOrigins.includes('*')) return true;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) return true;
    if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(cleanOrigin)) return true;
    if (/^https:\/\/([a-zA-Z0-9_-]+\.)?vercel\.app$/.test(cleanOrigin)) return true;
    if (/^https:\/\/([a-zA-Z0-9_-]+\.)?railway\.app$/.test(cleanOrigin)) return true;
    if (/^https:\/\/([a-zA-Z0-9_-]+\.)?up\.railway\.app$/.test(cleanOrigin)) return true;
    if (env.NODE_ENV !== 'production') return true;
    return false;
  };

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    {
      transports: ['websocket', 'polling'],
      cors: {
        origin: (origin, callback) => {
          if (isAllowedOrigin(origin)) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        },
        credentials: true,
      },
      pingTimeout: 20000,
      pingInterval: 10000,
      maxHttpBufferSize: 1e6, // 1MB payload buffer limit
      perMessageDeflate: {
        threshold: 1024, // Compress packets larger than 1KB
        zlibDeflateOptions: {
          chunkSize: 16 * 1024,
        },
      },
    }
  );

  // Setup Redis Adapter for multi-instance horizontal scaling
  try {
    const pubClient = getRedis();
    const subClient = pubClient.duplicate();
    pubClient.on('error', (err: unknown) => {
      console.warn('[Socket.IO Redis Pub Client Error]:', err instanceof Error ? err.message : err);
    });
    subClient.on('error', (err: unknown) => {
      console.warn('[Socket.IO Redis Sub Client Error]:', err instanceof Error ? err.message : err);
    });
    io.adapter(createAdapter(pubClient, subClient));
    console.log('📡 Socket.IO Redis adapter attached for horizontal scaling');
  } catch (err: unknown) {
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
