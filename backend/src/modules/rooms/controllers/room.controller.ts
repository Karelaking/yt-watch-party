import type { Request, Response } from 'express';
import { BaseController } from '../../../core/interfaces/index.js';
import type { IRoomService } from '../services/room.service.js';
import type { CreateRoomDto, UpdateRoomDto, UpdateSettingsDto } from '../dtos/room.dto.js';
import { UnauthorizedError } from '../../../core/errors/index.js';

export class RoomController extends BaseController {
  constructor(private readonly roomService: IRoomService) {
    super();
  }

  public createRoom = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await this.roomService.createRoom(req.user.id, req.body as CreateRoomDto);
    return this.created(res, result, 'Room created successfully');
  });

  public getByCode = this.catchAsync(async (req: Request, res: Response) => {
    const code = req.params['code'] as string;
    const result = await this.roomService.getRoomByCode(code, req.user?.id);
    return this.ok(res, result);
  });

  public getById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params['id'] as string;
    const result = await this.roomService.getRoomById(id, req.user?.id);
    return this.ok(res, result);
  });

  public listPublic = this.catchAsync(async (req: Request, res: Response) => {
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 20;
    const offset = req.query['offset'] ? parseInt(req.query['offset'] as string, 10) : 0;
    const rooms = await this.roomService.listPublicRooms(limit, offset);
    return this.ok(res, rooms);
  });

  public listMyRooms = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const rooms = await this.roomService.listUserRooms(req.user.id);
    return this.ok(res, rooms);
  });

  public updateRoom = this.catchAsync(async (req: Request, res: Response) => {
    const roomId = req.params['id'] as string;
    const updated = await this.roomService.updateRoom(roomId, req.body as UpdateRoomDto);
    return this.ok(res, updated, 'Room updated successfully');
  });

  public updateSettings = this.catchAsync(async (req: Request, res: Response) => {
    const roomId = req.params['id'] as string;
    const updated = await this.roomService.updateSettings(roomId, req.body as UpdateSettingsDto);
    return this.ok(res, updated, 'Room settings updated successfully');
  });

  public endRoom = this.catchAsync(async (req: Request, res: Response) => {
    const roomId = req.params['id'] as string;
    await this.roomService.endRoom(roomId);
    return this.ok(res, { ended: true }, 'Room ended successfully');
  });
}
