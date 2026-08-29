import type { RoomRole, RoomSettingsSnapshot } from '../../modules/rbac/permissions.js';
import type { IRbacPolicyEngine } from '../../modules/rbac/rbac-policy-engine.js';
import { Permission, ROLE_HIERARCHY } from '../../modules/rbac/permissions.js';

/**
 * Represents a connected participant in a watch party room.
 *
 * Encapsulates user identity, current role, socket binding, and
 * permission queries. Replaces the scattered `socket.data.*` and
 * `user.*` lookups throughout the gateway.
 */
export class Participant {
  private _role: RoomRole;
  private _nickname: string | null;

  constructor(
    /** Internal user ID (database UUID) */
    public readonly userId: string,
    /** Clerk external user ID */
    public readonly clerkUserId: string | null,
    /** Socket.IO socket ID for this connection */
    public readonly socketId: string,
    /** User's display name (from auth provider) */
    public readonly displayName: string | null,
    /** User's email address */
    public readonly email: string | null,
    /** User's avatar URL */
    public readonly avatarUrl: string | null,
    /** Initial role when joining the room */
    role: RoomRole,
    /** Whether this participant is the room owner */
    public readonly isOwner: boolean,
    /** Optional room-specific nickname */
    nickname?: string | null,
  ) {
    this._role = role;
    this._nickname = nickname ?? null;
  }

  // ─── Accessors ──────────────────────────────────────────────────

  /** Current role in the room */
  get role(): RoomRole {
    return this._role;
  }

  /** Room-specific nickname */
  get nickname(): string | null {
    return this._nickname;
  }

  // ─── Role Management ───────────────────────────────────────────

  /**
   * Promote or demote this participant to a new role.
   * @param newRole The target role to assign.
   */
  public promote(newRole: RoomRole): void {
    this._role = newRole;
  }

  /**
   * Update this participant's room nickname.
   */
  public setNickname(nickname: string): void {
    this._nickname = nickname;
  }

  /**
   * Check if this participant's role is at least as high as the target.
   */
  public hasRoleAtLeast(targetRole: RoomRole): boolean {
    return (ROLE_HIERARCHY[this._role] ?? 0) >= (ROLE_HIERARCHY[targetRole] ?? 0);
  }

  // ─── Permission Queries ────────────────────────────────────────

  /**
   * Check if this participant can perform a specific action.
   * Delegates to the RBAC policy engine with the participant's current role.
   */
  public can(
    permission: Permission,
    settings: Partial<RoomSettingsSnapshot> | null | undefined,
    rbacEngine: IRbacPolicyEngine,
  ): boolean {
    // HOST (owner) always has absolute permissions
    if (this.isOwner) return true;
    return rbacEngine.can(this._role, settings, permission);
  }

  // ─── Display Name Resolution ───────────────────────────────────

  /**
   * Resolve the best display name for this participant using the fallback chain:
   * nickname → displayName → email prefix → 'Member'
   */
  public resolveDisplayName(): string {
    return (
      this._nickname ||
      this.displayName ||
      (this.email ? this.email.split('@')[0] : null) ||
      'Member'
    );
  }

  // ─── Serialization ────────────────────────────────────────────

  /**
   * Serialize to a member_joined / member_left event payload.
   */
  public toMemberPayload(): { userId: string; role: string; displayName: string | null } {
    return {
      userId: this.userId,
      role: this._role,
      displayName: this.resolveDisplayName(),
    };
  }

  /**
   * Serialize to a chat message sender payload.
   */
  public toChatSenderPayload(): {
    senderId: string;
    senderName: string;
    userNickname: string;
    userRole: string;
    userAvatar: string | null;
  } {
    const name = this.resolveDisplayName();
    return {
      senderId: this.userId,
      senderName: name,
      userNickname: name,
      userRole: this._role,
      userAvatar: this.avatarUrl,
    };
  }

  // ─── Factory ──────────────────────────────────────────────────

  /**
   * Create a Participant from raw auth context and socket data.
   */
  public static fromAuthContext(
    user: { id: string; clerkUserId?: string | null; displayName?: string | null; email?: string | null; avatarUrl?: string | null },
    socketId: string,
    role: RoomRole,
    isOwner: boolean,
    nickname?: string | null,
  ): Participant {
    return new Participant(
      user.id,
      user.clerkUserId ?? null,
      socketId,
      user.displayName ?? null,
      user.email ?? null,
      user.avatarUrl ?? null,
      role,
      isOwner,
      nickname,
    );
  }
}
