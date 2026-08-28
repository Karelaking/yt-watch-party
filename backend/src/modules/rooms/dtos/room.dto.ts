import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes').optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).default('PRIVATE'),
  maxMembers: z.number().int().min(2).max(500).default(50),
  discoverable: z.boolean().default(false),
  settings: z.object({
    allowGuestJoin: z.boolean().optional(),
    requireApprovalToJoin: z.boolean().optional(),
    allowMemberInvite: z.boolean().optional(),
    allowChat: z.boolean().optional(),
    slowModeSeconds: z.number().int().min(0).max(300).optional(),
    allowScreenShare: z.boolean().optional(),
    syncPlayback: z.boolean().optional(),
    autoplayNext: z.boolean().optional(),
    onlyHostCanControlPlayback: z.boolean().optional(),
    allowModeratorPlaybackControl: z.boolean().optional(),
    allowPlaylistControl: z.boolean().optional(),
    onlyHostCanManagePlaylist: z.boolean().optional(),
    disconnectOnHostLeave: z.boolean().optional(),
  }).optional(),
});

export const updateRoomSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
  maxMembers: z.number().int().min(2).max(500).optional(),
  discoverable: z.boolean().optional(),
  ownerId: z.string().optional(),
});

export const updateSettingsSchema = z.object({
  allowGuestJoin: z.boolean().optional(),
  requireApprovalToJoin: z.boolean().optional(),
  allowMemberInvite: z.boolean().optional(),
  allowChat: z.boolean().optional(),
  slowModeSeconds: z.number().int().min(0).max(300).optional(),
  allowScreenShare: z.boolean().optional(),
  syncPlayback: z.boolean().optional(),
  autoplayNext: z.boolean().optional(),
  onlyHostCanControlPlayback: z.boolean().optional(),
  allowModeratorPlaybackControl: z.boolean().optional(),
  allowPlaylistControl: z.boolean().optional(),
  onlyHostCanManagePlaylist: z.boolean().optional(),
  disconnectOnHostLeave: z.boolean().optional(),
});

export const joinRoomSchema = z.object({
  code: z.string().min(4).max(12),
  nickname: z.string().max(50).optional(),
});

export type CreateRoomDto = z.infer<typeof createRoomSchema>;
export type UpdateRoomDto = z.infer<typeof updateRoomSchema>;
export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;
export type JoinRoomDto = z.infer<typeof joinRoomSchema>;
