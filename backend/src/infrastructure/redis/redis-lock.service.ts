import type { Redis } from 'ioredis';
import { randomUUID } from 'node:crypto';

export interface IDistributedLockService {
  acquireLock(key: string, ttlMs?: number, maxWaitMs?: number, retryIntervalMs?: number): Promise<string | null>;
  releaseLock(key: string, token: string): Promise<boolean>;
  withLock<T>(key: string, ttlMs?: number, fn?: () => Promise<T>, maxWaitMs?: number): Promise<T>;
}

export class RedisLockService implements IDistributedLockService {
  constructor(private readonly redis: Redis) {}

  /**
   * Attempts to acquire a distributed lock with automatic retry backoff.
   * Returns a unique lock token string on success, or null if lock could not be acquired within maxWaitMs.
   */
  public async acquireLock(
    key: string,
    ttlMs: number = 3000,
    maxWaitMs: number = 2000,
    retryIntervalMs: number = 50
  ): Promise<string | null> {
    const token = randomUUID();
    const startTime = Date.now();

    while (Date.now() - startTime <= maxWaitMs) {
      try {
        const result = await this.redis.set(key, token, 'PX', ttlMs, 'NX');
        if (result === 'OK') {
          return token;
        }
      } catch (err) {
        console.warn(`[RedisLockService] Error attempting lock on ${key}:`, err);
      }

      // If maxWaitMs is 0 or very small, don't sleep
      if (maxWaitMs <= 0) break;

      const jitter = Math.floor(Math.random() * 25);
      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs + jitter));
    }

    return null;
  }

  /**
   * Releases lock using a Lua script to ensure atomicity (only releases if the token matches).
   */
  public async releaseLock(key: string, token: string): Promise<boolean> {
    try {
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await this.redis.eval(luaScript, 1, key, token);
      return result === 1;
    } catch (err) {
      console.warn(`[RedisLockService] Error releasing lock for ${key}:`, err);
      return false;
    }
  }

  /**
   * Executes a block within an acquired lock with automatic retry and release.
   * If the lock cannot be acquired within maxWaitMs, it safely proceeds with execution to avoid dropping events.
   */
  public async withLock<T>(
    key: string,
    ttlMs: number = 3000,
    fn: () => Promise<T> = (async () => ({} as T)),
    maxWaitMs: number = 2000
  ): Promise<T> {
    let token: string | null = null;
    try {
      token = await this.acquireLock(key, ttlMs, maxWaitMs);
    } catch (err) {
      console.warn(`[RedisLockService] Lock acquisition encountered error for ${key}:`, err);
    }

    if (!token) {
      console.warn(`[RedisLockService] Lock contention timeout for key: ${key}, proceeding with fallback execution.`);
      return await fn();
    }

    try {
      return await fn();
    } finally {
      if (token) {
        await this.releaseLock(key, token);
      }
    }
  }
}
