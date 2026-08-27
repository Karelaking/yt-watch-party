import { prisma as defaultPrisma, type PrismaClient } from '../../../infrastructure/database/prisma.js';
import type { IWebhookRepository, WebhookEventEntity, WebhookProvider } from './webhook.repository.interface.js';

export class PrismaWebhookRepository implements IWebhookRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async recordEvent(
    eventId: string,
    eventType: string,
    payload: unknown,
    provider: WebhookProvider = 'CLERK'
  ): Promise<WebhookEventEntity> {
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { eventId },
    });
    if (existing) {
      return existing as unknown as WebhookEventEntity;
    }

    const created = await this.prisma.webhookEvent.create({
      data: {
        eventId,
        eventType,
        provider,
        payload: payload ?? null,
        status: 'PENDING',
        attempts: 0,
      },
    });
    return created as unknown as WebhookEventEntity;
  }

  public async isProcessed(eventId: string): Promise<boolean> {
    const event = await this.prisma.webhookEvent.findUnique({
      where: { eventId },
    });
    return event?.status === 'PROCESSED';
  }

  public async markProcessed(eventId: string, userId?: string | null): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { eventId },
      data: {
        status: 'PROCESSED',
        userId: userId ?? null,
        processedAt: new Date(),
      },
    });
  }

  public async markFailed(eventId: string, errorMessage: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { eventId },
      data: {
        status: 'FAILED',
        errorMessage,
        attempts: { increment: 1 },
      },
    });
  }
}
