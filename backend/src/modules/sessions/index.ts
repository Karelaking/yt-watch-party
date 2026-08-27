import { prisma as defaultPrisma, type PrismaClient, toSafeDate } from '../../infrastructure/database/prisma.js';
import type {
  ISessionRepository,
  WatchSessionEntity,
  ScreenShareSessionEntity,
} from './repositories/session.repository.interface.js';

export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async startWatchSession(roomId: string, userId: string): Promise<WatchSessionEntity> {
    const session = await this.prisma.watchSession.create({
      data: {
        roomId,
        userId,
        status: 'ACTIVE',
        joinedAt: new Date(),
        totalWatchSeconds: 0,
        lastHeartbeatAt: new Date(),
      },
    });
    return session as unknown as WatchSessionEntity;
  }

  public async heartbeatWatchSession(sessionId: string): Promise<void> {
    const session = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.status !== 'ACTIVE') return;

    const now = new Date();
    const last = session.lastHeartbeatAt ? toSafeDate(session.lastHeartbeatAt) : toSafeDate(session.joinedAt);

    const addedSeconds = Math.min(60, Math.max(0, Math.floor((now.getTime() - last.getTime()) / 1000)));

    await this.prisma.watchSession.update({
      where: { id: sessionId },
      data: {
        lastHeartbeatAt: now,
        totalWatchSeconds: session.totalWatchSeconds + addedSeconds,
      },
    });
  }

  public async endWatchSession(sessionId: string): Promise<void> {
    await this.prisma.watchSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        leftAt: new Date(),
      },
    });
  }

  public async startScreenShare(
    roomId: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): Promise<ScreenShareSessionEntity> {
    const session = await this.prisma.screenShareSession.create({
      data: {
        roomId,
        userId,
        status: 'ACTIVE',
        startedAt: new Date(),
        metadata: metadata ?? null,
      },
    });
    return session as unknown as ScreenShareSessionEntity;
  }

  public async endScreenShare(sessionId: string): Promise<void> {
    await this.prisma.screenShareSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });
  }
}

export * from './repositories/session.repository.interface.js';
