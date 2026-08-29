import { MessageHandler, type HandlerContext } from '../message-handler.js';
import type { IRoomPubSubService } from '../../../infrastructure/redis/room-pubsub.service.js';

interface ReactionData {
  roomId: string;
  emoji: string;
  userName?: string;
}

/**
 * Handles floating emoji reactions in real time with throttling.
 */
export class ReactionHandler extends MessageHandler<ReactionData> {
  private readonly lastReactionTimes = new Map<string, number>();

  constructor(
    roomManager: ConstructorParameters<typeof MessageHandler>[0],
    participants: ConstructorParameters<typeof MessageHandler>[1],
    rbacEngine: ConstructorParameters<typeof MessageHandler>[2],
    private readonly roomPubSubService?: IRoomPubSubService,
    roomResolver?: ConstructorParameters<typeof MessageHandler>[3],
  ) {
    super(roomManager, participants, rbacEngine, roomResolver);
  }

  protected async validate(ctx: HandlerContext, data: ReactionData): Promise<string | null> {
    if (!data.emoji || data.emoji.trim().length === 0) {
      return 'Emoji cannot be empty';
    }

    const now = Date.now();
    const lastTime = this.lastReactionTimes.get(ctx.socket.id) ?? 0;
    if (now - lastTime < 100) {
      return 'Reaction rate limit exceeded';
    }
    this.lastReactionTimes.set(ctx.socket.id, now);
    return null;
  }

  protected async execute(ctx: HandlerContext, data: ReactionData): Promise<any> {
    const { io, room, participant } = ctx;

    const reactionPayload = {
      userId: participant.userId,
      userName: participant.resolveDisplayName(),
      emoji: data.emoji,
    };

    if (this.roomPubSubService) {
      this.roomPubSubService.publish(room.id, 'ROOM_REACTION', reactionPayload, participant.userId).catch(() => {});
    }
    room.broadcast(io, 'room:reaction', reactionPayload);

    return reactionPayload;
  }
}
