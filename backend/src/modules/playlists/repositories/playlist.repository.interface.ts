import type { IRepository } from '../../../core/interfaces/index.js';
import type { MediaEntity } from '../../media/repositories/media.repository.interface.js';

export interface PlaylistItemEntity {
  id: string;
  playlistId: string;
  mediaId: string;
  position: number;
  addedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  media?: MediaEntity;
}

export interface PlaylistEntity {
  id: string;
  roomId: string;
  createdById: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
  items?: PlaylistItemEntity[];
}

export interface IPlaylistRepository extends IRepository<PlaylistEntity> {
  findById(id: string): Promise<PlaylistEntity | null>;
  findRoomActivePlaylist(roomId: string): Promise<PlaylistEntity | null>;
  listByRoom(roomId: string): Promise<PlaylistEntity[]>;
  create(data: { roomId: string; createdById: string; name: string; description?: string | null }): Promise<PlaylistEntity>;
  addItem(data: { playlistId: string; mediaId: string; position: number; addedById?: string | null }): Promise<PlaylistItemEntity>;
  removeItem(itemId: string): Promise<boolean>;
  reorderItems(playlistId: string, itemIdsInOrder: string[]): Promise<void>;
}
