import type { IPlaylistRepository, PlaylistEntity, PlaylistItemEntity } from '../repositories/playlist.repository.interface.js';
import type { IMediaService } from '../../media/services/media.service.js';
import type { CreatePlaylistDto, AddPlaylistItemDto } from '../dtos/playlist.dto.js';
import { NotFoundError } from '../../../core/errors/index.js';
import type { IService } from '../../../core/interfaces/index.js';

export interface IPlaylistService extends IService {
  getOrCreateDefaultPlaylist(roomId: string, userId: string): Promise<PlaylistEntity>;
  createPlaylist(roomId: string, userId: string, data: CreatePlaylistDto): Promise<PlaylistEntity>;
  getPlaylist(playlistId: string): Promise<PlaylistEntity>;
  listRoomPlaylists(roomId: string): Promise<PlaylistEntity[]>;
  addItem(roomId: string, playlistId: string, userId: string, data: AddPlaylistItemDto): Promise<PlaylistItemEntity>;
  removeItem(playlistItemId: string): Promise<void>;
  reorderItems(playlistId: string, itemIdsInOrder: string[]): Promise<void>;
}

export class PlaylistService implements IPlaylistService {
  constructor(
    private readonly playlistRepository: IPlaylistRepository,
    private readonly mediaService: IMediaService
  ) {}

  public async getOrCreateDefaultPlaylist(roomId: string, userId: string): Promise<PlaylistEntity> {
    const existing = await this.playlistRepository.findRoomActivePlaylist(roomId);
    if (existing) return existing;

    return this.playlistRepository.create({
      roomId,
      createdById: userId,
      name: 'Main Room Playlist',
      description: 'Default watch party playlist',
    });
  }

  public async createPlaylist(roomId: string, userId: string, data: CreatePlaylistDto): Promise<PlaylistEntity> {
    return this.playlistRepository.create({
      roomId,
      createdById: userId,
      name: data.name,
      description: data.description ?? null,
    });
  }

  public async getPlaylist(playlistId: string): Promise<PlaylistEntity> {
    const playlist = await this.playlistRepository.findById(playlistId);
    if (!playlist) throw new NotFoundError('Playlist not found');
    return playlist;
  }

  public async listRoomPlaylists(roomId: string): Promise<PlaylistEntity[]> {
    return this.playlistRepository.listByRoom(roomId);
  }

  public async addItem(
    roomId: string,
    playlistId: string,
    userId: string,
    data: AddPlaylistItemDto
  ): Promise<PlaylistItemEntity> {
    const playlist = await this.playlistRepository.findById(playlistId);
    if (!playlist) throw new NotFoundError('Playlist not found');

    let mediaId = data.mediaId;
    if (!mediaId && data.url) {
      const media = await this.mediaService.resolveAndSaveMedia(roomId, data.url, data.title);
      mediaId = media.id;
    }

    if (!mediaId) {
      throw new NotFoundError('Failed to resolve media item');
    }

    const nextPosition = (playlist.items?.length ?? 0) + 1;

    return this.playlistRepository.addItem({
      playlistId,
      mediaId,
      position: nextPosition,
      addedById: userId,
    });
  }

  public async removeItem(playlistItemId: string): Promise<void> {
    const success = await this.playlistRepository.removeItem(playlistItemId);
    if (!success) throw new NotFoundError('Playlist item not found');
  }

  public async reorderItems(playlistId: string, itemIdsInOrder: string[]): Promise<void> {
    await this.playlistRepository.reorderItems(playlistId, itemIdsInOrder);
  }
}
