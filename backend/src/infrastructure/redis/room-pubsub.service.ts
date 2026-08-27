import { EventEmitter } from 'node:events';
import type { Redis } from 'ioredis';
import { RedisKeys } from './redis-keys.js';
import type { IService } from '../../core/interfaces/index.js';
import { createRedisClient } from '../database/redis.js';

export type RoomPubSubMessageType =
  | 'PLAYBACK_SYNC'
  | 'PLAYBACK_ACTION'
  | 'PLAYLIST_SYNC'
  | 'ROOM_REACTION'
  | 'ROOM_SETTINGS_UPDATED'
  | 'ROOM_MEMBER_JOINED'
  | 'ROOM_MEMBER_LEFT'
  | 'ROOM_ROLE_CHANGED';

export interface RoomPubSubMessage<T = unknown> {
  roomId: string;
  type: RoomPubSubMessageType;
  payload: T;
  publisherId?: string;
  timestamp: string;
}

export type RoomPubSubHandler<T = unknown> = (message: RoomPubSubMessage<T>) => void | Promise<void>;

export interface IRoomPubSubService extends IService {
  publish<T>(roomId: string, type: RoomPubSubMessageType, payload: T, publisherId?: string): Promise<void>;
  subscribe(handler: RoomPubSubHandler): Promise<() => void>;
  subscribeRoom(roomId: string, handler: RoomPubSubHandler): Promise<() => void>;
}

export class RoomPubSubService implements IRoomPubSubService {
  private readonly localBus = new EventEmitter();
  private subClient: Redis | null = null;
  private isSubscribed = false;

  constructor(private readonly pubClient: Redis) {
    this.localBus.setMaxListeners(100);
    this.initRedisSubscriber();
  }

  private async initRedisSubscriber(): Promise<void> {
    try {
      this.subClient = createRedisClient();
      if (this.subClient.status === 'wait') {
        await this.subClient.connect();
      }

      await this.subClient.psubscribe(RedisKeys.pubsubPattern());
      this.isSubscribed = true;

      this.subClient.on('pmessage', (_pattern, channel, rawMessage) => {
        try {
          const parsed: RoomPubSubMessage = JSON.parse(rawMessage);
          this.dispatchLocal(parsed);
        } catch (err) {
          console.warn('[RoomPubSubService] Failed to parse Pub-Sub message on channel', channel, err);
        }
      });
      console.log('📡 RoomPubSubService initialized with Redis Pub-Sub channel pattern: watchparty:pubsub:room:*');
    } catch (err) {
      console.warn('[RoomPubSubService] Falling back to in-memory local Pub-Sub bus:', err instanceof Error ? err.message : err);
    }
  }

  private dispatchLocal(message: RoomPubSubMessage): void {
    this.localBus.emit('*', message);
    this.localBus.emit(`room:${message.roomId}`, message);
    this.localBus.emit(`event:${message.type}`, message);
  }

  public async publish<T>(
    roomId: string,
    type: RoomPubSubMessageType,
    payload: T,
    publisherId?: string
  ): Promise<void> {
    const message: RoomPubSubMessage<T> = {
      roomId,
      type,
      payload,
      publisherId,
      timestamp: new Date().toISOString(),
    };

    const channel = RedisKeys.pubsubRoom(roomId);
    const serialized = JSON.stringify(message);

    // 1. Publish to Redis Pub-Sub for multi-instance distribution
    try {
      if (this.pubClient.status === 'ready' || this.pubClient.status === 'connecting') {
        await this.pubClient.publish(channel, serialized);
      }
    } catch (err) {
      console.warn('[RoomPubSubService] Redis publish warning:', err instanceof Error ? err.message : err);
    }

    // 2. If Redis subscriber is not active, dispatch locally as fallback
    if (!this.isSubscribed) {
      this.dispatchLocal(message as RoomPubSubMessage);
    }
  }

  public async subscribe(handler: RoomPubSubHandler): Promise<() => void> {
    const listener = (msg: RoomPubSubMessage) => {
      try {
        handler(msg);
      } catch (err) {
        console.error('[RoomPubSubService] Error in subscriber handler:', err);
      }
    };

    this.localBus.on('*', listener);

    return () => {
      this.localBus.off('*', listener);
    };
  }

  public async subscribeRoom(roomId: string, handler: RoomPubSubHandler): Promise<() => void> {
    const channelKey = `room:${roomId}`;
    const listener = (msg: RoomPubSubMessage) => {
      try {
        handler(msg);
      } catch (err) {
        console.error(`[RoomPubSubService] Error in room ${roomId} subscriber:`, err);
      }
    };

    this.localBus.on(channelKey, listener);

    return () => {
      this.localBus.off(channelKey, listener);
    };
  }
}
