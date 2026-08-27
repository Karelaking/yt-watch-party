import { Router, raw } from 'express';
import { container } from '../../core/di/container.js';
import { TYPES } from '../../core/di/identifiers.js';
import type { WebhookController } from './controllers/webhook.controller.js';

export function createWebhookRoutes(): Router {
  const router = Router();
  const controller = container.resolve<WebhookController>(TYPES.WebhookController);

  // Raw body parser for webhook signature verification
  router.post('/clerk', raw({ type: 'application/json' }), controller.handleClerkWebhook);

  return router;
}

export * from './repositories/webhook.repository.interface.js';
export * from './repositories/prisma-webhook.repository.js';
export * from './handlers/webhook-handlers.js';
export * from './services/webhook-sync.service.js';
export * from './controllers/webhook.controller.js';
