import { MessageHandler, type HandlerContext } from '../message-handler.js';
import { Permission } from '../../../modules/rbac/permissions.js';
import type { IPlaylistService } from '../../../modules/playlists/services/playlist.service.js';
import type { IRoomPubSubService } from '../../../infrastructure/redis/room-pubsub.service.js';

interface PlaylistActionData {
  roomId: string;
  playlistId?: string;
  action: 'ADD' | 'REMOVE' | 'REORDER';
  payload?: any;
}

/**
 * Handles playlist mutations (ADD, REMOVE, REORDER) with
 * RBAC authorization and multi-instance Redis Pub/Sub syncing.
 */
export class PlaylistActionHandler extends MessageHandler<PlaylistActionData> {
  constructor(
    roomManager: ConstructorParameters<typeof MessageHandler>[0],
    participants: ConstructorParameters<typeof MessageHandler>[1],
    rbacEngine: ConstructorParameters<typeof MessageHandler>[2],
    private readonly playlistService?: IPlaylistService,
    private readonly roomPubSubService?: IRoomPubSubService,
    roomResolver?: ConstructorParameters<typeof MessageHandler>[3],
  ) {
    super(roomManager, participants, rbacEngine, roomResolver);
  }

  protected requiredPermission(): Permission {
    return Permission.PLAYLIST_MANAGE;
  }

  protected async validate(_ctx: HandlerContext, _data: PlaylistActionData): Promise<string | null> {
    if (!this.playlistService) {
      return 'Playlist service unavailable';
    }
    return null;
  }

  protected async execute(ctx: HandlerContext, data: PlaylistActionData): Promise<any> {
    if (!this.playlistService) return null;

    const { io, room, participant } = ctx;
    const { action, payload, playlistId } = data;

    const defaultPl = await this.playlistService.getOrCreateDefaultPlaylist(room.id, participant.userId);
    const targetPlaylistId = playlistId || defaultPl.id;

    if (action === 'ADD') {
      const addPayload = payload as { url?: string; mediaUrl?: string; mediaId?: string; title?: string };
      const urlToAdd = addPayload.url || addPayload.mediaUrl || '';
      await this.playlistService.addItem(room.id, targetPlaylistId, participant.userId, {
        url: urlToAdd,
        mediaId: addPayload.mediaId,
        title: addPayload.title,
      });
    } else if (action === 'REMOVE') {
      const removePayload = payload as { itemId: string };
      await this.playlistService.removeItem(removePayload.itemId);
    } else if (action === 'REORDER') {
      const reorderPayload = payload as { itemIds: string[] };
      await this.playlistService.reorderItems(targetPlaylistId, reorderPayload.itemIds);
    }

    const updatedPlaylist = await this.playlistService.getPlaylist(targetPlaylistId);
    const playlistPayload = {
      playlistId: targetPlaylistId,
      items: updatedPlaylist.items || [],
    };

    if (this.roomPubSubService) {
      await this.roomPubSubService.publish(room.id, 'PLAYLIST_SYNC', playlistPayload, participant.userId);
    }
    room.broadcast(io, 'playlist:sync', playlistPayload);

    return { playlist: updatedPlaylist };
  }
}
