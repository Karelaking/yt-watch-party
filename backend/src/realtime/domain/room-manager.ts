import { Room } from './room.js';
import type { RoomSettingsSnapshot } from '../../modules/rbac/permissions.js';

/**
 * In-memory registry of active Room domain objects.
 *
 * Manages the lifecycle of Room instances for connected participants.
 * Rooms are created lazily when the first participant joins and
 * cleaned up when the last participant leaves.
 */
export class RoomManager {
  private readonly rooms = new Map<string, Room>();

  /**
   * Get an existing Room by ID, or create one from a DB entity.
   */
  public getOrCreate(
    roomEntity: { id: string; code: string; name: string; ownerId: string },
    settings?: Partial<RoomSettingsSnapshot> | null,
  ): Room {
    let room = this.rooms.get(roomEntity.id);
    if (!room) {
      room = Room.fromEntity(roomEntity, settings);
      this.rooms.set(roomEntity.id, room);
    }
    return room;
  }

  /**
   * Get an existing Room by ID.
   */
  public get(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Check if a Room exists in the registry.
   */
  public has(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  /**
   * Remove a Room from the registry.
   * Call when the last participant leaves or the room ends.
   */
  public remove(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  /**
   * Clean up an empty room (no participants left).
   * Returns true if the room was removed.
   */
  public cleanupIfEmpty(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (room && room.participantCount === 0) {
      this.rooms.delete(roomId);
      return true;
    }
    return false;
  }

  /**
   * Number of active rooms in the registry.
   */
  get size(): number {
    return this.rooms.size;
  }
}
