import mongoose from 'mongoose';
import { env } from '../../config/env.config.js';

let isConnected = false;

export async function connectMongoose(): Promise<typeof mongoose> {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  if (!env.MONGODB_URL) {
    console.warn('[MongoDB] MONGODB_URL not configured. Skipping Mongoose connection.');
    return mongoose;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URL, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('🍃 MongoDB connected successfully via Mongoose');

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB Error]:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB]: Disconnected from database');
      isConnected = false;
    });

    return mongoose;
  } catch (error) {
    console.error('[MongoDB Connection Error]:', error);
    throw error;
  }
}

export async function disconnectMongoose(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('🍃 MongoDB disconnected');
  }
}

export { mongoose };
