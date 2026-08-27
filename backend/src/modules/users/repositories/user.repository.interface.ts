import type { IRepository } from '../../../core/interfaces/index.js';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type DeviceType = 'WEB' | 'MOBILE' | 'TABLET' | 'DESKTOP' | 'UNKNOWN';

export interface UserEntity {
  id: string;
  clerkUserId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateUserData {
  id?: string;
  clerkUserId: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  status?: UserStatus;
}

export interface UpdateUserData {
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  status?: UserStatus;
  deletedAt?: Date | null;
}

export interface IUserRepository extends IRepository<UserEntity> {
  findById(id: string): Promise<UserEntity | null>;
  findByClerkId(clerkUserId: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  update(id: string, data: UpdateUserData): Promise<UserEntity | null>;
  updateByClerkId(clerkUserId: string, data: UpdateUserData): Promise<UserEntity | null>;
  delete(id: string): Promise<boolean>;
}

export interface IUserDeviceRepository extends IRepository {
  recordDevice(data: {
    userId: string;
    deviceType?: DeviceType;
    deviceName?: string | null;
    browser?: string | null;
    operatingSystem?: string | null;
    lastIpHash?: string | null;
  }): Promise<void>;
}
