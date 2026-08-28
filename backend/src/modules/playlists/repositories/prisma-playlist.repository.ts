import { prisma as defaultPrisma, type PrismaClient } from '../../../infrastructure/database/prisma.js';
import type {
  IPlaylistRepository,
  PlaylistEntity,
  PlaylistItemEntity,
} from './playlist.repository.interface.js';

export class PrismaPlaylistRepository implements IPlaylistRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async findById(id: string): Promise<PlaylistEntity | null> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
    });
    if (!playlist) return null;

    const rawItems = await this.prisma.playlistItem.findMany({
      where: { playlistId: id },
      orderBy: { position: 'asc' },
    });

    const items = await Promise.all(
      (rawItems || []).map(async (item: any) => {
        const media = item.mediaId
          ? await this.prisma.media.findUnique({ where: { id: item.mediaId } })
          : null;
        return {
          ...item,
          media,
        };
      })
    );

    return {
      ...playlist,
      items,
    } as unknown as PlaylistEntity;
  }

  public async findRoomActivePlaylist(roomId: string): Promise<PlaylistEntity | null> {
    const playlist = await this.prisma.playlist.findFirst({
      where: { roomId, status: 'ACTIVE' },
    });
    if (!playlist) return null;

    const rawItems = await this.prisma.playlistItem.findMany({
      where: { playlistId: playlist.id },
      orderBy: { position: 'asc' },
    });

    const items = await Promise.all(
      (rawItems || []).map(async (item: any) => {
        const media = item.mediaId
          ? await this.prisma.media.findUnique({ where: { id: item.mediaId } })
          : null;
        return {
          ...item,
          media,
        };
      })
    );

    return {
      ...playlist,
      items,
    } as unknown as PlaylistEntity;
  }

  public async listByRoom(roomId: string): Promise<PlaylistEntity[]> {
    const playlists = await this.prisma.playlist.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      (playlists || []).map(async (pl: any) => {
        const rawItems = await this.prisma.playlistItem.findMany({
          where: { playlistId: pl.id },
          orderBy: { position: 'asc' },
        });

        const items = await Promise.all(
          (rawItems || []).map(async (item: any) => {
            const media = item.mediaId
              ? await this.prisma.media.findUnique({ where: { id: item.mediaId } })
              : null;
            return {
              ...item,
              media,
            };
          })
        );

        return {
          ...pl,
          items,
        };
      })
    ) as unknown as Promise<PlaylistEntity[]>;
  }

  public async create(data: {
    roomId: string;
    createdById: string;
    name: string;
    description?: string | null;
  }): Promise<PlaylistEntity> {
    const created = await this.prisma.playlist.create({
      data: {
        roomId: data.roomId,
        createdById: data.createdById,
        name: data.name,
        description: data.description ?? null,
        status: 'ACTIVE',
      },
    });
    return {
      ...created,
      items: [],
    } as unknown as PlaylistEntity;
  }

  public async addItem(data: {
    playlistId: string;
    mediaId: string;
    position: number;
    addedById?: string | null;
  }): Promise<PlaylistItemEntity> {
    const item = await this.prisma.playlistItem.create({
      data: {
        playlistId: data.playlistId,
        mediaId: data.mediaId,
        position: data.position,
        addedById: data.addedById ?? null,
      },
    });

    const media = await this.prisma.media.findUnique({ where: { id: data.mediaId } });

    return {
      ...item,
      media,
    } as unknown as PlaylistItemEntity;
  }

  public async removeItem(itemId: string): Promise<boolean> {
    const item = await this.prisma.playlistItem.findUnique({ where: { id: itemId } });
    if (!item) return false;

    await this.prisma.$transaction(async (tx: any) => {
      await tx.playlistItem.delete({ where: { id: itemId } });

      const subsequent = await tx.playlistItem.findMany({
        where: {
          playlistId: item.playlistId,
          position: { gt: item.position },
        },
        orderBy: { position: 'asc' },
      });

      for (const sub of subsequent) {
        await tx.playlistItem.update({
          where: { id: sub.id },
          data: { position: sub.position - 1 },
        });
      }
    });

    return true;
  }

  public async reorderItems(playlistId: string, itemIdsInOrder: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx: any) => {
      // Step 1: Give temporary negative positions to prevent unique constraint conflicts on (playlistId, position)
      for (let i = 0; i < itemIdsInOrder.length; i++) {
        const id = itemIdsInOrder[i]!;
        await tx.playlistItem.update({
          where: { id },
          data: { position: -(i + 1) },
        });
      }

      // Step 2: Assign target positive positions
      for (let i = 0; i < itemIdsInOrder.length; i++) {
        const id = itemIdsInOrder[i]!;
        await tx.playlistItem.update({
          where: { id },
          data: { position: i + 1 },
        });
      }
    });
  }
}
