import { cookies } from 'next/headers';
import { ok, route } from '@/lib/api-response';
import { REFRESH_COOKIE, clearSessionCookies, setSessionCookies } from '@/lib/auth/session';
import { unauthenticated } from '@/lib/errors';
import { refresh } from '@/services/auth';

export const dynamic = 'force-dynamic';

export const POST = route(async () => {
  const jar = await cookies();
  const token = jar.get(REFRESH_COOKIE)?.value;

  if (!token) throw unauthenticated('Session expired. Please sign in again.');

  try {
    const tokens = await refresh(token);
    await setSessionCookies(tokens.accessToken, tokens.refreshToken);
    return ok({ refreshed: true });
  } catch (err) {
    // A rejected refresh must also clear the cookies, or the browser keeps
    // retrying with a token that will never work again.
    await clearSessionCookies();
    throw err;
  }
});
