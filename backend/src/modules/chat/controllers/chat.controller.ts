import type { Response } from 'express';
import { BaseController, type AsyncHandler } from '../../../core/interfaces/index.js';
import type { AuthenticatedRequest } from '../../auth/auth.types.js';
import type { IChatService } from '../services/chat.service.js';
import type { ListMessagesQueryDto, SendMessageDto } from '../dtos/chat.dto.js';

export class ChatController extends BaseController {
  constructor(private readonly chatService: IChatService) {
    super();
  }

  public getMessages: AsyncHandler = this.catchAsync(async (req, res: Response) => {
    const roomId = req.params['roomId'] as string;
    const query = req.query as unknown as ListMessagesQueryDto;

    const result = await this.chatService.getRoomMessages(roomId, query);
    return this.ok(res, result);
  });

  public sendMessage: AsyncHandler = this.catchAsync(async (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const roomId = req.params['roomId'] as string;
    const dto: SendMessageDto = {
      ...req.body,
      roomId,
    };

    const message = await this.chatService.sendMessage(authReq.user.id, dto);
    return this.created(res, message, 'Message sent successfully');
  });

  public editMessage: AsyncHandler = this.catchAsync(async (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const messageId = req.params['messageId'] as string;
    const { message } = req.body;

    const updated = await this.chatService.editMessage(messageId, authReq.user.id, message);
    return this.ok(res, updated, 'Message edited successfully');
  });

  public deleteMessage: AsyncHandler = this.catchAsync(async (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const messageId = req.params['messageId'] as string;

    await this.chatService.deleteMessage(messageId, authReq.user.id);
    return this.noContent(res);
  });
}
