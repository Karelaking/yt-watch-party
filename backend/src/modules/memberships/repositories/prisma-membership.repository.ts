import { prisma as defaultPrisma, type PrismaClient, toSafeDate } from '../../../infrastructure/database/prisma.js';
import type {
  IMembershipRepository,
  IBanRepository,
  IInvitationRepository,
  MembershipEntity,
  BanEntity,
  InvitationEntity,
} from './membership.repository.interface.js';
import type { RoomRole, MembershipStatus } from '../../rbac/permissions.js';

export class PrismaMembershipRepository implements IMembershipRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async findByRoomAndUser(roomId: string, userId: string): Promise<MembershipEntity | null> {
    const membership = await this.prisma.roomMembership.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });
    return (membership as MembershipEntity) || null;
  }

  public async listActiveRoomMembers(roomId: string): Promise<MembershipEntity[]> {
    const rawMembers = await this.prisma.roomMembership.findMany({
      where: { roomId, status: 'ACTIVE' },
      orderBy: { joinedAt: 'asc' },
    });

    const membersWithUser = await Promise.all(
      (rawMembers || []).map(async (m: any) => {
        const u = m.userId
          ? await this.prisma.user.findUnique({ where: { id: m.userId } })
          : null;
        return {
          ...m,
          user: u
            ? {
                id: u.id,
                clerkUserId: u.clerkUserId,
                displayName: u.displayName,
                avatarUrl: u.avatarUrl,
                username: u.username,
                email: u.email,
                status: u.status,
              }
            : null,
        };
      })
    );

    return membersWithUser as unknown as MembershipEntity[];
  }

  public async create(data: {
    roomId: string;
    userId: string;
    role?: RoomRole;
    nickname?: string | null;
  }): Promise<MembershipEntity> {
    const existing = await this.prisma.roomMembership.findUnique({
      where: {
        roomId_userId: {
          roomId: data.roomId,
          userId: data.userId,
        },
      },
    });

    const targetRole = existing ? (data.role ?? existing.role) : (data.role ?? 'PARTICIPANT');

    const membership = await this.prisma.roomMembership.upsert({
      where: {
        roomId_userId: {
          roomId: data.roomId,
          userId: data.userId,
        },
      },
      update: {
        status: 'ACTIVE',
        role: targetRole,
        nickname: data.nickname !== undefined ? data.nickname : undefined,
        leftAt: null,
        removedAt: null,
        joinedAt: new Date(),
      },
      create: {
        roomId: data.roomId,
        userId: data.userId,
        role: targetRole,
        nickname: data.nickname ?? null,
        status: 'ACTIVE',
      },
    });
    return membership as MembershipEntity;
  }

  public async updateRole(
    membershipId: string,
    newRole: RoomRole,
    changedById: string,
    reason?: string
  ): Promise<MembershipEntity | null> {
    const current = await this.prisma.roomMembership.findUnique({
      where: { id: membershipId },
    });
    if (!current) return null;

    const previousRole = current.role as RoomRole;

    const [updated] = await this.prisma.$transaction([
      this.prisma.roomMembership.update({
        where: { id: membershipId },
        data: { role: newRole },
      }),
      this.prisma.roleHistory.create({
        data: {
          membershipId,
          previousRole,
          newRole,
          changedById,
          reason: reason ?? null,
        },
      }),
    ]);

    return (updated as MembershipEntity) || null;
  }

  public async updateStatus(membershipId: string, status: MembershipStatus): Promise<MembershipEntity | null> {
    const updateData: Record<string, unknown> = { status };
    if (status === 'LEFT') updateData['leftAt'] = new Date();
    if (status === 'REMOVED' || status === 'BANNED') updateData['removedAt'] = new Date();

    const updated = await this.prisma.roomMembership.update({
      where: { id: membershipId },
      data: updateData,
    });
    return (updated as MembershipEntity) || null;
  }

  public async countActiveMembers(roomId: string): Promise<number> {
    return this.prisma.roomMembership.count({
      where: { roomId, status: 'ACTIVE' },
    });
  }
}

export class PrismaBanRepository implements IBanRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async findActiveBan(roomId: string, userId: string): Promise<BanEntity | null> {
    const ban = await this.prisma.roomBan.findFirst({
      where: {
        roomId,
        userId,
      },
    });

    if (!ban) return null;

    if (ban.expiresAt && toSafeDate(ban.expiresAt) < new Date()) {
      return null;
    }

    return ban as BanEntity;
  }

  public async createBan(data: {
    roomId: string;
    userId?: string | null;
    createdById: string;
    type?: 'USER' | 'IP' | 'DEVICE';
    reason?: string | null;
    expiresAt?: Date | null;
  }): Promise<BanEntity> {
    const created = await this.prisma.roomBan.create({
      data: {
        roomId: data.roomId,
        userId: data.userId ?? null,
        createdById: data.createdById,
        type: data.type ?? 'USER',
        reason: data.reason ?? null,
        expiresAt: data.expiresAt ?? null,
      },
    });
    return created as BanEntity;
  }

  public async removeBan(roomId: string, userId: string): Promise<boolean> {
    const ban = await this.prisma.roomBan.findFirst({
      where: { roomId, userId },
    });
    if (!ban) return false;

    await this.prisma.roomBan.delete({
      where: { id: ban.id },
    });
    return true;
  }

  public async listBans(roomId: string): Promise<BanEntity[]> {
    const bans = await this.prisma.roomBan.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
    return bans as unknown as BanEntity[];
  }
}

export class PrismaInvitationRepository implements IInvitationRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async createInvitation(data: {
    roomId: string;
    inviterId: string;
    inviteeId?: string | null;
    inviteeEmail?: string | null;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<InvitationEntity> {
    const created = await this.prisma.roomInvitation.create({
      data: {
        roomId: data.roomId,
        inviterId: data.inviterId,
        inviteeId: data.inviteeId ?? null,
        inviteeEmail: data.inviteeEmail ?? null,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        status: 'PENDING',
      },
    });
    return created as InvitationEntity;
  }

  public async findByTokenHash(tokenHash: string): Promise<InvitationEntity | null> {
    const invitation = await this.prisma.roomInvitation.findUnique({
      where: { tokenHash },
    });
    return (invitation as InvitationEntity) || null;
  }

  public async updateStatus(
    id: string,
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'REVOKED'
  ): Promise<InvitationEntity | null> {
    const updated = await this.prisma.roomInvitation.update({
      where: { id },
      data: {
        status,
        ...(status === 'ACCEPTED' ? { acceptedAt: new Date() } : {}),
      },
    });
    return (updated as InvitationEntity) || null;
  }
}
