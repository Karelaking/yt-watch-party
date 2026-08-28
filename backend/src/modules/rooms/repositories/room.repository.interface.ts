import type { IRepository } from '../../../core/interfaces/index.js';
import type { RoomSettingsSnapshot } from '../../rbac/permissions.js';

export type RoomStatus = 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED';
export type RoomVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

export interface RoomEntity {
  id: string;
  code: string;
  slug: string | null;
  name: string;
  description: string | null;
  ownerId: string;
  status: RoomStatus;
  visibility: RoomVisibility;
  maxMembers: number;
  discoverable: boolean;
  createdAt: Date;
  updatedAt: Date;
  endedAt: Date | null;
  archivedAt: Date | null;
}

export interface RoomSettingsEntity extends RoomSettingsSnapshot {
  id: string;
  roomId: string;
  autoArchive: boolean;
  autoArchiveAfterMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoomData {
  name: string;
  description?: string | null;
  code: string;
  slug?: string | null;
  ownerId: string;
  visibility?: RoomVisibility;
  maxMembers?: number;
  discoverable?: boolean;
}

export interface UpdateRoomData {
  name?: string;
  description?: string | null;
  slug?: string | null;
  visibility?: RoomVisibility;
  maxMembers?: number;
  discoverable?: boolean;
  ownerId?: string;
  status?: RoomStatus;
  endedAt?: Date | null;
  archivedAt?: Date | null;
}

export interface IRoomRepository extends IRepository<RoomEntity> {
  findById(id: string): Promise<RoomEntity | null>;
  findByCode(code: string): Promise<RoomEntity | null>;
  findBySlug(slug: string): Promise<RoomEntity | null>;
  listPublic(limit?: number, offset?: number): Promise<RoomEntity[]>;
  listUserRooms(userId: string): Promise<RoomEntity[]>;
  create(data: CreateRoomData): Promise<RoomEntity>;
  update(id: string, data: UpdateRoomData): Promise<RoomEntity | null>;
  delete(id: string): Promise<boolean>;
}

export interface IRoomSettingsRepository extends IRepository<RoomSettingsEntity> {
  findByRoomId(roomId: string): Promise<RoomSettingsEntity | null>;
  create(roomId: string, settings?: Partial<RoomSettingsSnapshot>): Promise<RoomSettingsEntity>;
  update(roomId: string, settings: Partial<RoomSettingsSnapshot>): Promise<RoomSettingsEntity | null>;
}
