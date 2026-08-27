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

  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    ...env.CORS_ORIGIN.split(',').map((s) => s.trim()),
  ];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes('*') ||
          (env.NODE_ENV === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
        ) {
          callback(null, true);
        } else {
          callback(new Error(`Not allowed by CORS: ${origin}`));
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
