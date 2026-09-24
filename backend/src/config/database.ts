import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(): Promise<void> {
  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new Error('MongoDB no estÃ¡ configurado');
  }

  try {
    await mongoose.connect(uri, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 20,
      minPoolSize: 0,
      maxConnecting: 2,
      waitQueueTimeoutMS: 5000,
      maxIdleTimeMS: 60000
    });
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB no disponible');
    await db.admin().command({ ping: 1 });
  } catch {
    await mongoose.disconnect().catch(() => undefined);
    throw new Error('MongoDB no disponible');
  }
}

export async function isDatabaseReady(): Promise<boolean> {
  if (mongoose.connection.readyState !== 1) return false;
  const db = mongoose.connection.db;
  if (!db) return false;
  try {
    await db.admin().command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}
