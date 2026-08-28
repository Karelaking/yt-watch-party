import { z } from 'zod';

export const createPlaylistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const addPlaylistItemSchema = z.object({
  url: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaId: z.string().uuid().optional(),
  title: z.string().max(150).optional(),
}).refine((data) => data.url || data.mediaUrl || data.mediaId, {
  message: 'Either url, mediaUrl, or mediaId must be provided',
});

export const reorderPlaylistSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
});

export type CreatePlaylistDto = z.infer<typeof createPlaylistSchema>;
export type AddPlaylistItemDto = z.infer<typeof addPlaylistItemSchema>;
export type ReorderPlaylistDto = z.infer<typeof reorderPlaylistSchema>;
