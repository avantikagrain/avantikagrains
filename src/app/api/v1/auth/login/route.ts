import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, route } from '@/lib/api-response';
import { setSessionCookies } from '@/lib/auth/session';
import { login } from '@/services/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});

export const POST = route(async (request: NextRequest) => {
  const input = schema.parse(await request.json());

  const result = await login(input);
  await setSessionCookies(result.accessToken, result.refreshToken);

  return ok({ user: result.user });
});
