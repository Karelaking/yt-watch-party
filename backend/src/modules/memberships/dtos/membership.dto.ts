import { z } from 'zod';

export const joinRoomSchema = z.object({
  code: z.string().min(4).max(12),
  nickname: z.string().max(50).optional(),
});

export const changeRoleSchema = z.object({
  targetUserId: z.string().uuid(),
  role: z.enum(['HOST', 'MODERATOR', 'PARTICIPANT', 'VIEWER']),
  reason: z.string().max(250).optional(),
});

export const kickMemberSchema = z.object({
  targetUserId: z.string().uuid(),
});

export const banMemberSchema = z.object({
  targetUserId: z.string().uuid(),
  reason: z.string().max(250).optional(),
  expiresAt: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
});

export type JoinRoomDto = z.infer<typeof joinRoomSchema>;
export type ChangeRoleDto = z.infer<typeof changeRoleSchema>;
export type KickMemberDto = z.infer<typeof kickMemberSchema>;
export type BanMemberDto = z.infer<typeof banMemberSchema>;
