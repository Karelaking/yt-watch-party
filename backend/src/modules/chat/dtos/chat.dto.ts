import { z } from 'zod';

export const SendMessageSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  message: z.string().min(1, 'Message cannot be empty').max(4000, 'Message cannot exceed 4000 characters'),
  type: z.enum(['TEXT', 'SYSTEM', 'MEDIA']).default('TEXT'),
  replyToMessageId: z.string().optional(),
  mentions: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ListMessagesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export const EditMessageSchema = z.object({
  message: z.string().min(1).max(4000),
});

export type SendMessageDto = z.infer<typeof SendMessageSchema>;
export type ListMessagesQueryDto = z.infer<typeof ListMessagesQuerySchema>;
export type EditMessageDto = z.infer<typeof EditMessageSchema>;
