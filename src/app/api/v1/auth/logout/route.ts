import { ok, route } from '@/lib/api-response';
import { clearSessionCookies, getSession } from '@/lib/auth/session';
import { logout } from '@/services/auth';

export const dynamic = 'force-dynamic';

export const POST = route(async () => {
  const session = await getSession();

  if (session) await logout(session.id);
  await clearSessionCookies();

  return ok({ signedOut: true });
});
