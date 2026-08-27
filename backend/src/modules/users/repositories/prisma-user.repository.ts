import { prisma as defaultPrisma, type PrismaClient } from '../../../infrastructure/database/prisma.js';
import type {
  IUserRepository,
  IUserDeviceRepository,
  UserEntity,
  CreateUserData,
  UpdateUserData,
  DeviceType,
} from './user.repository.interface.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return (user as UserEntity) || null;
  }

  public async findByClerkId(clerkUserId: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
    });
    return (user as UserEntity) || null;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });
    return (user as UserEntity) || null;
  }

  public async create(data: CreateUserData): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        clerkUserId: data.clerkUserId,
        username: data.username ?? null,
        displayName: data.displayName ?? null,
        avatarUrl: data.avatarUrl ?? null,
        email: data.email ?? null,
        status: data.status ?? 'ACTIVE',
      },
    });
    return user as UserEntity;
  }

  public async update(id: string, data: UpdateUserData): Promise<UserEntity | null> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: data.username !== undefined ? data.username : undefined,
        displayName: data.displayName !== undefined ? data.displayName : undefined,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
        email: data.email !== undefined ? data.email : undefined,
        status: data.status !== undefined ? data.status : undefined,
        deletedAt: data.deletedAt !== undefined ? data.deletedAt : undefined,
      },
    });
    return (user as UserEntity) || null;
  }

  public async updateByClerkId(clerkUserId: string, data: UpdateUserData): Promise<UserEntity | null> {
    const user = await this.prisma.user.update({
      where: { clerkUserId },
      data: {
        username: data.username !== undefined ? data.username : undefined,
        displayName: data.displayName !== undefined ? data.displayName : undefined,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
        email: data.email !== undefined ? data.email : undefined,
        status: data.status !== undefined ? data.status : undefined,
        deletedAt: data.deletedAt !== undefined ? data.deletedAt : undefined,
      },
    });
    return (user as UserEntity) || null;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.prisma.user.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
    return !!result;
  }
}

export class PrismaUserDeviceRepository implements IUserDeviceRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async recordDevice(data: {
    userId: string;
    deviceType?: DeviceType;
    deviceName?: string | null;
    browser?: string | null;
    operatingSystem?: string | null;
    lastIpHash?: string | null;
  }): Promise<void> {
    await this.prisma.userDevice.create({
      data: {
        userId: data.userId,
        deviceType: data.deviceType ?? 'UNKNOWN',
        deviceName: data.deviceName ?? null,
        browser: data.browser ?? null,
        operatingSystem: data.operatingSystem ?? null,
        lastIpHash: data.lastIpHash ?? null,
        lastSeenAt: new Date(),
      },
    });
  }
}
