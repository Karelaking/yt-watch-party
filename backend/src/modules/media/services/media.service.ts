import type { IMediaRepository, MediaEntity } from '../repositories/media.repository.interface.js';
import type { MediaProviderStrategy } from '../providers/youtube.provider.js';
import { NotFoundError } from '../../../core/errors/index.js';
import type { IService } from '../../../core/interfaces/index.js';

export interface IMediaService extends IService {
  resolveAndSaveMedia(roomId: string, url: string, customTitle?: string): Promise<MediaEntity>;
  getMediaById(mediaId: string): Promise<MediaEntity>;
  listRoomMedia(roomId: string): Promise<MediaEntity[]>;
}

export class MediaService implements IMediaService {
  constructor(
    private readonly mediaRepository: IMediaRepository,
    private readonly providerStrategy: MediaProviderStrategy
  ) {}

  public async resolveAndSaveMedia(roomId: string, url: string, customTitle?: string): Promise<MediaEntity> {
    const provider = this.providerStrategy.resolve(url);
    const parsed = await provider.parse(url);

    // Check if media already added in this room
    const existing = await this.mediaRepository.findByExternalId(roomId, parsed.provider, parsed.externalId);
    if (existing) {
      return existing;
    }

    return this.mediaRepository.create({
      roomId,
      type: parsed.type,
      provider: parsed.provider,
      externalId: parsed.externalId,
      sourceUrl: parsed.sourceUrl,
      title: customTitle || parsed.title,
      description: parsed.description,
      thumbnailUrl: parsed.thumbnailUrl,
      duration: parsed.duration,
      metadata: parsed.metadata,
    });
  }

  public async getMediaById(mediaId: string): Promise<MediaEntity> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) throw new NotFoundError('Media item not found');
    return media;
  }

  public async listRoomMedia(roomId: string): Promise<MediaEntity[]> {
    return this.mediaRepository.listByRoom(roomId);
  }
}
