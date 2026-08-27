import { prisma as defaultPrisma, type PrismaClient, toSafeDate } from '../../../infrastructure/database/prisma.js';
import type {
  IPlaybackRepository,
  PlaybackStateEntity,
  PlaybackHistoryEntity,
} from './playback.repository.interface.js';
import type { PlaybackActionType, PlaybackStateSnapshot } from '../engine/playback-sync.engine.js';

export class PrismaPlaybackRepository implements IPlaybackRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async getStateByRoomId(roomId: string): Promise<PlaybackStateEntity | null> {
    const state = await this.prisma.playbackState.findUnique({
      where: { roomId },
    });

    if (!state) return null;

    const media = state.mediaId
      ? await this.prisma.media.findUnique({ where: { id: state.mediaId } })
      : null;

    return {
      id: state.id,
      roomId: state.roomId,
      mediaId: state.mediaId ?? null,
      position: state.position,
      isPlaying: state.isPlaying,
      playbackRate: state.playbackRate,
      version: Number(state.version),
      serverTimestamp: toSafeDate(state.serverTimestamp),
      lastAction: (state.lastAction as PlaybackActionType) ?? null,
      lastActionById: state.lastActionById ?? null,
      updatedAt: toSafeDate(state.updatedAt),
      media: (media as unknown as PlaybackStateEntity['media']) ?? null,
    };
  }


  public async saveState(state: PlaybackStateSnapshot): Promise<PlaybackStateEntity> {
    const updated = await this.prisma.playbackState.upsert({
      where: { roomId: state.roomId },
      update: {
        mediaId: state.mediaId ?? null,
        position: state.position,
        isPlaying: state.isPlaying,
        playbackRate: state.playbackRate,
        version: BigInt(state.version),
        serverTimestamp: state.serverTimestamp,
        lastAction: state.lastAction ?? null,
        lastActionById: state.lastActionById ?? null,
      },
      create: {
        roomId: state.roomId,
        mediaId: state.mediaId ?? null,
        position: state.position,
        isPlaying: state.isPlaying,
        playbackRate: state.playbackRate,
        version: BigInt(state.version),
        serverTimestamp: state.serverTimestamp,
        lastAction: state.lastAction ?? null,
        lastActionById: state.lastActionById ?? null,
      },
    });

    const media = updated.mediaId
      ? await this.prisma.media.findUnique({ where: { id: updated.mediaId } })
      : null;

    return {
      id: updated.id,
      roomId: updated.roomId,
      mediaId: updated.mediaId ?? null,
      position: updated.position,
      isPlaying: updated.isPlaying,
      playbackRate: updated.playbackRate,
      version: Number(updated.version),
      serverTimestamp: toSafeDate(updated.serverTimestamp),
      lastAction: (updated.lastAction as PlaybackActionType) ?? null,
      lastActionById: updated.lastActionById ?? null,
      updatedAt: toSafeDate(updated.updatedAt),
      media: (media as unknown as PlaybackStateEntity['media']) ?? null,
    };
  }

  public async recordHistory(data: {
    roomId: string;
    actorId: string;
    action: PlaybackActionType;
    mediaId?: string | null;
    position?: number | null;
    playbackRate?: number | null;
    version?: number | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    await this.prisma.playbackHistory.create({
      data: {
        roomId: data.roomId,
        actorId: data.actorId,
        action: data.action,
        mediaId: data.mediaId ?? null,
        position: data.position ?? null,
        playbackRate: data.playbackRate ?? null,
        version: data.version !== undefined && data.version !== null ? BigInt(data.version) : null,
        metadata: data.metadata ?? null,
      },
    });
  }

  public async getHistory(roomId: string, limit: number = 50): Promise<PlaybackHistoryEntity[]> {
    const rows = await this.prisma.playbackHistory.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return rows.map((r: any) => ({
      id: r.id,
      roomId: r.roomId,
      actorId: r.actorId,
      action: r.action as PlaybackActionType,
      mediaId: r.mediaId ?? null,
      position: r.position ?? null,
      playbackRate: r.playbackRate ?? null,
      version: r.version !== null ? Number(r.version) : null,
      metadata: (r.metadata as Record<string, unknown>) ?? null,
      createdAt: toSafeDate(r.createdAt),
    }));
  }
}
