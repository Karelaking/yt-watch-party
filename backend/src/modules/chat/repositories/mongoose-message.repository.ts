import { Message, type IMessage } from '../models/message.model.js';
import type {
  IMessageRepository,
  MessageEntity,
  CreateMessageData,
  ListMessagesOptions,
} from './message.repository.interface.js';

export class MongooseMessageRepository implements IMessageRepository {
  private mapDocument(doc: IMessage): MessageEntity {
    return {
      id: doc._id.toString(),
      roomId: doc.roomId,
      senderId: doc.senderId,
      message: doc.message,
      type: doc.type,
      replyToMessageId: doc.replyToMessageId,
      mentions: doc.mentions,
      metadata: doc.metadata,
      editedAt: doc.editedAt,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async create(data: CreateMessageData): Promise<MessageEntity> {
    const messageDoc = await Message.create({
      roomId: data.roomId,
      senderId: data.senderId,
      message: data.message,
      type: data.type ?? 'TEXT',
      replyToMessageId: data.replyToMessageId,
      mentions: data.mentions ?? [],
      metadata: data.metadata,
    });

    return this.mapDocument(messageDoc);
  }

  public async findById(id: string): Promise<MessageEntity | null> {
    const doc = await Message.findById(id).exec();
    return doc ? this.mapDocument(doc) : null;
  }

  public async listByRoom(
    roomId: string,
    options: ListMessagesOptions = {}
  ): Promise<{ messages: MessageEntity[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(1, options.limit ?? 50), 100);

    const query: Record<string, unknown> = {
      roomId,
      deletedAt: { $exists: false },
    };

    if (options.beforeCursor) {
      query['createdAt'] = { $lt: new Date(options.beforeCursor) };
    }

    const docs = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .exec();

    let nextCursor: string | null = null;
    let resultDocs = docs;

    if (docs.length > limit) {
      nextCursor = docs[limit - 1]!.createdAt.toISOString();
      resultDocs = docs.slice(0, limit);
    }

    return {
      messages: resultDocs.map((d) => this.mapDocument(d)),
      nextCursor,
    };
  }

  public async edit(id: string, senderId: string, newMessage: string): Promise<MessageEntity | null> {
    const updated = await Message.findOneAndUpdate(
      { _id: id, senderId, deletedAt: { $exists: false } },
      {
        $set: {
          message: newMessage,
          editedAt: new Date(),
        },
      },
      { new: true }
    ).exec();

    return updated ? this.mapDocument(updated) : null;
  }

  public async softDelete(id: string, senderId: string): Promise<boolean> {
    const result = await Message.updateOne(
      { _id: id, senderId, deletedAt: { $exists: false } },
      { $set: { deletedAt: new Date() } }
    ).exec();

    return result.modifiedCount > 0;
  }

  public async deleteByRoom(roomId: string): Promise<number> {
    const result = await Message.deleteMany({ roomId }).exec();
    return result.deletedCount || 0;
  }
}
