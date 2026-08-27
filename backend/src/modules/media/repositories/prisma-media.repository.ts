import { prisma as defaultPrisma, type PrismaClient } from '../../../infrastructure/database/prisma.js';
import type { IMediaRepository, MediaEntity, CreateMediaData } from './media.repository.interface.js';
import type { MediaProviderType } from '../providers/media-provider.interface.js';

export class PrismaMediaRepository implements IMediaRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async findById(id: string): Promise<MediaEntity | null> {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });
    return (media as unknown as MediaEntity) || null;
  }

  public async findByExternalId(
    roomId: string,
    provider: MediaProviderType,
    externalId: string
  ): Promise<MediaEntity | null> {
    const media = await this.prisma.media.findFirst({
      where: {
        roomId,
        provider,
        externalId,
      },
    });
    return (media as unknown as MediaEntity) || null;
  }

  public async listByRoom(roomId: string): Promise<MediaEntity[]> {
    const media = await this.prisma.media.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
    });
    return media as unknown as MediaEntity[];
  }

  public async create(data: CreateMediaData): Promise<MediaEntity> {
    const created = await this.prisma.media.create({
      data: {
        roomId: data.roomId,
        type: data.type ?? 'VIDEO',
        provider: data.provider ?? 'YOUTUBE',
        externalId: data.externalId,
        sourceUrl: data.sourceUrl,
        title: data.title ?? null,
        description: data.description ?? null,
        thumbnailUrl: data.thumbnailUrl ?? null,
        duration: data.duration ?? null,
        metadata: data.metadata ?? null,
      },
    });
    return created as unknown as MediaEntity;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.prisma.media.delete({
      where: { id },
    });
    return !!result;
  }
}
