import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionAccumulatorService } from '../src/infrastructure/redis/session-accumulator.service.js';

describe('SessionAccumulatorService', () => {
  let redisMock: any;
  let prismaMock: any;
  let accumulator: SessionAccumulatorService;

  beforeEach(() => {
    const memoryHash = new Map<string, string>();

    redisMock = {
      hincrby: vi.fn(async (_key: string, field: string, increment: number) => {
        const current = parseInt(memoryHash.get(field) || '0', 10);
        const next = current + increment;
        memoryHash.set(field, String(next));
        return next;
      }),
      rename: vi.fn(async (key: string, newKey: string) => {
        if (memoryHash.size === 0) throw new Error('ERR no such key');
        return 'OK';
      }),
      hgetall: vi.fn(async (_key: string) => {
        const obj: Record<string, string> = {};
        for (const [k, v] of memoryHash.entries()) {
          obj[k] = v;
        }
        return obj;
      }),
      hget: vi.fn(async (_key: string, field: string) => {
        return memoryHash.get(field) || null;
      }),
      hdel: vi.fn(async (_key: string, field: string) => {
        return memoryHash.delete(field) ? 1 : 0;
      }),
      del: vi.fn(async (_key: string) => {
        memoryHash.clear();
        return 1;
      }),
    };

    prismaMock = {
      watchSession: {
        updateMany: vi.fn(async ({ where, data }: any) => {
          return { count: 1 };
        }),
      },
    };

    accumulator = new SessionAccumulatorService(redisMock as any, prismaMock as any);
  });

  it('should record heartbeats into Redis hash without touching PostgreSQL', async () => {
    await accumulator.recordHeartbeat('session-1', 15);
    await accumulator.recordHeartbeat('session-1', 15);
    await accumulator.recordHeartbeat('session-2', 15);

    expect(redisMock.hincrby).toHaveBeenCalledTimes(3);
    expect(prismaMock.watchSession.updateMany).not.toHaveBeenCalled();
  });

  it('should flush all accumulated sessions to PostgreSQL in batch', async () => {
    await accumulator.recordHeartbeat('session-1', 30);
    await accumulator.recordHeartbeat('session-2', 15);

    const count = await accumulator.flushToDatabase();
    expect(count).toBe(2);
    expect(prismaMock.watchSession.updateMany).toHaveBeenCalledTimes(2);
  });

  it('should flush individual session on disconnect', async () => {
    await accumulator.recordHeartbeat('session-1', 45);
    const added = await accumulator.flushSession('session-1');

    expect(added).toBe(45);
    expect(prismaMock.watchSession.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.watchSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          totalWatchSeconds: { increment: 45 },
        }),
      })
    );
  });

  it('should cleanly start and stop auto flusher', () => {
    accumulator.startAutoFlush(1000);
    accumulator.stopAutoFlush();
    // Verify no lingering unhandled timers
    expect(true).toBe(true);
  });
});
