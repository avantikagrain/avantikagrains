/**
 * JWT issue/verify using `jose` — Web Crypto based, so the same code runs in
 * Node route handlers and in Edge middleware.
 *
 * Access tokens are short-lived and carry the role claim. Refresh tokens
 * carry a rotating family id so a stolen token can be revoked server-side.
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { getEnv } from '../env';
import type { UserRole } from './rbac';

const ISSUER = 'avantika-grains';
const AUDIENCE = 'avantika-grains-client';

export interface AccessClaims extends JWTPayload {
  sub: string;
  role: UserRole;
  email: string;
  typ: 'access';
}

export interface RefreshClaims extends JWTPayload {
  sub: string;
  /** Refresh-token family — rotated on every use, revoked on reuse. */
  fam: string;
  typ: 'refresh';
}

const encoder = new TextEncoder();

function accessKey() {
  return encoder.encode(getEnv().JWT_ACCESS_SECRET);
}

function refreshKey() {
  return encoder.encode(getEnv().JWT_REFRESH_SECRET);
}

export async function signAccessToken(
  claims: Omit<AccessClaims, 'typ' | 'iat' | 'exp' | 'iss' | 'aud'>,
): Promise<string> {
  return new SignJWT({ ...claims, typ: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(getEnv().ACCESS_TOKEN_TTL)
    .sign(accessKey());
}

export async function signRefreshToken(sub: string, fam: string): Promise<string> {
  return new SignJWT({ fam, typ: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(getEnv().REFRESH_TOKEN_TTL)
    .sign(refreshKey());
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, accessKey(), {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ['HS256'],
  });
  if (payload.typ !== 'access') {
    throw new Error('Token type mismatch');
  }
  return payload as AccessClaims;
}

export async function verifyRefreshToken(token: string): Promise<RefreshClaims> {
  const { payload } = await jwtVerify(token, refreshKey(), {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ['HS256'],
  });
  if (payload.typ !== 'refresh') {
    throw new Error('Token type mismatch');
  }
  return payload as RefreshClaims;
}
