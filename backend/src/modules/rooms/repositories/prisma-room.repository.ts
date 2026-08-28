import { prisma as defaultPrisma, type PrismaClient } from '../../../infrastructure/database/prisma.js';
import type {
  IRoomRepository,
  IRoomSettingsRepository,
  RoomEntity,
  RoomSettingsEntity,
  CreateRoomData,
  UpdateRoomData,
} from './room.repository.interface.js';
import type { RoomSettingsSnapshot } from '../../rbac/permissions.js';

export class PrismaRoomRepository implements IRoomRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async findById(id: string): Promise<RoomEntity | null> {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });
    if (!room) return null;

    const owner = room.ownerId
      ? await this.prisma.user.findUnique({ where: { id: room.ownerId } })
      : null;

    return {
      ...room,
      owner: owner || null,
    } as unknown as RoomEntity;
  }

  public async findByCode(code: string): Promise<RoomEntity | null> {
    const room = await this.prisma.room.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!room) return null;

    const owner = room.ownerId
      ? await this.prisma.user.findUnique({ where: { id: room.ownerId } })
      : null;

    return {
      ...room,
      owner: owner || null,
    } as unknown as RoomEntity;
  }

  public async findBySlug(slug: string): Promise<RoomEntity | null> {
    const room = await this.prisma.room.findUnique({
      where: { slug },
    });
    if (!room) return null;

    const owner = room.ownerId
      ? await this.prisma.user.findUnique({ where: { id: room.ownerId } })
      : null;

    return {
      ...room,
      owner: owner || null,
    } as unknown as RoomEntity;
  }

  public async listPublic(limit: number = 20, offset: number = 0): Promise<RoomEntity[]> {
    try {
      const rooms = await this.prisma.room.findMany({
        where: { visibility: 'PUBLIC', status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      if (!rooms || !Array.isArray(rooms)) return [];

      const enriched = await Promise.all(
        rooms.map(async (room: any) => {
          try {
            const [owner, media, rawMemberships] = await Promise.all([
              room.ownerId
                ? this.prisma.user.findUnique({ where: { id: room.ownerId } })
                : null,
              this.prisma.media.findMany({
                where: { roomId: room.id },
                take: 5,
              }),
              this.prisma.roomMembership.findMany({
                where: { roomId: room.id, status: 'ACTIVE' },
              }),
            ]);

            const memberships = await Promise.all(
              (rawMemberships || []).map(async (m: any) => {
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
                        username: u.username,
                        avatarUrl: u.avatarUrl,
                        email: u.email,
                        status: u.status,
                      }
                    : null,
                };
              })
            );

            return {
              ...room,
              owner: owner || null,
              media: media || [],
              memberships: memberships || [],
            };
          } catch (enrichErr) {
            console.warn('[listPublic] Room enrichment fallback:', enrichErr);
            return {
              ...room,
              owner: null,
              media: [],
              memberships: [],
            };
          }
        })
      );

      return enriched as unknown as RoomEntity[];
    } catch (err) {
      console.error('[PrismaRoomRepository.listPublic Error]:', err);
      return [];
    }
  }

  public async listUserRooms(userId: string): Promise<RoomEntity[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const clerkId = user?.clerkUserId;

    const memberships = await this.prisma.roomMembership.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    const memberRoomIds = memberships.map((m: any) => m.roomId);

    const [ownedRooms, memberRooms] = await Promise.all([
      this.prisma.room.findMany({
        where: {
          OR: [
            { ownerId: userId, status: 'ACTIVE' },
            ...(clerkId ? [{ ownerId: clerkId, status: 'ACTIVE' }] : []),
          ],
        },
      }),
      memberRoomIds.length > 0
        ? Promise.all(
            memberRoomIds.map(async (rid: string) => {
              return this.prisma.room.findUnique({ where: { id: rid } });
            })
          )
        : [],
    ]);

    const allRoomMap = new Map<string, any>();
    for (const r of [...ownedRooms, ...(memberRooms || []).filter(Boolean)]) {
      if (r && r.status === 'ACTIVE') {
        allRoomMap.set(r.id, r);
      }
    }
    const allRooms = Array.from(allRoomMap.values());

    const enriched = await Promise.all(
      allRooms.map(async (room: any) => {
        try {
          const [owner, media, rawMemberships] = await Promise.all([
            room.ownerId
              ? this.prisma.user.findUnique({ where: { id: room.ownerId } })
              : null,
            this.prisma.media.findMany({
              where: { roomId: room.id },
              take: 5,
            }),
            this.prisma.roomMembership.findMany({
              where: { roomId: room.id, status: 'ACTIVE' },
            }),
          ]);

          const roomMemberships = await Promise.all(
            (rawMemberships || []).map(async (m: any) => {
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
                      username: u.username,
                      avatarUrl: u.avatarUrl,
                      email: u.email,
                      status: u.status,
                    }
                  : null,
              };
            })
          );

          return {
            ...room,
            owner: owner || null,
            media: media || [],
            memberships: roomMemberships || [],
          };
        } catch {
          return {
            ...room,
            owner: null,
            media: [],
            memberships: [],
          };
        }
      })
    );

    return enriched as unknown as RoomEntity[];
  }


  public async create(data: CreateRoomData): Promise<RoomEntity> {
    const room = await this.prisma.room.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description ?? null,
        slug: data.slug ?? null,
        ownerId: data.ownerId,
        visibility: data.visibility ?? 'PRIVATE',
        maxMembers: data.maxMembers ?? 50,
        discoverable: data.discoverable ?? false,
        status: 'ACTIVE',
        memberships: {
          create: {
            userId: data.ownerId,
            role: 'HOST',
            status: 'ACTIVE',
          },
        },
        playbackState: {
          create: {
            position: 0,
            isPlaying: false,
            playbackRate: 1.0,
            version: 0n,
          },
        },
      },
    });
    return room as RoomEntity;
  }

  public async update(id: string, data: UpdateRoomData): Promise<RoomEntity | null> {
    const updated = await this.prisma.room.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        description: data.description !== undefined ? data.description : undefined,
        slug: data.slug !== undefined ? data.slug : undefined,
        visibility: data.visibility !== undefined ? data.visibility : undefined,
        maxMembers: data.maxMembers !== undefined ? data.maxMembers : undefined,
        discoverable: data.discoverable !== undefined ? data.discoverable : undefined,
        status: data.status !== undefined ? data.status : undefined,
        endedAt: data.endedAt !== undefined ? data.endedAt : undefined,
        archivedAt: data.archivedAt !== undefined ? data.archivedAt : undefined,
      },
    });
    return (updated as RoomEntity) || null;
  }

  public async delete(id: string): Promise<boolean> {
    try {
      // 1. Delete associated playlist items first, then playlists
      const playlists = await this.prisma.playlist.findMany({ where: { roomId: id } });
      for (const pl of playlists) {
        await this.prisma.playlistItem.deleteMany({ where: { playlistId: pl.id } });
      }
      await this.prisma.playlist.deleteMany({ where: { roomId: id } });

      // 2. Cascade delete all relational dependencies in PostgreSQL
      await Promise.allSettled([
        this.prisma.media.deleteMany({ where: { roomId: id } }),
        this.prisma.playbackState.deleteMany({ where: { roomId: id } }),
        this.prisma.playbackHistory.deleteMany({ where: { roomId: id } }),
        this.prisma.roomSettings.deleteMany({ where: { roomId: id } }),
        this.prisma.roomMembership.deleteMany({ where: { roomId: id } }),
        this.prisma.roomBan.deleteMany({ where: { roomId: id } }),
        this.prisma.roomInvitation.deleteMany({ where: { roomId: id } }),
        this.prisma.watchSession.deleteMany({ where: { roomId: id } }),
        this.prisma.screenShareSession.deleteMany({ where: { roomId: id } }),
        this.prisma.roomEvent.deleteMany({ where: { roomId: id } }),
      ]);

      // 3. Hard delete room from PostgreSQL
      await this.prisma.room.delete({
        where: { id },
      });

      return true;
    } catch (err) {
      console.error('[PrismaRoomRepository.delete Error]:', err);
      // Soft-delete fallback
      try {
        await this.prisma.room.update({
          where: { id },
          data: {
            status: 'ENDED',
            endedAt: new Date(),
          },
        });
        return true;
      } catch {
        return false;
      }
    }
  }
}

export class PrismaRoomSettingsRepository implements IRoomSettingsRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async findByRoomId(roomId: string): Promise<RoomSettingsEntity | null> {
    const settings = await this.prisma.roomSettings.findUnique({
      where: { roomId },
    });
    return (settings as RoomSettingsEntity) || null;
  }

  public async create(roomId: string, settings?: Partial<RoomSettingsSnapshot>): Promise<RoomSettingsEntity> {
    const created = await this.prisma.roomSettings.create({
      data: {
        roomId,
        allowGuestJoin: settings?.allowGuestJoin ?? false,
        requireApprovalToJoin: settings?.requireApprovalToJoin ?? false,
        allowMemberInvite: settings?.allowMemberInvite ?? true,
        allowChat: settings?.allowChat ?? true,
        slowModeSeconds: settings?.slowModeSeconds ?? 0,
        allowScreenShare: settings?.allowScreenShare ?? true,
        syncPlayback: settings?.syncPlayback ?? true,
        autoplayNext: settings?.autoplayNext ?? true,
        onlyHostCanControlPlayback: settings?.onlyHostCanControlPlayback ?? false,
        allowModeratorPlaybackControl: settings?.allowModeratorPlaybackControl ?? true,
        allowPlaylistControl: settings?.allowPlaylistControl ?? true,
        onlyHostCanManagePlaylist: settings?.onlyHostCanManagePlaylist ?? false,
        disconnectOnHostLeave: settings?.disconnectOnHostLeave ?? false,
        autoArchive: false,
        autoArchiveAfterMinutes: null,
      },
    });
    return created as RoomSettingsEntity;
  }

  public async update(roomId: string, settings: Partial<RoomSettingsSnapshot>): Promise<RoomSettingsEntity | null> {
    const updated = await this.prisma.roomSettings.update({
      where: { roomId },
      data: {
        allowGuestJoin: settings.allowGuestJoin !== undefined ? settings.allowGuestJoin : undefined,
        requireApprovalToJoin: settings.requireApprovalToJoin !== undefined ? settings.requireApprovalToJoin : undefined,
        allowMemberInvite: settings.allowMemberInvite !== undefined ? settings.allowMemberInvite : undefined,
        allowChat: settings.allowChat !== undefined ? settings.allowChat : undefined,
        slowModeSeconds: settings.slowModeSeconds !== undefined ? settings.slowModeSeconds : undefined,
        allowScreenShare: settings.allowScreenShare !== undefined ? settings.allowScreenShare : undefined,
        syncPlayback: settings.syncPlayback !== undefined ? settings.syncPlayback : undefined,
        autoplayNext: settings.autoplayNext !== undefined ? settings.autoplayNext : undefined,
        onlyHostCanControlPlayback: settings.onlyHostCanControlPlayback !== undefined ? settings.onlyHostCanControlPlayback : undefined,
        allowModeratorPlaybackControl: settings.allowModeratorPlaybackControl !== undefined ? settings.allowModeratorPlaybackControl : undefined,
        allowPlaylistControl: settings.allowPlaylistControl !== undefined ? settings.allowPlaylistControl : undefined,
        onlyHostCanManagePlaylist: settings.onlyHostCanManagePlaylist !== undefined ? settings.onlyHostCanManagePlaylist : undefined,
        disconnectOnHostLeave: settings.disconnectOnHostLeave !== undefined ? settings.disconnectOnHostLeave : undefined,
      },
    });
    return (updated as RoomSettingsEntity) || null;
  }
}
