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
