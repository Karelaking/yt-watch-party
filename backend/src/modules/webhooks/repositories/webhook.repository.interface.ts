import type { IRepository } from '../../../core/interfaces/index.js';

export type WebhookStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
export type WebhookProvider = 'CLERK';

export interface WebhookEventEntity {
  id: string;
  provider: WebhookProvider;
  eventId: string;
  eventType: string;
  payload: unknown;
  status: WebhookStatus;
  attempts: number;
  errorMessage: string | null;
  userId: string | null;
  receivedAt: Date;
  processedAt: Date | null;
}

export interface IWebhookRepository extends IRepository<WebhookEventEntity> {
  recordEvent(eventId: string, eventType: string, payload: unknown, provider?: WebhookProvider): Promise<WebhookEventEntity>;
  isProcessed(eventId: string): Promise<boolean>;
  markProcessed(eventId: string, userId?: string | null): Promise<void>;
  markFailed(eventId: string, errorMessage: string): Promise<void>;
}
