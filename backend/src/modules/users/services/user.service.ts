import type { IUserRepository, IUserDeviceRepository, UserEntity } from '../repositories/user.repository.interface.js';
import type { UpdateUserDto, RecordDeviceDto } from '../dtos/user.dto.js';
import { NotFoundError, ConflictError } from '../../../core/errors/index.js';
import type { IService } from '../../../core/interfaces/index.js';

export interface IUserService extends IService {
  getProfile(userId: string): Promise<UserEntity>;
  updateProfile(userId: string, data: UpdateUserDto): Promise<UserEntity>;
  recordUserDevice(userId: string, data: RecordDeviceDto, ip?: string): Promise<void>;
}

export class UserService implements IUserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDeviceRepository: IUserDeviceRepository
  ) {}

  public async getProfile(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  public async updateProfile(userId: string, data: UpdateUserDto): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (data.username && data.username !== user.username) {
      // Check username uniqueness if needed
      const existing = await this.userRepository.findByClerkId(data.username);
      if (existing && existing.id !== userId) {
        throw new ConflictError('Username is already taken');
      }
    }

    const updated = await this.userRepository.update(userId, data);
    if (!updated) {
      throw new NotFoundError('Failed to update user profile');
    }
    return updated;
  }

  public async recordUserDevice(userId: string, data: RecordDeviceDto, ip?: string): Promise<void> {
    await this.userDeviceRepository.recordDevice({
      userId,
      deviceType: data.deviceType,
      deviceName: data.deviceName,
      browser: data.browser,
      operatingSystem: data.operatingSystem,
      lastIpHash: ip ? Buffer.from(ip).toString('base64') : null,
    });
  }
}
