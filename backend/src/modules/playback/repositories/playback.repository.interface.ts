import type { IRepository } from '../../../core/interfaces/index.js';
import type { PlaybackActionType, PlaybackStateSnapshot } from '../engine/playback-sync.engine.js';
import type { MediaEntity } from '../../media/repositories/media.repository.interface.js';

export interface PlaybackStateEntity extends PlaybackStateSnapshot {
  id: string;
  updatedAt: Date;
  media?: MediaEntity | null;
}

export interface PlaybackHistoryEntity {
  id: string;
  roomId: string;
  actorId: string;
  action: PlaybackActionType;
  mediaId: string | null;
  position: number | null;
  playbackRate: number | null;
  version: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface IPlaybackRepository extends IRepository<PlaybackStateEntity> {
  getStateByRoomId(roomId: string): Promise<PlaybackStateEntity | null>;
  saveState(state: PlaybackStateSnapshot): Promise<PlaybackStateEntity>;
  recordHistory(data: {
    roomId: string;
    actorId: string;
    action: PlaybackActionType;
    mediaId?: string | null;
    position?: number | null;
    playbackRate?: number | null;
    version?: number | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void>;
  getHistory(roomId: string, limit?: number): Promise<PlaybackHistoryEntity[]>;
}
