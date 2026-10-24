'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';

/**
 * Sign out.
 *
 * The session lives in HTTP-only cookies, so the browser cannot clear it
 * itself — only the server can. This posts to the logout endpoint, which
 * revokes the refresh-token family and expires both cookies, then refreshes
 * so every server component re-renders as anonymous.
 */
export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch('/api/v1/auth/logout', { method: 'POST' });
        } finally {
          // Navigate regardless. If the request failed the cookie may
          // survive, but leaving the customer stuck on a page whose button
          // appears dead is worse than a redirect that they can repeat.
          router.replace('/');
          router.refresh();
        }
      }}
      className="inline-flex items-center gap-2 text-spec text-[var(--fg-muted)] transition-colors duration-[var(--t-fast)] hover:text-[var(--accent)] disabled:opacity-60"
    >
      <LogOut size={14} strokeWidth={1.8} />
      {busy ? 'Signing out' : 'Sign out'}
    </button>
  );
}
