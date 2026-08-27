import type { Request, Response } from 'express';
import { BaseController } from '../../../core/interfaces/index.js';
import type { IPlaylistService } from '../services/playlist.service.js';
import type { CreatePlaylistDto, AddPlaylistItemDto, ReorderPlaylistDto } from '../dtos/playlist.dto.js';
import { UnauthorizedError } from '../../../core/errors/index.js';

export class PlaylistController extends BaseController {
  constructor(private readonly playlistService: IPlaylistService) {
    super();
  }

  public createPlaylist = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const roomId = req.params['roomId'] as string;
    const playlist = await this.playlistService.createPlaylist(roomId, req.user.id, req.body as CreatePlaylistDto);
    return this.created(res, playlist, 'Playlist created successfully');
  });

  public getPlaylist = this.catchAsync(async (req: Request, res: Response) => {
    const playlistId = req.params['id'] as string;
    const playlist = await this.playlistService.getPlaylist(playlistId);
    return this.ok(res, playlist);
  });

  public listRoomPlaylists = this.catchAsync(async (req: Request, res: Response) => {
    const roomId = req.params['roomId'] as string;
    const playlists = await this.playlistService.listRoomPlaylists(roomId);
    return this.ok(res, playlists);
  });

  public addItem = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const roomId = req.params['roomId'] as string;
    const playlistId = req.params['playlistId'] as string;
    const item = await this.playlistService.addItem(roomId, playlistId, req.user.id, req.body as AddPlaylistItemDto);
    return this.created(res, item, 'Item added to playlist');
  });

  public removeItem = this.catchAsync(async (req: Request, res: Response) => {
    const itemId = req.params['itemId'] as string;
    await this.playlistService.removeItem(itemId);
    return this.ok(res, { removed: true }, 'Item removed from playlist');
  });

  public reorder = this.catchAsync(async (req: Request, res: Response) => {
    const playlistId = req.params['playlistId'] as string;
    const { itemIds } = req.body as ReorderPlaylistDto;
    await this.playlistService.reorderItems(playlistId, itemIds);
    return this.ok(res, { reordered: true }, 'Playlist items reordered');
  });
}
