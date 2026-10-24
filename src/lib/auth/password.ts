import bcrypt from 'bcryptjs';

/**
 * Cost factor 12 — ~250ms on commodity hardware in 2026. Raise as hardware
 * improves; existing hashes keep their embedded cost and are re-hashed on
 * next successful login via `needsRehash`.
 */
const COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  // bcrypt silently truncates beyond 72 bytes — reject instead of truncating.
  if (Buffer.byteLength(plain, 'utf8') > 72) {
    throw new Error('Password must not exceed 72 bytes');
  }
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) {
    // Keep timing comparable to a real verification so a missing hash does
    // not reveal that the account has no password set.
    await bcrypt.hash(plain, COST);
    return false;
  }
  return bcrypt.compare(plain, hash);
}

export function needsRehash(hash: string): boolean {
  const rounds = bcrypt.getRounds(hash);
  return rounds < COST;
}
