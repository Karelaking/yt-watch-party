import type { Redis } from 'ioredis';
import { RedisKeys } from './redis-keys.js';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export interface IRateLimiterService {
  checkUserMessageRate(userId: string, limit?: number, windowMs?: number): Promise<RateLimitResult>;
  checkUserRequestRate(userId: string, limit?: number, windowMs?: number): Promise<RateLimitResult>;
  checkIpRequestRate(ip: string, limit?: number, windowMs?: number): Promise<RateLimitResult>;
}

export class RedisRateLimiterService implements IRateLimiterService {
  constructor(private readonly redis: Redis) {}

  /**
   * Generic sliding window rate limiter using Redis sorted sets (ZSET).
   */
  private async isRateLimited(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;

    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, now, `${now}:${Math.random().toString(36).substring(2, 8)}`);
    pipeline.zcard(key);
    pipeline.pexpire(key, windowMs);

    const results = await pipeline.exec();
    if (!results) {
      return { allowed: true, remaining: limit, resetMs: windowMs };
    }

    const count = (results[2]?.[1] as number) || 0;
    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);

    return {
      allowed,
      remaining,
      resetMs: windowMs,
    };
  }

  public async checkUserMessageRate(userId: string, limit = 10, windowMs = 5000): Promise<RateLimitResult> {
    const key = RedisKeys.rateUserMessages(userId);
    return this.isRateLimited(key, limit, windowMs);
  }

  public async checkUserRequestRate(userId: string, limit = 60, windowMs = 60000): Promise<RateLimitResult> {
    const key = RedisKeys.rateUserRequests(userId);
    return this.isRateLimited(key, limit, windowMs);
  }

  public async checkIpRequestRate(ip: string, limit = 120, windowMs = 60000): Promise<RateLimitResult> {
    const key = RedisKeys.rateIpRequests(ip);
    return this.isRateLimited(key, limit, windowMs);
  }
}
