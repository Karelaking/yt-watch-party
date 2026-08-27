import { Redis } from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';
import { env } from '../../config/env.config.js';

export function createRedisClient(customUrl?: string): Redis {
  const url = customUrl || env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL environment variable is missing.');
  }

  const isTls = url.startsWith('rediss://');

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    ...(isTls
      ? {
          tls: {
            rejectUnauthorized: false,
          },
        }
      : {}),
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

  client.on('error', (err) => {
    console.error('[Redis Client Error]:', err);
  });

  return client;
}

let redisSingleton: Redis | null = null;

export function getRedis(): Redis {
  if (!redisSingleton) {
    redisSingleton = createRedisClient();
  }
  return redisSingleton;
}

let upstashSingleton: UpstashRedis | null = null;

export function getUpstashRedis(): UpstashRedis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!upstashSingleton) {
    upstashSingleton = new UpstashRedis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return upstashSingleton;
}

export async function disconnectRedis(): Promise<void> {
  if (redisSingleton) {
    await redisSingleton.quit();
    redisSingleton = null;
    console.log('🔴 Redis disconnected');
  }
}
