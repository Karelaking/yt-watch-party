import { z } from 'zod';

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  avatarUrl: z.string().url().optional(),
});

export const recordDeviceSchema = z.object({
  deviceType: z.enum(['WEB', 'MOBILE', 'TABLET', 'DESKTOP', 'UNKNOWN']).default('WEB'),
  deviceName: z.string().max(100).optional(),
  browser: z.string().max(50).optional(),
  operatingSystem: z.string().max(50).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type RecordDeviceDto = z.infer<typeof recordDeviceSchema>;
