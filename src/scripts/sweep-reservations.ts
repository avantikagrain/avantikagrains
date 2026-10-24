/**
 * Releases stock held by checkouts that were never completed.
 *
 *   npm run sweep:reservations
 *
 * MUST run more often than the reservation TTL (20 minutes), because TTL
 * deletion removes the reservation row WITHOUT returning the units to the
 * available pool. Every 5 minutes via cron:
 *
 *   *\/5 * * * * cd /var/www/avantika && npm run sweep:reservations
 *
 * Safe to run concurrently: each release is an atomic $inc guarded by the
 * reservation's own status.
 */
import { connectDB, disconnectDB } from '@/lib/db';
import { releaseExpiredReservations } from '@/services/inventory';
import { logger } from '@/lib/logger';

async function main() {
  await connectDB();
  const released = await releaseExpiredReservations();
  console.log(
    released === 0
      ? 'No expired reservations.'
      : `Released ${released} expired reservation${released === 1 ? '' : 's'}.`,
  );
  await disconnectDB();
}

main().catch(async (err) => {
  logger.error({ err }, 'Reservation sweep failed');
  await disconnectDB();
  process.exit(1);
});
