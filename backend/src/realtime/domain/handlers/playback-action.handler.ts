import { MessageHandler, type HandlerContext } from '../message-handler.js';
import { Permission } from '../../../modules/rbac/permissions.js';
import type { IPlaybackService } from '../../../modules/playback/services/playback.service.js';
import type { IDistributedLockService } from '../../../infrastructure/redis/redis-lock.service.js';
import type { IRoomPubSubService } from '../../../infrastructure/redis/room-pubsub.service.js';
import { RedisKeys } from '../../../infrastructure/redis/redis-keys.js';

import type { PlaybackActionType } from '../../../modules/playback/engine/playback-sync.engine.js';

interface PlaybackActionData {
  roomId: string;
  action: string;
  position?: number;
  playbackRate?: number;
  mediaId?: string | null;
}

/**
 * Handles playback actions (PLAY, PAUSE, SEEK, RATE, CHANGE_VIDEO).
 * Role-gated: requires PLAYBACK_CONTROL permission.
 * Executes under a Redis distributed lock to prevent race conditions.
 */
export class PlaybackActionHandler extends MessageHandler<PlaybackActionData> {
  constructor(
    roomManager: ConstructorParameters<typeof MessageHandler>[0],
    participants: ConstructorParameters<typeof MessageHandler>[1],
    rbacEngine: ConstructorParameters<typeof MessageHandler>[2],
    private readonly playbackService: IPlaybackService,
    private readonly lockService: IDistributedLockService,
    private readonly roomPubSubService?: IRoomPubSubService,
    roomResolver?: ConstructorParameters<typeof MessageHandler>[3],
  ) {
    super(roomManager, participants, rbacEngine, roomResolver);
  }

  protected requiredPermission(): Permission {
    return Permission.PLAYBACK_CONTROL;
  }

  protected async execute(ctx: HandlerContext, data: PlaybackActionData): Promise<any> {
    const { io, room, participant } = ctx;
    const lockKey = RedisKeys.lockPlayback(room.id);

    const updatedState = await this.lockService.withLock(lockKey, 3000, async () => {
      return this.playbackService.dispatchAction(room.id, participant.userId, {
        action: data.action as PlaybackActionType,
        position: data.position,
        playbackRate: data.playbackRate,
        mediaId: data.mediaId ?? undefined,
      });
    });

    // Broadcast authoritative sync to all room members
    room.broadcast(io, 'playback:sync', updatedState);
    return { state: updatedState };
  }
}
