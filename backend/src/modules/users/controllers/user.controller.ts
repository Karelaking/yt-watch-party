import type { Request, Response } from 'express';
import { BaseController } from '../../../core/interfaces/index.js';
import type { IUserService } from '../services/user.service.js';
import type { UpdateUserDto, RecordDeviceDto } from '../dtos/user.dto.js';
import { UnauthorizedError } from '../../../core/errors/index.js';

export class UserController extends BaseController {
  constructor(private readonly userService: IUserService) {
    super();
  }

  public getMe = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const profile = await this.userService.getProfile(req.user.id);
    return this.ok(res, profile);
  });

  public updateMe = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const updated = await this.userService.updateProfile(req.user.id, req.body as UpdateUserDto);
    return this.ok(res, updated, 'Profile updated successfully');
  });

  public recordDevice = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const ip = req.ip || req.socket.remoteAddress;
    await this.userService.recordUserDevice(req.user.id, req.body as RecordDeviceDto, ip);
    return this.ok(res, { recorded: true }, 'Device recorded successfully');
  });
}
