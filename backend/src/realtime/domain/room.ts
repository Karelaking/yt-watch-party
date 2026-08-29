import type { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from '../socket.types.js';
import type { Participant } from './participant.js';
import type { RoomSettingsSnapshot } from '../../modules/rbac/permissions.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/**
 * Represents an active watch party room with its participants and state.
 *
 * Encapsulates the participant collection, room metadata, and provides
 * broadcast methods for emitting events to all room members.
 */
export class Room {
  /** Map of socket IDs → Participant domain objects in this room */
  private readonly _participants = new Map<string, Participant>();

  /** Cached room settings — invalidated on settings updates */
  private _settings: Partial<RoomSettingsSnapshot> | null;

  constructor(
    /** Database room ID (UUID) */
    public readonly id: string,
    /** Short 6-char room code */
    public readonly code: string,
    /** Room display name */
    public readonly name: string,
    /** User ID of the room owner/host */
    private _ownerId: string,
    /** Initial room settings snapshot */
    settings?: Partial<RoomSettingsSnapshot> | null,
  ) {
    this._settings = settings ?? null;
  }

  // ─── Participant Management ────────────────────────────────────

  /**
   * Add a participant to this room.
   */
  public addParticipant(participant: Participant): void {
    this._participants.set(participant.socketId, participant);
  }

  /**
   * Remove a participant by socket ID.
   * @returns The removed Participant, or undefined if not found.
   */
  public removeParticipant(socketId: string): Participant | undefined {
    const participant = this._participants.get(socketId);
    this._participants.delete(socketId);
    return participant;
  }

  /**
   * Remove a participant by user ID (removes all sockets for that user).
   * @returns Array of removed Participants.
   */
  public removeParticipantByUserId(userId: string): Participant[] {
    const removed: Participant[] = [];
    for (const [socketId, p] of this._participants) {
      if (p.userId === userId || p.clerkUserId === userId) {
        this._participants.delete(socketId);
        removed.push(p);
      }
    }
    return removed;
  }

  /**
   * Get a participant by socket ID.
   */
  public getParticipant(socketId: string): Participant | undefined {
    return this._participants.get(socketId);
  }

  /**
   * Find a participant by user ID (first match).
   */
  public findParticipantByUserId(userId: string): Participant | undefined {
    for (const p of this._participants.values()) {
      if (p.userId === userId || p.clerkUserId === userId) {
        return p;
      }
    }
    return undefined;
  }

  /**
   * Check if a user ID is currently in this room.
   */
  public hasUser(userId: string): boolean {
    return this.findParticipantByUserId(userId) !== undefined;
  }

  /**
   * Number of currently connected participants.
   */
  get participantCount(): number {
    return this._participants.size;
  }

  /**
   * Get all participants as an array.
   */
  get participants(): Participant[] {
    return Array.from(this._participants.values());
  }

  // ─── Owner / Settings ─────────────────────────────────────────

  /**
   * Current room owner ID.
   */
  get ownerId(): string {
    return this._ownerId;
  }

  /**
   * Check if a user ID is the room owner.
   */
  public isOwner(userId: string): boolean {
    return this._ownerId === userId;
  }

  /**
   * Transfer ownership to a new user.
   */
  public transferOwnership(newOwnerId: string): void {
    this._ownerId = newOwnerId;
  }

  /**
   * Cached room settings.
   */
  get settings(): Partial<RoomSettingsSnapshot> | null {
    return this._settings;
  }

  /**
   * Update the cached settings.
   */
  public updateSettings(settings: Partial<RoomSettingsSnapshot>): void {
    this._settings = settings;
  }

  /**
   * Invalidate the cached settings (force re-fetch on next access).
   */
  public invalidateSettings(): void {
    this._settings = null;
  }

  // ─── Broadcasting ─────────────────────────────────────────────

  /** The Socket.IO room channel name */
  get channel(): string {
    return `room:${this.id}`;
  }

  /**
   * Broadcast an event to all participants in this room.
   */
  public broadcast<E extends keyof ServerToClientEvents>(
    io: TypedServer,
    event: E,
    ...args: Parameters<ServerToClientEvents[E]>
  ): void {
    io.to(this.channel).emit(event, ...args);
  }

  // ─── Serialization ────────────────────────────────────────────

  /**
   * Get a serialized list of all participants with their roles.
   */
  public toParticipantList(): Array<{ userId: string; role: string; displayName: string | null }> {
    return this.participants.map((p) => p.toMemberPayload());
  }

  // ─── Factory ──────────────────────────────────────────────────

  /**
   * Create a Room from a database room entity.
   */
  public static fromEntity(
    entity: { id: string; code: string; name: string; ownerId: string },
    settings?: Partial<RoomSettingsSnapshot> | null,
  ): Room {
    return new Room(entity.id, entity.code, entity.name, entity.ownerId, settings);
  }
}
