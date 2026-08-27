import type { IRepository } from '../../../core/interfaces/index.js';
import type { MediaProviderType, MediaType } from '../providers/media-provider.interface.js';

export interface MediaEntity {
  id: string;
  roomId: string;
  type: MediaType;
  provider: MediaProviderType;
  externalId: string;
  sourceUrl: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMediaData {
  roomId: string;
  type?: MediaType;
  provider?: MediaProviderType;
  externalId: string;
  sourceUrl: string;
  title?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface IMediaRepository extends IRepository<MediaEntity> {
  findById(id: string): Promise<MediaEntity | null>;
  findByExternalId(roomId: string, provider: MediaProviderType, externalId: string): Promise<MediaEntity | null>;
  listByRoom(roomId: string): Promise<MediaEntity[]>;
  create(data: CreateMediaData): Promise<MediaEntity>;
  delete(id: string): Promise<boolean>;
}
