import type { Redis } from 'ioredis';
import { RedisKeys } from '../redis/redis-keys.js';
import { toSafeDate } from '../database/prisma.js';
import type { PlaybackActionType, PlaybackStateSnapshot } from '../../modules/playback/engine/playback-sync.engine.js';

export interface IPlaybackStateCache {
  getHotState(roomId: string): Promise<PlaybackStateSnapshot | null>;
  setHotState(roomId: string, state: PlaybackStateSnapshot, ttlSeconds?: number): Promise<void>;
  deleteHotState(roomId: string): Promise<void>;
}

export class RedisPlaybackStateCache implements IPlaybackStateCache {
  constructor(private readonly redis: Redis) {}

  public async getHotState(roomId: string): Promise<PlaybackStateSnapshot | null> {
    const key = RedisKeys.roomPlayback(roomId);
    const data = await this.redis.hgetall(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      roomId: data['roomId'] || roomId,
      mediaId: data['mediaId'] ? data['mediaId'] : null,
      position: parseFloat(data['position'] || '0'),
      isPlaying: data['isPlaying'] === 'true',
      playbackRate: parseFloat(data['playbackRate'] || '1.0'),
      version: parseInt(data['version'] || '0', 10),
      serverTimestamp: toSafeDate(data['serverTimestamp']),
      lastAction: (data['lastAction'] as PlaybackActionType) || null,
      lastActionById: data['lastActionById'] || null,
    };
  }

  public async setHotState(
    roomId: string,
    state: PlaybackStateSnapshot,
    ttlSeconds: number = 86400 // 24 hours default TTL
  ): Promise<void> {
    const key = RedisKeys.roomPlayback(roomId);
    const ts = state.serverTimestamp instanceof Date ? state.serverTimestamp.toISOString() : String(state.serverTimestamp);
    const hashData: Record<string, string> = {
      roomId: state.roomId,
      mediaId: state.mediaId ?? '',
      position: state.position.toString(),
      isPlaying: state.isPlaying.toString(),
      playbackRate: state.playbackRate.toString(),
      version: state.version.toString(),
      serverTimestamp: ts,
      lastAction: state.lastAction ?? '',
      lastActionById: state.lastActionById ?? '',
    };

    const pipeline = this.redis.pipeline();
    pipeline.hset(key, hashData);
    if (ttlSeconds > 0) {
      pipeline.expire(key, ttlSeconds);
    }
    await pipeline.exec();
  }

  public async deleteHotState(roomId: string): Promise<void> {
    const key = RedisKeys.roomPlayback(roomId);
    await this.redis.del(key);
  }
}
