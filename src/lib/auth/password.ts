import bcrypt from 'bcryptjs';

const COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (Buffer.byteLength(plain, 'utf8') > 72) {
    throw new Error('Password must not exceed 72 bytes');
  }
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) {
    await bcrypt.hash(plain, COST);
    return false;
  }
  return bcrypt.compare(plain, hash);
}

export function needsRehash(hash: string): boolean {
  const rounds = bcrypt.getRounds(hash);
  return rounds < COST;
}
