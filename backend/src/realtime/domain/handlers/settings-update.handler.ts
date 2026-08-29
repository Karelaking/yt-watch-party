import { MessageHandler, type HandlerContext } from '../message-handler.js';
import { Permission } from '../../../modules/rbac/permissions.js';
import type { IRoomSettingsRepository } from '../../../modules/rooms/repositories/room.repository.interface.js';
import type { IRoomPubSubService } from '../../../infrastructure/redis/room-pubsub.service.js';

interface SettingsUpdateData {
  roomId: string;
  settings: any;
}

/**
 * Handles room settings updates.
 * Restricted to HOST / Owner.
 */
export class SettingsUpdateHandler extends MessageHandler<SettingsUpdateData> {
  constructor(
    roomManager: ConstructorParameters<typeof MessageHandler>[0],
    participants: ConstructorParameters<typeof MessageHandler>[1],
    rbacEngine: ConstructorParameters<typeof MessageHandler>[2],
    private readonly settingsRepository: IRoomSettingsRepository,
    private readonly roomPubSubService?: IRoomPubSubService,
    roomResolver?: ConstructorParameters<typeof MessageHandler>[3],
  ) {
    super(roomManager, participants, rbacEngine, roomResolver);
  }

  protected requiredPermission(): Permission {
    return Permission.ROOM_UPDATE_SETTINGS;
  }

  protected async validate(ctx: HandlerContext, data: SettingsUpdateData): Promise<string | null> {
    if (!ctx.participant.isOwner && ctx.participant.role !== 'HOST') {
      return 'Only room host can modify settings';
    }
    if (!data.settings || typeof data.settings !== 'object') {
      return 'Invalid settings payload';
    }
    return null;
  }

  protected async execute(ctx: HandlerContext, data: SettingsUpdateData): Promise<any> {
    const { io, room, participant } = ctx;

    const updated = await this.settingsRepository.update(room.id, data.settings as any);
    if (updated) {
      room.updateSettings(updated);
    }

    const settingsPayload = {
      roomId: room.id,
      settings: updated,
    };

    if (this.roomPubSubService) {
      await this.roomPubSubService.publish(room.id, 'ROOM_SETTINGS_UPDATED', settingsPayload, participant.userId);
    } else {
      room.broadcast(io, 'room:settings_updated', settingsPayload);
    }

    return settingsPayload;
  }
}
