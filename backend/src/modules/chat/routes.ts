import { Router } from 'express';
import { container } from '../../core/di/container.js';
import { TYPES } from '../../core/di/identifiers.js';
import { optionalAuth, requireAuth } from '../auth/middlewares/auth.middleware.js';
import { validateRequest } from '../../core/middlewares/validate-request.middleware.js';
import { SendMessageSchema, ListMessagesQuerySchema, EditMessageSchema } from './dtos/chat.dto.js';
import type { ChatController } from './controllers/chat.controller.js';

export function createChatRoutes(): Router {
  const router = Router();
  const controller = container.resolve<ChatController>(TYPES.ChatController);

  router.get('/rooms/:roomId/messages', optionalAuth, validateRequest({ query: ListMessagesQuerySchema }), controller.getMessages);
  router.post('/rooms/:roomId/messages', requireAuth, validateRequest({ body: SendMessageSchema.omit({ roomId: true }) }), controller.sendMessage);
  router.patch('/messages/:messageId', requireAuth, validateRequest({ body: EditMessageSchema }), controller.editMessage);
  router.delete('/messages/:messageId', requireAuth, controller.deleteMessage);

  return router;
}

