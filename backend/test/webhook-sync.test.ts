import { describe, it, expect, vi } from 'vitest';
import { WebhookSyncService } from '../src/modules/webhooks/services/webhook-sync.service.js';
import type { IWebhookRepository } from '../src/modules/webhooks/repositories/webhook.repository.interface.js';
import type { IWebhookHandler, ClerkWebhookPayload } from '../src/modules/webhooks/handlers/webhook-handlers.js';

describe('WebhookSyncService', () => {
  const createMockRepo = (): IWebhookRepository => {
    const processedEvents = new Set<string>();
    return {
      isProcessed: vi.fn(async (eventId: string) => processedEvents.has(eventId)),
      recordEvent: vi.fn(async (eventId: string) => ({
        id: 'uuid-1',
        provider: 'CLERK' as const,
        eventId,
        eventType: 'user.created',
        payload: {},
        status: 'PENDING' as const,
        attempts: 0,
        errorMessage: null,
        userId: null,
        receivedAt: new Date(),
        processedAt: null,
      })),
      markProcessed: vi.fn(async (eventId: string) => {
        processedEvents.add(eventId);
      }),
      markFailed: vi.fn(async () => {}),
    };
  };

  it('should process user.created event and mark event processed', async () => {
    const mockRepo = createMockRepo();
    const handleMock = vi.fn(async () => 'user-123');

    const mockHandler: IWebhookHandler = {
      canHandle: (type) => type === 'user.created',
      handle: handleMock,
    };

    const service = new WebhookSyncService(mockRepo, [mockHandler]);

    const payload: ClerkWebhookPayload = {
      type: 'user.created',
      object: 'event',
      data: {
        id: 'clerk_user_1',
        first_name: 'John',
        last_name: 'Doe',
      },
    };

    const result = await service.verifyAndProcessWebhook(JSON.stringify(payload), {
      svixId: 'evt_test_1',
      svixTimestamp: '12345',
      svixSignature: 'sig_123',
    });

    expect(result.success).toBe(true);
    expect(handleMock).toHaveBeenCalledOnce();
    expect(mockRepo.markProcessed).toHaveBeenCalledWith('evt_test_1', 'user-123');
  });

  it('should skip duplicate events idempotently', async () => {
    const mockRepo = createMockRepo();
    const handleMock = vi.fn(async () => 'user-123');

    const mockHandler: IWebhookHandler = {
      canHandle: (type) => type === 'user.created',
      handle: handleMock,
    };

    const service = new WebhookSyncService(mockRepo, [mockHandler]);

    const payload = JSON.stringify({
      type: 'user.created',
      object: 'event',
      data: { id: 'clerk_user_1' },
    });

    // First call
    await service.verifyAndProcessWebhook(payload, {
      svixId: 'evt_duplicate_1',
      svixTimestamp: '12345',
      svixSignature: 'sig_123',
    });

    // Second call with same event ID
    const duplicateResult = await service.verifyAndProcessWebhook(payload, {
      svixId: 'evt_duplicate_1',
      svixTimestamp: '12345',
      svixSignature: 'sig_123',
    });

    expect(duplicateResult.message).toContain('idempotent skip');
    expect(handleMock).toHaveBeenCalledOnce(); // Only once, second skipped!
  });
});
