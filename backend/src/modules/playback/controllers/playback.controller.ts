import type { Request, Response } from 'express';
import { BaseController } from '../../../core/interfaces/index.js';
import type { IPlaybackService } from '../services/playback.service.js';
import type { ClientSyncPayload } from '../engine/playback-sync.engine.js';
import { UnauthorizedError } from '../../../core/errors/index.js';

export class PlaybackController extends BaseController {
  constructor(private readonly playbackService: IPlaybackService) {
    super();
  }

  public getState = this.catchAsync(async (req: Request, res: Response) => {
    const roomId = req.params['roomId'] as string;
    const state = await this.playbackService.getState(roomId);
    return this.ok(res, state);
  });

  public getCalculatedPosition = this.catchAsync(async (req: Request, res: Response) => {
    const roomId = req.params['roomId'] as string;
    const pos = await this.playbackService.getCurrentCalculatedPosition(roomId);
    return this.ok(res, pos);
  });

  public dispatchAction = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const roomId = req.params['roomId'] as string;
    const payload = req.body as ClientSyncPayload;
    const updatedState = await this.playbackService.dispatchAction(roomId, req.user.id, payload);
    return this.ok(res, updatedState, `Playback ${payload.action} executed`);
  });

  public getHistory = this.catchAsync(async (req: Request, res: Response) => {
    const roomId = req.params['roomId'] as string;
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 50;
    const history = await this.playbackService.getHistory(roomId, limit);
    return this.ok(res, history);
  });
}
