import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { ok, route } from '@/lib/api-response';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  return ok({ status: 'ok', uptimeSeconds: Math.floor(process.uptime()) });
});

export async function readiness() {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    throw new AppError('UPSTREAM_ERROR', 'Database not ready');
  }
  return { status: 'ready', db: 'connected' as const };
}
