import mongoose, { type Mongoose } from 'mongoose';
import { getEnv } from './env';
import { logger } from './logger';

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var __avantikaMongoose: MongooseCache | undefined;
}

const cache: MongooseCache =
  globalThis.__avantikaMongoose ?? { conn: null, promise: null };

globalThis.__avantikaMongoose = cache;

export async function connectDB(): Promise<Mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const env = getEnv();

    mongoose.set('strictQuery', true);

    mongoose.set('strict', 'throw');

    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB_NAME,
        maxPoolSize: 10,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        retryWrites: true,
      })
      .then((m) => {
        logger.info({ db: env.MONGODB_DB_NAME }, 'MongoDB connected');
        return m;
      })
      .catch((err) => {
        cache.promise = null;
        logger.error({ err }, 'MongoDB connection failed');
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>,
): Promise<T> {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
}

export async function disconnectDB(): Promise<void> {
  if (cache.conn) {
    await cache.conn.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}

export { mongoose };
