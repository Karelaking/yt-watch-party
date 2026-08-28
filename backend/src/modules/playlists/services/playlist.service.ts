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
    const playlists = await this.playlistRepository.listByRoom(roomId);
    if (!playlists || playlists.length === 0) {
      const defaultPl = await this.playlistRepository.create({
        roomId,
        createdById: 'system',
        name: 'Main Room Playlist',
        description: 'Default watch party playlist',
      });
      return [{ ...defaultPl, items: [] }];
    }
    return playlists;
  }

  public async addItem(
    roomId: string,
    playlistId: string,
    userId: string,
    data: AddPlaylistItemDto & { url?: string }
  ): Promise<PlaylistItemEntity> {
    let playlist = playlistId ? await this.playlistRepository.findById(playlistId) : null;
    if (!playlist) {
      playlist = await this.getOrCreateDefaultPlaylist(roomId, userId);
    }

    let mediaId = data.mediaId;
    const rawUrl = data.url || data.mediaUrl;
    if (!mediaId && rawUrl) {
      const media = await this.mediaService.resolveAndSaveMedia(roomId, rawUrl, data.title);
      mediaId = media.id;
    }

    if (!mediaId) {
      throw new NotFoundError('Failed to resolve media item from provided URL or ID');
    }

    const nextPosition = (playlist.items?.length ?? 0) + 1;

    return this.playlistRepository.addItem({
      playlistId: playlist.id,
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
