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
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: {
            media: true,
          },
        },
      },
    });

    return (playlist as unknown as PlaylistEntity) || null;
  }

  public async findRoomActivePlaylist(roomId: string): Promise<PlaylistEntity | null> {
    const playlist = await this.prisma.playlist.findFirst({
      where: { roomId, status: 'ACTIVE' },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: {
            media: true,
          },
        },
      },
    });

    return (playlist as unknown as PlaylistEntity) || null;
  }

  public async listByRoom(roomId: string): Promise<PlaylistEntity[]> {
    const playlists = await this.prisma.playlist.findMany({
      where: { roomId },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: {
            media: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return playlists as unknown as PlaylistEntity[];
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
    return created as unknown as PlaylistEntity;
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
    return item as unknown as PlaylistItemEntity;
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
