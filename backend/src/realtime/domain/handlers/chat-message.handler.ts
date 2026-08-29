import { MessageHandler, type HandlerContext } from '../message-handler.js';
import { Permission } from '../../../modules/rbac/permissions.js';
import type { IChatService } from '../../../modules/chat/services/chat.service.js';
import type { IRoomPubSubService } from '../../../infrastructure/redis/room-pubsub.service.js';

interface ChatMessageData {
  roomId: string;
  text: string;
  userNickname?: string;
  userName?: string;
}

/**
 * Handles incoming chat messages with MongoDB persistence,
 * nickname resolution, and real-time broadcasting.
 */
export class ChatMessageHandler extends MessageHandler<ChatMessageData> {
  constructor(
    roomManager: ConstructorParameters<typeof MessageHandler>[0],
    participants: ConstructorParameters<typeof MessageHandler>[1],
    rbacEngine: ConstructorParameters<typeof MessageHandler>[2],
    private readonly chatService: IChatService,
    private readonly roomPubSubService?: IRoomPubSubService,
    roomResolver?: ConstructorParameters<typeof MessageHandler>[3],
  ) {
    super(roomManager, participants, rbacEngine, roomResolver);
  }

  protected requiredPermission(): Permission {
    return Permission.CHAT_SEND;
  }

  protected async validate(_ctx: HandlerContext, data: ChatMessageData): Promise<string | null> {
    if (!data.text || data.text.trim().length === 0) {
      return 'Message content cannot be empty';
    }
    return null;
  }

  protected async execute(ctx: HandlerContext, data: ChatMessageData): Promise<any> {
    const { io, room, participant } = ctx;

    const savedMessage = await this.chatService.sendMessage(participant.userId, {
      roomId: room.id,
      message: data.text.trim(),
      type: 'TEXT',
    });

    const senderPayload = participant.toChatSenderPayload();
    const messagePayload = {
      id: savedMessage.id,
      ...senderPayload,
      text: savedMessage.message,
      sentAt: savedMessage.createdAt.toISOString(),
    };

    if (this.roomPubSubService) {
      this.roomPubSubService.publish(room.id, 'CHAT_MESSAGE' as any, messagePayload, participant.userId).catch(() => {});
    }
    room.broadcast(io, 'chat:message', messagePayload);

    return messagePayload;
  }
}
