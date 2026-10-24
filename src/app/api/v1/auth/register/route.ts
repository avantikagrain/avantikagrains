import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { created, route } from '@/lib/api-response';
import { setSessionCookies } from '@/lib/auth/session';
import { register } from '@/services/auth';
import { phoneSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  // 12 characters with no composition rules: length beats forced symbols,
  // which mostly produce "Password1!" and a sticky note.
  password: z.string().min(12, 'Password must be at least 12 characters').max(72),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional(),
  phone: phoneSchema.optional(),
  marketingOptIn: z.boolean().optional(),
});

export const POST = route(async (request: NextRequest) => {
  const input = schema.parse(await request.json());

  const result = await register(input);
  await setSessionCookies(result.accessToken, result.refreshToken);

  // Tokens go in HTTP-only cookies, never in the response body — a body
  // token is readable by any injected script.
  return created({ user: result.user });
});
