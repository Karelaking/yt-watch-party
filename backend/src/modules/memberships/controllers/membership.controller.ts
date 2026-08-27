import type { Request, Response } from 'express';
import { BaseController } from '../../../core/interfaces/index.js';
import type { IMembershipService } from '../services/membership.service.js';
import type { JoinRoomDto, ChangeRoleDto, KickMemberDto, BanMemberDto } from '../dtos/membership.dto.js';
import { UnauthorizedError } from '../../../core/errors/index.js';

export class MembershipController extends BaseController {
  constructor(private readonly membershipService: IMembershipService) {
    super();
  }

  public joinRoom = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const { code, nickname } = req.body as JoinRoomDto;
    const membership = await this.membershipService.joinRoom(req.user.id, code, nickname);
    return this.created(res, membership, 'Joined room successfully');
  });

  public leaveRoom = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const roomId = req.params['roomId'] as string;
    await this.membershipService.leaveRoom(req.user.id, roomId);
    return this.ok(res, { left: true }, 'Left room successfully');
  });

  public listMembers = this.catchAsync(async (req: Request, res: Response) => {
    const roomId = req.params['roomId'] as string;
    const members = await this.membershipService.listMembers(roomId);
    return this.ok(res, members);
  });

  public changeRole = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const roomId = req.params['roomId'] as string;
    const { targetUserId, role, reason } = req.body as ChangeRoleDto;
    const updated = await this.membershipService.changeRole(roomId, targetUserId, role, req.user.id, reason);
    return this.ok(res, updated, 'Member role updated successfully');
  });

  public kickMember = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const roomId = req.params['roomId'] as string;
    const { targetUserId } = req.body as KickMemberDto;
    await this.membershipService.kickMember(roomId, targetUserId, req.user.id);
    return this.ok(res, { kicked: true }, 'Member removed from room');
  });

  public banMember = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const roomId = req.params['roomId'] as string;
    const { targetUserId, reason, expiresAt } = req.body as BanMemberDto;
    const ban = await this.membershipService.banMember(roomId, targetUserId, req.user.id, reason, expiresAt);
    return this.ok(res, ban, 'Member banned from room');
  });

  public unbanMember = this.catchAsync(async (req: Request, res: Response) => {
    const roomId = req.params['roomId'] as string;
    const targetUserId = req.params['userId'] as string;
    await this.membershipService.unbanMember(roomId, targetUserId);
    return this.ok(res, { unbanned: true }, 'Member unbanned successfully');
  });

  public listBans = this.catchAsync(async (req: Request, res: Response) => {
    const roomId = req.params['roomId'] as string;
    const bans = await this.membershipService.listBans(roomId);
    return this.ok(res, bans);
  });
}
