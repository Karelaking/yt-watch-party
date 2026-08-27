import { Webhook } from 'svix';
import { env } from '../../../config/env.config.js';
import type { IWebhookRepository } from '../repositories/webhook.repository.interface.js';
import type { IWebhookHandler, ClerkWebhookPayload } from '../handlers/webhook-handlers.js';
import { BadRequestError } from '../../../core/errors/index.js';
import type { IService } from '../../../core/interfaces/index.js';

export interface IWebhookSyncService extends IService {
  verifyAndProcessWebhook(
    rawBody: string,
    headers: {
      svixId?: string;
      svixTimestamp?: string;
      svixSignature?: string;
    }
  ): Promise<{ success: boolean; eventId: string; message: string }>;
}

export class WebhookSyncService implements IWebhookSyncService {
  constructor(
    private readonly webhookRepository: IWebhookRepository,
    private readonly handlers: IWebhookHandler[]
  ) {}

  public async verifyAndProcessWebhook(
    rawBody: string,
    headers: {
      svixId?: string;
      svixTimestamp?: string;
      svixSignature?: string;
    }
  ): Promise<{ success: boolean; eventId: string; message: string }> {
    const { svixId, svixTimestamp, svixSignature } = headers;

    if (!svixId || !svixTimestamp || !svixSignature) {
      if (env.NODE_ENV === 'production') {
        throw new BadRequestError('Missing required Svix signature headers', 'MISSING_WEBHOOK_HEADERS');
      }
    }

    let payload: ClerkWebhookPayload;

    if (env.NODE_ENV !== 'test' && env.CLERK_WEBHOOK_SECRET && svixId && svixTimestamp && svixSignature) {
      try {
        const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
        payload = wh.verify(rawBody, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        }) as ClerkWebhookPayload;
      } catch (err) {
        throw new BadRequestError(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Invalid signature'}`);
      }
    } else {
      try {
        payload = JSON.parse(rawBody) as ClerkWebhookPayload;
      } catch {
        throw new BadRequestError('Invalid JSON payload');
      }
    }

    const eventId = svixId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const eventType = payload.type;

    // Check idempotency
    const alreadyProcessed = await this.webhookRepository.isProcessed(eventId);
    if (alreadyProcessed) {
      return { success: true, eventId, message: 'Event already processed (idempotent skip)' };
    }

    await this.webhookRepository.recordEvent(eventId, eventType, payload, 'CLERK');

    // Find matching handler
    const handler = this.handlers.find((h) => h.canHandle(eventType));
    if (!handler) {
      // Unhandled event type, mark processed so we don't retry repeatedly
      await this.webhookRepository.markProcessed(eventId);
      return { success: true, eventId, message: `Ignored unhandled event type: ${eventType}` };
    }

    try {
      const userId = await handler.handle(payload);
      await this.webhookRepository.markProcessed(eventId, userId);
      return { success: true, eventId, message: `Successfully processed ${eventType}` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during handler execution';
      await this.webhookRepository.markFailed(eventId, errorMessage);
      throw error;
    }
  }
}
