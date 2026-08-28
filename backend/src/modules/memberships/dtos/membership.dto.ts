import { z } from 'zod';

export const joinRoomSchema = z.object({
  code: z.string().min(4).max(12),
  nickname: z.string().max(50).optional(),
});

export const changeRoleSchema = z.object({
  targetUserId: z.string().optional(),
  userId: z.string().optional(),
  role: z.enum(['HOST', 'MODERATOR', 'PARTICIPANT', 'VIEWER']).optional(),
  newRole: z.enum(['HOST', 'MODERATOR', 'PARTICIPANT', 'VIEWER']).optional(),
  reason: z.string().max(250).optional(),
}).refine((d) => (d.targetUserId || d.userId) && (d.role || d.newRole), {
  message: 'targetUserId (or userId) and role (or newRole) are required',
});

export const kickMemberSchema = z.object({
  targetUserId: z.string().optional(),
  userId: z.string().optional(),
}).refine((d) => d.targetUserId || d.userId, {
  message: 'targetUserId or userId is required',
});

export const banMemberSchema = z.object({
  targetUserId: z.string().optional(),
  userId: z.string().optional(),
  reason: z.string().max(250).optional(),
  type: z.enum(['USER', 'IP', 'DEVICE']).optional(),
  expiresAt: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
}).refine((d) => d.targetUserId || d.userId, {
  message: 'targetUserId or userId is required',
});

export type JoinRoomDto = z.infer<typeof joinRoomSchema>;
export type ChangeRoleDto = z.infer<typeof changeRoleSchema>;
export type KickMemberDto = z.infer<typeof kickMemberSchema>;
export type BanMemberDto = z.infer<typeof banMemberSchema>;
