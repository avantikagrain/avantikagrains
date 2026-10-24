/**
 * Cookie-backed session helpers for route handlers and server components.
 *
 * Tokens live in HTTP-only cookies — never in localStorage, which is
 * readable by any injected script.
 */
import { cookies } from 'next/headers';
import { getEnv } from '../env';
import { forbidden, unauthenticated } from '../errors';
import { verifyAccessToken, type AccessClaims } from './jwt';
import { hasPermission, isStaff, type Permission, type UserRole } from './rbac';

export const ACCESS_COOKIE = 'ag_at';
export const REFRESH_COOKIE = 'ag_rt';
export const CSRF_COOKIE = 'ag_csrf';

function cookieOptions(maxAgeSeconds: number) {
  const env = getEnv();
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    domain: env.COOKIE_DOMAIN,
    maxAge: maxAgeSeconds,
  };
}

export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, accessToken, cookieOptions(60 * 15));
  jar.set(REFRESH_COOKIE, refreshToken, {
    ...cookieOptions(60 * 60 * 24 * 30),
    // Refresh token is only ever sent to the refresh endpoint.
    path: '/api/v1/auth',
  });
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete({ name: REFRESH_COOKIE, path: '/api/v1/auth' });
  jar.delete(CSRF_COOKIE);
}

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

/** Returns the current user, or null for an anonymous visitor. */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    const claims: AccessClaims = await verifyAccessToken(token);
    return { id: claims.sub, email: claims.email, role: claims.role };
  } catch {
    // Expired or tampered — treat as anonymous; the client refreshes.
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw unauthenticated();
  return session;
}

export async function requireStaff(): Promise<SessionUser> {
  const session = await requireSession();
  if (!isStaff(session.role)) throw forbidden();
  return session;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const session = await requireSession();
  if (!hasPermission(session.role, permission)) {
    throw forbidden(`Missing required permission: ${permission}`);
  }
  return session;
}
