import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { ok, route } from '@/lib/api-response';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/** Liveness — the process is up. Used by the load balancer. */
export const GET = route(async () => {
  return ok({ status: 'ok', uptimeSeconds: Math.floor(process.uptime()) });
});

/**
 * Readiness lives at /api/v1/health/ready and additionally proves the
 * database is reachable, so a booting instance is not sent traffic.
 */
export async function readiness() {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    throw new AppError('UPSTREAM_ERROR', 'Database not ready');
  }
  return { status: 'ready', db: 'connected' as const };
}
