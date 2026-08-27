import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IMessage extends Document {
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

const MessageSchema = new Schema<IMessage>(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },

    senderId: {
      type: String,
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      maxlength: 4000,
    },

    type: {
      type: String,
      enum: ['TEXT', 'SYSTEM', 'MEDIA'],
      default: 'TEXT',
    },

    replyToMessageId: {
      type: String,
    },

    mentions: [
      {
        type: String,
      },
    ],

    metadata: {
      type: Schema.Types.Mixed,
    },

    editedAt: {
      type: Date,
    },

    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Cursor pagination index (important for large rooms)
MessageSchema.index({
  roomId: 1,
  createdAt: -1,
});

MessageSchema.index({
  roomId: 1,
  senderId: 1,
  createdAt: -1,
});

export const Message: Model<IMessage> =
  (mongoose.models['Message'] as Model<IMessage>) ||
  mongoose.model<IMessage>('Message', MessageSchema);
