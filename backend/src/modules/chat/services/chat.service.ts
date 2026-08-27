import type { IService } from '../../../core/interfaces/index.js';
import type { IMessageRepository, MessageEntity } from '../repositories/message.repository.interface.js';
import type { IRoomRepository, IRoomSettingsRepository } from '../../rooms/repositories/room.repository.interface.js';
import type { IRateLimiterService } from '../../../infrastructure/redis/rate-limiter.service.js';
import { ForbiddenError, NotFoundError } from '../../../core/errors/index.js';
import type { SendMessageDto, ListMessagesQueryDto } from '../dtos/chat.dto.js';

export interface IChatService extends IService {
  sendMessage(userId: string, dto: SendMessageDto): Promise<MessageEntity>;
  sendSystemMessage(roomId: string, message: string, metadata?: Record<string, unknown>): Promise<MessageEntity>;
  getRoomMessages(roomId: string, query: ListMessagesQueryDto): Promise<{ messages: MessageEntity[]; nextCursor: string | null }>;
  editMessage(messageId: string, userId: string, newMessage: string): Promise<MessageEntity>;
  deleteMessage(messageId: string, userId: string): Promise<boolean>;
}

export class ChatService implements IChatService {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly settingsRepository: IRoomSettingsRepository,
    private readonly rateLimiter: IRateLimiterService
  ) {}

  public async sendMessage(userId: string, dto: SendMessageDto): Promise<MessageEntity> {
    const room = await this.roomRepository.findById(dto.roomId);
    if (!room || room.status !== 'ACTIVE') {
      throw new NotFoundError('Room not found or is inactive');
    }

    const settings = await this.settingsRepository.findByRoomId(dto.roomId);
    if (settings && !settings.allowChat) {
      throw new ForbiddenError('Chat is disabled for this room');
    }

    // Check slow mode / rate limiting
    const slowMode = settings?.slowModeSeconds ?? 0;
    const windowMs = slowMode > 0 ? slowMode * 1000 : 3000;
    const limit = slowMode > 0 ? 1 : 10;

    const rateResult = await this.rateLimiter.checkUserMessageRate(userId, limit, windowMs);
    if (!rateResult.allowed) {
      throw new ForbiddenError(`Slow mode active. Please wait ${Math.ceil(rateResult.resetMs / 1000)}s before sending another message.`);
    }

    return this.messageRepository.create({
      roomId: dto.roomId,
      senderId: userId,
      message: dto.message,
      type: dto.type,
      replyToMessageId: dto.replyToMessageId,
      mentions: dto.mentions,
      metadata: dto.metadata,
    });
  }

  public async sendSystemMessage(
    roomId: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<MessageEntity> {
    return this.messageRepository.create({
      roomId,
      senderId: 'SYSTEM',
      message,
      type: 'SYSTEM',
      metadata,
    });
  }

  public async getRoomMessages(
    roomId: string,
    query: ListMessagesQueryDto
  ): Promise<{ messages: MessageEntity[]; nextCursor: string | null }> {
    return this.messageRepository.listByRoom(roomId, {
      limit: query.limit,
      beforeCursor: query.cursor,
    });
  }

  public async editMessage(messageId: string, userId: string, newMessage: string): Promise<MessageEntity> {
    const updated = await this.messageRepository.edit(messageId, userId, newMessage);
    if (!updated) {
      throw new NotFoundError('Message not found or you are not authorized to edit it');
    }
    return updated;
  }

  public async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const deleted = await this.messageRepository.softDelete(messageId, userId);
    if (!deleted) {
      throw new NotFoundError('Message not found or you are not authorized to delete it');
    }
    return deleted;
  }
}
