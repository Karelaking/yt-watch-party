import express, { type Express, type Request, type Response, json, urlencoded } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.config.js';
import { registerDependencies } from './core/di/register-dependencies.js';
import { requestLogger, errorHandler } from './core/middlewares/index.js';
import { NotFoundError } from './core/errors/index.js';

// Feature Routes
import { authenticateUser } from './modules/auth/middlewares/auth.middleware.js';
import { createUserRoutes } from './modules/users/index.js';
import { createRoomRoutes } from './modules/rooms/index.js';
import { createMembershipRoutes } from './modules/memberships/index.js';
import { createMediaRoutes } from './modules/media/index.js';
import { createPlaylistRoutes } from './modules/playlists/index.js';
import { createPlaybackRoutes } from './modules/playback/index.js';
import { createWebhookRoutes } from './modules/webhooks/index.js';
import { createChatRoutes } from './modules/chat/index.js';

export function createApp(): Express {
  // Initialize Dependency Injection
  registerDependencies();

  const app: Express = express();

  // Security & Core Middlewares - Enable cross-origin resource policy for API requests
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    })
  );

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

  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );


  app.use(requestLogger);

  // Mount Webhook Routes before standard JSON body parser (since webhook needs raw payload)
  app.use('/api/v1/webhooks', createWebhookRoutes());

  // Standard Body Parsers
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // Mount API v1 Feature Routes
  const apiRouter = express.Router();
  apiRouter.use(authenticateUser);
  apiRouter.use('/users', createUserRoutes());
  apiRouter.use('/rooms', createRoomRoutes());
  apiRouter.use('/memberships', createMembershipRoutes());
  apiRouter.use('/media', createMediaRoutes());
  apiRouter.use('/playlists', createPlaylistRoutes());
  apiRouter.use('/playback', createPlaybackRoutes());
  apiRouter.use('/chat', createChatRoutes());

  app.use('/api/v1', apiRouter);

  // Catch-all 404 Handler
  app.use((req: Request, _res: Response, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
