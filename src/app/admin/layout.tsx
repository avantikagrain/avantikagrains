import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { isStaff } from '@/lib/auth/rbac';
import { AdminNav } from './admin-nav';
import { SignOutButton } from '../account/sign-out-button';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) redirect('/account/login?next=/admin');
  if (!isStaff(session.role)) redirect('/');

  return (
    <div className="min-h-screen bg-[var(--bg-sunken)]">
      <header className="border-b border-[var(--hairline)] bg-[var(--bg-raised)]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
          <Link href="/admin" className="display text-h4 leading-none">
            Avantika<span className="text-[var(--fg-faint)]"> · Admin</span>
          </Link>

          <AdminNav role={session.role} />

          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-micro text-[var(--fg-faint)] sm:inline">
              {session.email} · {session.role}
            </span>
            <Link
              href="/"
              className="text-spec text-[var(--fg-muted)] underline-offset-4 hover:underline"
            >
              View store
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-8">{children}</main>
    </div>
  );
}
