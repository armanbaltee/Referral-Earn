import mongoose from 'mongoose';

import { env } from './env.js';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    console.info('📦 Using existing MongoDB connection');
    return;
  }

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGODB_URI, {
      dbName: 'chainx',
    });

    isConnected = true;
    console.info('✅ MongoDB connected successfully');

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('error', (err: Error) => {
      console.error('❌ MongoDB connection error:', err.message);
      isConnected = false;
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }
  await mongoose.disconnect();
  isConnected = false;
  console.info('📦 MongoDB disconnected');
}

export function getDatabaseStatus(): { connected: boolean; readyState: number } {
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
  };
}
