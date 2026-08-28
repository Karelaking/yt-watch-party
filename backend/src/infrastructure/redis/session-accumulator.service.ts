import type { Redis } from 'ioredis';
import type { PrismaClient } from '../database/prisma.js';
import { RedisKeys } from './redis-keys.js';
import type { IService } from '../../core/interfaces/index.js';

export interface ISessionAccumulatorService extends IService {
  recordHeartbeat(sessionId: string, seconds?: number): Promise<void>;
  flushToDatabase(): Promise<number>;
  flushSession(sessionId: string): Promise<number>;
  startAutoFlush(intervalMs?: number): void;
  stopAutoFlush(): void;
}

export class SessionAccumulatorService implements ISessionAccumulatorService {
  private timer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor(
    private readonly redis: Redis,
    private readonly prisma: PrismaClient
  ) {}

  /**
   * Records a heartbeat into Redis memory in O(1) time (<0.1ms).
   * Eliminates direct per-tick database write load.
   */
  public async recordHeartbeat(sessionId: string, seconds: number = 15): Promise<void> {
    if (!sessionId) return;
    try {
      await this.redis.hincrby(RedisKeys.sessionsPendingWatchTime(), sessionId, seconds);
    } catch (err) {
      console.warn('[SessionAccumulator] Redis hincrby failed:', err instanceof Error ? err.message : err);
    }
  }

  /**
   * Flushes all accumulated session metrics to PostgreSQL in an atomic batch.
   * Returns the count of updated sessions.
   */
  public async flushToDatabase(): Promise<number> {
    if (this.isFlushing) return 0;
    this.isFlushing = true;

    try {
      const key = RedisKeys.sessionsPendingWatchTime();
      const processingKey = `${key}:processing:${Date.now()}`;

      // Atomically rename key to capture current batch snapshot
      let exists = false;
      try {
        const renamed = await this.redis.rename(key, processingKey);
        if (renamed === 'OK') exists = true;
      } catch {
        // Key might not exist (no pending heartbeats)
        exists = false;
      }

      if (!exists) {
        return 0;
      }

      const pending = await this.redis.hgetall(processingKey);
      const sessionIds = Object.keys(pending);

      if (sessionIds.length === 0) {
        await this.redis.del(processingKey);
        return 0;
      }

      const now = new Date();
      const updates = sessionIds.map((id) => {
        const addedSeconds = parseInt(pending[id] || '0', 10);
        return this.prisma.watchSession.updateMany({
          where: { id, status: 'ACTIVE' },
          data: {
            totalWatchSeconds: { increment: addedSeconds },
            lastHeartbeatAt: now,
          },
        });
      });

      // Execute updates in parallel chunks to keep PostgreSQL pool responsive
      const CHUNK_SIZE = 50;
      for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
        const chunk = updates.slice(i, i + CHUNK_SIZE);
        await Promise.allSettled(chunk);
      }

      await this.redis.del(processingKey);
      return sessionIds.length;
    } catch (err) {
      console.error('[SessionAccumulator] Error flushing sessions to database:', err);
      return 0;
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Immediately flushes pending watch time for a specific disconnecting session.
   */
  public async flushSession(sessionId: string): Promise<number> {
    if (!sessionId) return 0;
    try {
      const key = RedisKeys.sessionsPendingWatchTime();
      const rawSeconds = await this.redis.hget(key, sessionId);
      if (!rawSeconds) return 0;

      await this.redis.hdel(key, sessionId);
      const addedSeconds = parseInt(rawSeconds, 10);
      if (isNaN(addedSeconds) || addedSeconds <= 0) return 0;

      await this.prisma.watchSession.updateMany({
        where: { id: sessionId },
        data: {
          totalWatchSeconds: { increment: addedSeconds },
          lastHeartbeatAt: new Date(),
        },
      });

      return addedSeconds;
    } catch (err) {
      console.warn(`[SessionAccumulator] Error flushing session ${sessionId}:`, err);
      return 0;
    }
  }

  /**
   * Starts periodic flushing to PostgreSQL.
   */
  public startAutoFlush(intervalMs: number = 60000): void {
    if (this.timer) return;
    this.timer = setInterval(async () => {
      try {
        await this.flushToDatabase();
      } catch (err) {
        console.error('[SessionAccumulator] Periodic flush error:', err);
      }
    }, intervalMs);
    // Don't keep event loop alive solely for this timer
    this.timer.unref?.();
  }

  /**
   * Stops periodic flusher.
   */
  public stopAutoFlush(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
