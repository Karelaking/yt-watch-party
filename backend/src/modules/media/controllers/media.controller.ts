import type { Request, Response } from 'express';
import { BaseController } from '../../../core/interfaces/index.js';
import type { IMediaService } from '../services/media.service.js';

export class MediaController extends BaseController {
  constructor(private readonly mediaService: IMediaService) {
    super();
  }

  public addMedia = this.catchAsync(async (req: Request, res: Response) => {
    const roomId = req.params['roomId'] as string;
    const { url, title } = req.body as { url: string; title?: string };
    const media = await this.mediaService.resolveAndSaveMedia(roomId, url, title);
    return this.created(res, media, 'Media added successfully');
  });

  public listMedia = this.catchAsync(async (req: Request, res: Response) => {
    const roomId = req.params['roomId'] as string;
    const items = await this.mediaService.listRoomMedia(roomId);
    return this.ok(res, items);
  });
}
