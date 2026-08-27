import type { Redis } from 'ioredis';

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  hget<T>(key: string, field: string): Promise<T | null>;
  hset(key: string, field: string, value: unknown): Promise<void>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, ...fields: string[]): Promise<void>;
  expire(key: string, seconds: number): Promise<void>;
}

export class RedisCacheService implements ICacheService {
  constructor(private readonly redis: Redis) {}

  public async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  public async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redis.set(key, stringValue, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, stringValue);
    }
  }

  public async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  public async hget<T>(key: string, field: string): Promise<T | null> {
    const data = await this.redis.hget(key, field);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  public async hset(key: string, field: string, value: unknown): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redis.hset(key, field, stringValue);
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    return this.redis.hgetall(key);
  }

  public async hdel(key: string, ...fields: string[]): Promise<void> {
    if (fields.length > 0) {
      await this.redis.hdel(key, ...fields);
    }
  }

  public async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }
}
