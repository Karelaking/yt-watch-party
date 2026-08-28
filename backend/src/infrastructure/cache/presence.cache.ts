import type { Redis } from 'ioredis';
import { RedisKeys, RedisTTL } from '../redis/redis-keys.js';

export interface UserPresenceData {
  userId: string;
  status: 'ONLINE' | 'AWAY' | 'OFFLINE';
  currentRoomId?: string | null;
  lastActiveAt: string;
}

export interface IPresenceCache {
  addSocketToRoom(socketId: string, userId: string, roomId: string): Promise<void>;
  removeSocket(socketId: string): Promise<{ userId: string | null; roomId: string | null }>;
  getRoomPresence(roomId: string): Promise<string[]>;
  getRoomConnections(roomId: string): Promise<string[]>;
  getViewerCount(roomId: string): Promise<number>;
  setUserTyping(roomId: string, userId: string, ttlSeconds?: number): Promise<void>;
  removeUserTyping(roomId: string, userId: string): Promise<void>;
  getTypingUsers(roomId: string): Promise<string[]>;
  setUserPresence(userId: string, data: UserPresenceData): Promise<void>;
  getUserPresence(userId: string): Promise<UserPresenceData | null>;
}

export class RedisPresenceCache implements IPresenceCache {
  constructor(private readonly redis: Redis) {}

  public async addSocketToRoom(socketId: string, userId: string, roomId: string): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Map socketId -> userId & socketId -> roomId with TTL
    pipeline.set(RedisKeys.socketUser(socketId), userId, 'EX', RedisTTL.SOCKET_USER);
    pipeline.set(RedisKeys.socketRoom(socketId), roomId, 'EX', RedisTTL.SOCKET_ROOM);

    // Add socketId to room connections set with TTL
    const connKey = RedisKeys.roomConnections(roomId);
    pipeline.sadd(connKey, socketId);
    pipeline.expire(connKey, RedisTTL.ROOM_CONNECTIONS);

    // Add userId to room presence set with TTL
    const presKey = RedisKeys.roomPresence(roomId);
    pipeline.sadd(presKey, userId);
    pipeline.expire(presKey, RedisTTL.ROOM_PRESENCE);

    // Increment viewers counter with TTL
    const viewersKey = RedisKeys.roomViewers(roomId);
    pipeline.zadd(viewersKey, Date.now(), userId);
    pipeline.expire(viewersKey, RedisTTL.ROOM_VIEWERS);

    // Update global user presence with TTL
    const userPresence: UserPresenceData = {
      userId,
      status: 'ONLINE',
      currentRoomId: roomId,
      lastActiveAt: new Date().toISOString(),
    };
    pipeline.set(RedisKeys.userPresence(userId), JSON.stringify(userPresence), 'EX', RedisTTL.USER_PRESENCE_ONLINE);

    await pipeline.exec();
  }

  public async removeSocket(socketId: string): Promise<{ userId: string | null; roomId: string | null }> {
    const [userId, roomId] = await Promise.all([
      this.redis.get(RedisKeys.socketUser(socketId)),
      this.redis.get(RedisKeys.socketRoom(socketId)),
    ]);

    const pipeline = this.redis.pipeline();
    pipeline.del(RedisKeys.socketUser(socketId));
    pipeline.del(RedisKeys.socketRoom(socketId));

    if (roomId) {
      pipeline.srem(RedisKeys.roomConnections(roomId), socketId);
      if (userId) {
        pipeline.srem(RedisKeys.roomPresence(roomId), userId);
        pipeline.zrem(RedisKeys.roomViewers(roomId), userId);
        pipeline.srem(RedisKeys.roomTyping(roomId), userId);
      }
    }

    if (userId) {
      const userPresence: UserPresenceData = {
        userId,
        status: 'OFFLINE',
        currentRoomId: null,
        lastActiveAt: new Date().toISOString(),
      };
      pipeline.set(RedisKeys.userPresence(userId), JSON.stringify(userPresence), 'EX', RedisTTL.USER_PRESENCE_OFFLINE);
    }

    await pipeline.exec();

    return { userId, roomId };
  }

  public async getRoomPresence(roomId: string): Promise<string[]> {
    return this.redis.smembers(RedisKeys.roomPresence(roomId));
  }

  public async getRoomConnections(roomId: string): Promise<string[]> {
    return this.redis.smembers(RedisKeys.roomConnections(roomId));
  }

  public async getViewerCount(roomId: string): Promise<number> {
    return this.redis.zcard(RedisKeys.roomViewers(roomId));
  }

  public async setUserTyping(roomId: string, userId: string, ttlSeconds: number = RedisTTL.TYPING_INDICATOR): Promise<void> {
    const key = RedisKeys.roomTyping(roomId);
    await this.redis.sadd(key, userId);
    await this.redis.expire(key, ttlSeconds);
  }

  public async removeUserTyping(roomId: string, userId: string): Promise<void> {
    await this.redis.srem(RedisKeys.roomTyping(roomId), userId);
  }

  public async getTypingUsers(roomId: string): Promise<string[]> {
    return this.redis.smembers(RedisKeys.roomTyping(roomId));
  }

  public async setUserPresence(userId: string, data: UserPresenceData): Promise<void> {
    await this.redis.set(RedisKeys.userPresence(userId), JSON.stringify(data), 'EX', RedisTTL.USER_PRESENCE_ONLINE);
  }

  public async getUserPresence(userId: string): Promise<UserPresenceData | null> {
    const data = await this.redis.get(RedisKeys.userPresence(userId));
    if (!data) return null;
    try {
      return JSON.parse(data) as UserPresenceData;
    } catch {
      return null;
    }
  }
}
