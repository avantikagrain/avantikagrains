/**
 * Mongoose connection singleton.
 *
 * Next.js reloads modules in development and runs many lambda-like
 * invocations in production, so the connection is cached on globalThis to
 * avoid exhausting the Atlas connection pool.
 */
import mongoose, { type Mongoose } from 'mongoose';
import { getEnv } from './env';
import { logger } from './logger';

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // `var` is required here: it is the only declaration form that augments
  // globalThis in a type declaration. (No eslint-disable needed — the flat
  // config's TypeScript preset does not enable no-var.)
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
    // Reject unknown fields rather than silently dropping them.
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
        // Clear the promise so the next request retries instead of
        // permanently caching a rejected connection.
        cache.promise = null;
        logger.error({ err }, 'MongoDB connection failed');
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

/**
 * Multi-document transactions require a replica set. Atlas provides one;
 * a standalone local mongod does not. Callers that need atomicity across
 * collections (order creation + inventory reservation) must use this.
 */
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
