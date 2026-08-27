import type {
  IPlaybackRepository,
  PlaybackStateEntity,
  PlaybackHistoryEntity,
} from '../repositories/playback.repository.interface.js';
import type { IPlaybackSyncEngine, ClientSyncPayload, PlaybackStateSnapshot } from '../engine/playback-sync.engine.js';
import type { IMediaRepository } from '../../media/repositories/media.repository.interface.js';
import type { IEventDispatcher } from '../../../core/events/index.js';
import type { IPlaybackStateCache } from '../../../infrastructure/cache/playback-state.cache.js';
import type { IRoomPubSubService } from '../../../infrastructure/redis/room-pubsub.service.js';
import { toSafeDate } from '../../../infrastructure/database/prisma.js';
import { PlaybackActionEvent } from '../../../core/events/index.js';
import { NotFoundError } from '../../../core/errors/index.js';
import type { IService } from '../../../core/interfaces/index.js';

export interface IPlaybackService extends IService {
  getState(roomId: string): Promise<PlaybackStateEntity>;
  getCurrentCalculatedPosition(roomId: string): Promise<{ position: number; isPlaying: boolean; playbackRate: number; version: number }>;
  dispatchAction(roomId: string, actorId: string, payload: ClientSyncPayload): Promise<PlaybackStateEntity>;
  getHistory(roomId: string, limit?: number): Promise<PlaybackHistoryEntity[]>;
}

export class PlaybackService implements IPlaybackService {
  constructor(
    private readonly playbackRepository: IPlaybackRepository,
    private readonly syncEngine: IPlaybackSyncEngine,
    private readonly mediaRepository: IMediaRepository,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly playbackStateCache?: IPlaybackStateCache,
    private readonly roomPubSubService?: IRoomPubSubService
  ) {}

  public async getState(roomId: string): Promise<PlaybackStateEntity> {
    // Check Redis Hot State Cache
    if (this.playbackStateCache) {
      try {
        const cached = await this.playbackStateCache.getHotState(roomId);
        if (cached) {
          const media = cached.mediaId ? await this.mediaRepository.findById(cached.mediaId).catch(() => null) : null;
          return {
            id: `pb-${roomId}`,
            ...cached,
            updatedAt: toSafeDate(cached.serverTimestamp),
            media: media ?? null,
          };
        }
      } catch (err) {
        console.warn('[PlaybackService] Redis cache lookup failed, falling back to DB:', err);
      }
    }

    let state = await this.playbackRepository.getStateByRoomId(roomId);
    if (!state) {
      // Initialize if missing
      state = await this.playbackRepository.saveState({
        roomId,
        mediaId: null,
        position: 0,
        isPlaying: false,
        playbackRate: 1.0,
        version: 0,
        serverTimestamp: new Date(),
      });
    }

    // Populate Redis Hot State
    if (this.playbackStateCache && state) {
      try {
        await this.playbackStateCache.setHotState(roomId, state);
      } catch (err) {
        console.warn('[PlaybackService] Failed to populate Redis playback state:', err);
      }
    }

    return state;
  }

  public async getCurrentCalculatedPosition(
    roomId: string
  ): Promise<{ position: number; isPlaying: boolean; playbackRate: number; version: number }> {
    const state = await this.getState(roomId);
    const calculatedPos = this.syncEngine.calculateCurrentPosition(state);
    return {
      position: calculatedPos,
      isPlaying: state.isPlaying,
      playbackRate: state.playbackRate,
      version: state.version,
    };
  }

  public async dispatchAction(
    roomId: string,
    actorId: string,
    payload: ClientSyncPayload
  ): Promise<PlaybackStateEntity> {
    const currentState = await this.getState(roomId);

    // If change video, verify media exists
    if (payload.action === 'CHANGE_VIDEO' && payload.mediaId) {
      const media = await this.mediaRepository.findById(payload.mediaId);
      if (!media) throw new NotFoundError('Queued media does not exist');
    }

    const nextStateSnapshot: PlaybackStateSnapshot = this.syncEngine.applyAction(
      currentState,
      actorId,
      payload
    );

    // Immediately cache hot state in Redis for sub-millisecond real-time reads across instances
    if (this.playbackStateCache) {
      try {
        await this.playbackStateCache.setHotState(roomId, nextStateSnapshot);
      } catch (err) {
        console.warn('[PlaybackService] Redis setHotState failed:', err);
      }
    }

    const savedState = await this.playbackRepository.saveState(nextStateSnapshot);

    // Record to audit history asynchronously
    setImmediate(async () => {
      try {
        await this.playbackRepository.recordHistory({
          roomId,
          actorId,
          action: payload.action,
          mediaId: nextStateSnapshot.mediaId,
          position: nextStateSnapshot.position,
          playbackRate: nextStateSnapshot.playbackRate,
          version: nextStateSnapshot.version,
        });
      } catch (err) {
        console.error('[PlaybackService] Failed to record playback history:', err);
      }
    });

    this.eventDispatcher.publish(new PlaybackActionEvent({
      roomId,
      actorId,
      action: payload.action,
      mediaId: nextStateSnapshot.mediaId,
      position: nextStateSnapshot.position,
      playbackRate: nextStateSnapshot.playbackRate,
      version: nextStateSnapshot.version,
    }));

    // Publish to Room Pub-Sub Bus for room-level video synchronization across all users
    if (this.roomPubSubService) {
      this.roomPubSubService.publish(roomId, 'PLAYBACK_SYNC', savedState, actorId).catch((err) => {
        console.warn('[PlaybackService] Failed to publish PLAYBACK_SYNC to Pub-Sub:', err);
      });
      this.roomPubSubService.publish(roomId, 'PLAYBACK_ACTION', {
        actorId,
        action: payload.action,
        mediaId: nextStateSnapshot.mediaId,
        position: nextStateSnapshot.position,
        playbackRate: nextStateSnapshot.playbackRate,
        version: nextStateSnapshot.version,
      }, actorId).catch((err) => {
        console.warn('[PlaybackService] Failed to publish PLAYBACK_ACTION to Pub-Sub:', err);
      });
    }

    return savedState;
  }

  public async getHistory(roomId: string, limit?: number): Promise<PlaybackHistoryEntity[]> {
    return this.playbackRepository.getHistory(roomId, limit);
  }
}
