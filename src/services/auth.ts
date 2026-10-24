import { randomUUID } from 'node:crypto';
import { connectDB } from '@/lib/db';
import { User, type IUser } from '@/models';
import { AppError, badRequest, unauthenticated } from '@/lib/errors';
import { hashPassword, needsRehash, verifyPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';

/**
 * Authentication.
 *
 * Two behaviours here are deliberate and look odd without explanation:
 *
 *  - Login failures never say whether the email exists. "No such account"
 *    hands an attacker a list of valid customers.
 *  - A wrong password on a non-existent account still costs a bcrypt
 *    comparison, so response time does not reveal which case it was.
 */

const MAX_FAILED_ATTEMPTS = 8;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: { id: string; email: string; firstName: string; role: string };
}

async function issueTokens(user: IUser): Promise<AuthTokens> {
  // A fresh family id on every login means a refresh token stolen from one
  // session cannot be replayed after the user logs in again elsewhere.
  const family = randomUUID();

  await User.updateOne({ _id: user._id }, { refreshTokenFamily: family });

  return {
    accessToken: await signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    }),
    refreshToken: await signRefreshToken(user._id.toString(), family),
  };
}

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  marketingOptIn?: boolean;
}): Promise<AuthResult> {
  await connectDB();

  const email = input.email.trim().toLowerCase();

  const existing = await User.findOne({ email });
  if (existing) {
    // Registration necessarily reveals that an email is taken, but the
    // message stays neutral and suggests signing in rather than confirming
    // account details.
    throw new AppError('CONFLICT', 'That email is already registered. Try signing in instead.');
  }

  const user = await User.create({
    email,
    passwordHash: await hashPassword(input.password),
    firstName: input.firstName.trim(),
    lastName: input.lastName?.trim(),
    phone: input.phone,
    role: 'customer',
    marketingOptInAt: input.marketingOptIn ? new Date() : undefined,
  });

  logger.info({ userId: user._id.toString() }, 'Customer registered');

  return {
    ...(await issueTokens(user)),
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      role: user.role,
    },
  };
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  await connectDB();

  const email = input.email.trim().toLowerCase();

  // passwordHash is select:false on the schema, so it must be asked for.
  const user = await User.findOne({ email }).select('+passwordHash');

  const GENERIC = 'Email or password is incorrect';

  if (!user) {
    // Burn comparable time so a missing account is not detectable.
    await verifyPassword(input.password, '');
    throw new AppError('UNAUTHENTICATED', GENERIC);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new AppError(
      'RATE_LIMITED',
      `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
    );
  }

  if (!user.isActive) {
    throw new AppError('FORBIDDEN', 'This account has been deactivated. Contact support.');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);

  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const update: Record<string, unknown> = { failedLoginAttempts: attempts };

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      update.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      update.failedLoginAttempts = 0;
      logger.warn({ userId: user._id.toString() }, 'Account locked after repeated failures');
    }

    await User.updateOne({ _id: user._id }, update);
    throw new AppError('UNAUTHENTICATED', GENERIC);
  }

  // Transparently upgrade the hash if the cost factor has since been raised.
  const patch: Record<string, unknown> = {
    failedLoginAttempts: 0,
    lockedUntil: undefined,
    lastLoginAt: new Date(),
  };
  if (needsRehash(user.passwordHash)) {
    patch.passwordHash = await hashPassword(input.password);
  }
  await User.updateOne({ _id: user._id }, patch);

  return {
    ...(await issueTokens(user)),
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      role: user.role,
    },
  };
}

/**
 * Rotates a refresh token.
 *
 * If the presented token's family does not match the stored one, the token
 * is a replay of an older session — every session for that user is revoked
 * rather than quietly issuing a new pair.
 */
export async function refresh(refreshToken: string): Promise<AuthTokens> {
  await connectDB();

  let claims;
  try {
    claims = await verifyRefreshToken(refreshToken);
  } catch {
    throw unauthenticated('Session expired. Please sign in again.');
  }

  const user = await User.findById(claims.sub).select('+refreshTokenFamily');
  if (!user || !user.isActive) throw unauthenticated('Session expired. Please sign in again.');

  if (user.refreshTokenFamily !== claims.fam) {
    logger.warn(
      { userId: user._id.toString() },
      'Refresh token family mismatch — revoking all sessions',
    );
    await User.updateOne({ _id: user._id }, { $unset: { refreshTokenFamily: 1 } });
    throw unauthenticated('Session expired. Please sign in again.');
  }

  return issueTokens(user);
}

export async function logout(userId: string): Promise<void> {
  await connectDB();
  await User.updateOne({ _id: userId }, { $unset: { refreshTokenFamily: 1 } });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await connectDB();

  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw unauthenticated();

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw badRequest('Your current password is incorrect');
  }

  if (currentPassword === newPassword) {
    throw badRequest('The new password must be different from the current one');
  }

  await User.updateOne(
    { _id: userId },
    {
      passwordHash: await hashPassword(newPassword),
      // Changing a password signs out every other device.
      $unset: { refreshTokenFamily: 1 },
    },
  );

  logger.info({ userId }, 'Password changed');
}
