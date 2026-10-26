'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';

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
