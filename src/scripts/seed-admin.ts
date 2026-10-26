import { connectDB, disconnectDB } from '@/lib/db';
import { User } from '@/models';
import { hashPassword } from '@/lib/auth/password';
import { logger } from '@/lib/logger';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npm run seed:admin -- <email> <password>');
    process.exitCode = 1;
    return;
  }

  if (password.length < 12) {
    console.error('Owner password must be at least 12 characters.');
    process.exitCode = 1;
    return;
  }

  await connectDB();

  const existingOwner = await User.findOne({ role: 'owner' });
  if (existingOwner) {
    console.error(
      `An owner account already exists (${existingOwner.email}). ` +
        'Add further staff from the admin dashboard instead.',
    );
    process.exitCode = 1;
    await disconnectDB();
    return;
  }

  const normalised = email.trim().toLowerCase();
  const clash = await User.findOne({ email: normalised });
  if (clash) {
    console.error(`A user already exists with the email ${normalised}.`);
    process.exitCode = 1;
    await disconnectDB();
    return;
  }

  await User.create({
    email: normalised,
    passwordHash: await hashPassword(password),
    firstName: 'Store',
    lastName: 'Owner',
    role: 'owner',
    isActive: true,
    emailVerifiedAt: new Date(),
  });

  logger.info({ email: normalised }, 'Owner account created');
  console.log(`\n  Owner account created: ${normalised}`);
  console.log('  The password was not logged. Store it in your password manager now.\n');

  await disconnectDB();
}

main().catch(async (err) => {
  logger.error({ err }, 'Admin seed failed');
  await disconnectDB();
  process.exit(1);
});
