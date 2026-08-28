import type { IRepository } from '../../../core/interfaces/index.js';
import type { RoomRole, MembershipStatus } from '../../rbac/permissions.js';

export type BanType = 'USER' | 'IP' | 'DEVICE';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'REVOKED';

export interface MembershipEntity {
  id: string;
  roomId: string;
  userId: string;
  role: RoomRole;
  status: MembershipStatus;
  nickname: string | null;
  joinedAt: Date;
  leftAt: Date | null;
  removedAt: Date | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BanEntity {
  id: string;
  roomId: string;
  userId: string | null;
  createdById: string;
  type: BanType;
  reason: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface InvitationEntity {
  id: string;
  roomId: string;
  inviterId: string;
  inviteeId: string | null;
  inviteeEmail: string | null;
  tokenHash: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

export interface IMembershipRepository extends IRepository<MembershipEntity> {
  findByRoomAndUser(roomId: string, userId: string): Promise<MembershipEntity | null>;
  listActiveRoomMembers(roomId: string): Promise<MembershipEntity[]>;
  create(data: { roomId: string; userId: string; role?: RoomRole; nickname?: string | null }): Promise<MembershipEntity>;
  updateRole(membershipId: string, newRole: RoomRole, changedById: string, reason?: string): Promise<MembershipEntity | null>;
  updateNickname(membershipId: string, nickname: string): Promise<MembershipEntity | null>;
  updateStatus(membershipId: string, status: MembershipStatus): Promise<MembershipEntity | null>;
  countActiveMembers(roomId: string): Promise<number>;
}

export interface IBanRepository extends IRepository<BanEntity> {
  findActiveBan(roomId: string, userId: string): Promise<BanEntity | null>;
  createBan(data: { roomId: string; userId?: string | null; createdById: string; type?: BanType; reason?: string | null; expiresAt?: Date | null }): Promise<BanEntity>;
  removeBan(roomId: string, userId: string): Promise<boolean>;
  listBans(roomId: string): Promise<BanEntity[]>;
}

export interface IInvitationRepository extends IRepository<InvitationEntity> {
  createInvitation(data: { roomId: string; inviterId: string; inviteeId?: string | null; inviteeEmail?: string | null; tokenHash: string; expiresAt: Date }): Promise<InvitationEntity>;
  findByTokenHash(tokenHash: string): Promise<InvitationEntity | null>;
  updateStatus(id: string, status: InvitationStatus): Promise<InvitationEntity | null>;
}
