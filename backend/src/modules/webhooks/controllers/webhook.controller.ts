import type { Request, Response } from 'express';
import { BaseController } from '../../../core/interfaces/index.js';
import type { IWebhookSyncService } from '../services/webhook-sync.service.js';

export class WebhookController extends BaseController {
  constructor(private readonly webhookSyncService: IWebhookSyncService) {
    super();
  }

  public handleClerkWebhook = this.catchAsync(async (req: Request, res: Response) => {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const headers = {
      svixId: req.headers['svix-id'] as string | undefined,
      svixTimestamp: req.headers['svix-timestamp'] as string | undefined,
      svixSignature: req.headers['svix-signature'] as string | undefined,
    };

    const result = await this.webhookSyncService.verifyAndProcessWebhook(rawBody, headers);
    return this.ok(res, result);
  });
}
