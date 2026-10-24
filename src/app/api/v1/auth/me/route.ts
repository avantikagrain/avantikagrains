import { ok, route } from '@/lib/api-response';
import { requireSession } from '@/lib/auth/session';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { notFound } from '@/lib/errors';
import { permissionsFor } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

/** The signed-in user's own profile and addresses. */
export const GET = route(async () => {
  const session = await requireSession();
  await connectDB();

  const user = await User.findById(session.id).select(
    'email phone firstName lastName role addresses emailVerifiedAt createdAt',
  );
  if (!user) throw notFound('Account not found');

  return ok({
    id: user._id.toString(),
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    addresses: user.addresses,
    permissions: permissionsFor(user.role),
  });
});
