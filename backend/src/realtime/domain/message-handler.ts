import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from '../socket.types.js';
import { Participant } from './participant.js';
import type { Room } from './room.js';
import type { RoomManager } from './room-manager.js';
import type { IRbacPolicyEngine } from '../../modules/rbac/rbac-policy-engine.js';
import type { Permission, RoomSettingsSnapshot } from '../../modules/rbac/permissions.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/**
 * Shared context passed to every MessageHandler.
 * Contains the services and domain objects needed by handler subclasses.
 */
export interface HandlerContext {
  readonly io: TypedServer;
  readonly socket: TypedSocket;
  readonly participant: Participant;
  readonly room: Room;
  readonly rbacEngine: IRbacPolicyEngine;
}

/**
 * Abstract base class for socket event handlers.
 *
 * Implements the Template Method pattern:
 *   1. Resolve the participant and room
 *   2. Validate permissions (optional override)
 *   3. Execute the handler logic (abstract)
 *   4. Handle errors uniformly
 *
 * Concrete subclasses implement `execute()` and optionally
 * override `requiredPermission()` and `validate()`.
 */
export type RoomResolver = (roomIdOrCode: string) => Promise<Room | null>;

/**
 * Abstract base class for socket event handlers.
 *
 * Implements the Template Method pattern:
 *   1. Resolve the participant and room
 *   2. Validate permissions (optional override)
 *   3. Execute the handler logic (abstract)
 *   4. Handle errors uniformly
 *
 * Concrete subclasses implement `execute()` and optionally
 * override `requiredPermission()` and `validate()`.
 */
export abstract class MessageHandler<TData extends { roomId: string }, TResult = void> {
  constructor(
    protected readonly roomManager: RoomManager,
    protected readonly participants: Map<string, Participant>,
    protected readonly rbacEngine: IRbacPolicyEngine,
    protected readonly roomResolver?: RoomResolver,
  ) {}

  /**
   * Main entry point — called by the gateway's socket.on() registration.
   */
  public async handle(
    io: TypedServer,
    socket: TypedSocket,
    data: TData,
    callback?: (result: any) => void,
  ): Promise<void> {
    try {
      // 1. Resolve the room
      let room = this.roomManager.get(data.roomId) ||
        (socket.data.currentRoomId ? this.roomManager.get(socket.data.currentRoomId) : undefined);

      if (!room && this.roomResolver) {
        room = (await this.roomResolver(data.roomId)) ?? undefined;
      }

      if (!room) {
        callback?.({ success: false, error: 'Room not found' });
        return;
      }

      // 2. Resolve or lazily create participant
      let participant = this.participants.get(socket.id);
      if (!participant && socket.data?.user) {
        const user = socket.data.user;
        const isOwner = socket.data.isOwner !== undefined
          ? socket.data.isOwner
          : (room.ownerId === user.id || (user.clerkUserId ? room.ownerId === user.clerkUserId : false));
        const role = isOwner ? 'HOST' : ((socket.data.role as any) || 'PARTICIPANT');
        participant = Participant.fromAuthContext(user, socket.id, role, isOwner);
        this.participants.set(socket.id, participant);
        room.addParticipant(participant);
      }

      if (!participant) {
        callback?.({ success: false, error: 'Not authenticated or not in a room' });
        return;
      }

      // 3. Build context
      const ctx: HandlerContext = {
        io,
        socket,
        participant,
        room,
        rbacEngine: this.rbacEngine,
      };

      // 4. Check required permission (if any)
      const permission = this.requiredPermission();
      if (permission !== null) {
        const isAllowed = participant.can(permission, room.settings, this.rbacEngine);
        if (!isAllowed) {
          callback?.({ success: false, error: `Permission denied: ${permission}` });
          return;
        }
      }

      // 5. Run optional custom validation
      const validationError = await this.validate(ctx, data);
      if (validationError) {
        callback?.({ success: false, error: validationError });
        return;
      }

      // 6. Execute the handler logic
      const result = await this.execute(ctx, data);
      if (callback) {
        if (result && typeof result === 'object') {
          callback({ success: true, ...result });
        } else if (result !== undefined) {
          callback({ success: true, data: result });
        } else {
          callback({ success: true });
        }
      }
    } catch (err) {
      console.error(`[${this.constructor.name}] error:`, err);
      callback?.({
        success: false,
        error: err instanceof Error ? err.message : 'Handler failed',
      });
    }
  }

  /**
   * Override to specify a required RBAC permission.
   * Return null if no permission check is needed (default).
   */
  protected requiredPermission(): Permission | null {
    return null;
  }

  /**
   * Override to add custom validation before execute().
   * Return an error string to reject, or null to proceed.
   */
  protected async validate(_ctx: HandlerContext, _data: TData): Promise<string | null> {
    return null;
  }

  /**
   * Abstract: implement the core handler logic.
   */
  protected abstract execute(ctx: HandlerContext, data: TData): Promise<TResult>;
}
