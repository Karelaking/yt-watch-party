import { MessageHandler, type HandlerContext } from '../message-handler.js';
import type { IMembershipRepository } from '../../../modules/memberships/repositories/membership.repository.interface.js';
import type { IRoomPubSubService } from '../../../infrastructure/redis/room-pubsub.service.js';

interface NicknameUpdateData {
  roomId: string;
  nickname: string;
}

/**
 * Handles participant nickname updates with database persistence,
 * in-memory domain synchronization, and real-time broadcasting.
 */
export class NicknameUpdateHandler extends MessageHandler<NicknameUpdateData> {
  constructor(
    roomManager: ConstructorParameters<typeof MessageHandler>[0],
    participants: ConstructorParameters<typeof MessageHandler>[1],
    rbacEngine: ConstructorParameters<typeof MessageHandler>[2],
    private readonly membershipRepository: IMembershipRepository,
    private readonly roomPubSubService?: IRoomPubSubService,
    roomResolver?: ConstructorParameters<typeof MessageHandler>[3],
  ) {
    super(roomManager, participants, rbacEngine, roomResolver);
  }

  protected async validate(_ctx: HandlerContext, data: NicknameUpdateData): Promise<string | null> {
    if (!data.nickname || typeof data.nickname !== 'string' || data.nickname.trim().length === 0) {
      return 'Nickname must be a non-empty string';
    }
    return null;
  }

  protected async execute(ctx: HandlerContext, data: NicknameUpdateData): Promise<any> {
    const { io, room, participant } = ctx;
    const cleanNick = data.nickname.trim();

    // Persist to relational DB
    let membership = await this.membershipRepository.findByRoomAndUser(room.id, participant.userId);
    if (!membership && participant.clerkUserId) {
      membership = await this.membershipRepository.findByRoomAndUser(room.id, participant.clerkUserId);
    }

    if (membership) {
      await this.membershipRepository.updateNickname(membership.id, cleanNick);
    }

    // Update in-memory domain participant
    participant.setNickname(cleanNick);

    const updatePayload = {
      userId: participant.userId,
      nickname: cleanNick,
      displayName: cleanNick,
    };

    if (this.roomPubSubService) {
      await this.roomPubSubService.publish(room.id, 'ROOM_MEMBER_UPDATED', updatePayload, participant.userId);
    } else {
      room.broadcast(io, 'room:member_updated', updatePayload);
    }

    return updatePayload;
  }
}
