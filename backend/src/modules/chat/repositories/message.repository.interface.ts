import type { IRepository } from '../../../core/interfaces/index.js';

export interface MessageEntity {
  id: string;
  roomId: string;
  senderId: string;
  message: string;
  type: 'TEXT' | 'SYSTEM' | 'MEDIA';
  replyToMessageId?: string;
  mentions?: string[];
  metadata?: Record<string, unknown>;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageData {
  roomId: string;
  senderId: string;
  message: string;
  type?: 'TEXT' | 'SYSTEM' | 'MEDIA';
  replyToMessageId?: string;
  mentions?: string[];
  metadata?: Record<string, unknown>;
}

export interface ListMessagesOptions {
  limit?: number;
  beforeCursor?: string; // ISO date string or message ID
}

export interface IMessageRepository extends IRepository<MessageEntity> {
  create(data: CreateMessageData): Promise<MessageEntity>;
  findById(id: string): Promise<MessageEntity | null>;
  listByRoom(roomId: string, options?: ListMessagesOptions): Promise<{ messages: MessageEntity[]; nextCursor: string | null }>;
  edit(id: string, senderId: string, newMessage: string): Promise<MessageEntity | null>;
  softDelete(id: string, senderId: string): Promise<boolean>;
  deleteByRoom(roomId: string): Promise<number>;
}
