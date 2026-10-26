'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { RefreshCw, Phone } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Storefront render error', error.digest ?? error.message);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[86rem] flex-col items-center justify-center px-5 py-24 text-center sm:px-8">
      <p className="label">Something went wrong</p>
      <h1 className="display mt-4 text-h2">We couldn&rsquo;t load this page.</h1>
      <p className="measure mt-5 text-[var(--fg-muted)]">
        This is on us, not on you. Trying again usually works — the fault is
        almost always momentary.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          <RefreshCw size={16} />
          Try again
        </button>
        <Link href="/contact" className="btn btn-outline">
          <Phone size={15} />
          Contact us
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-micro text-[var(--fg-faint)]">
          Reference <code className="text-[var(--fg-muted)]">{error.digest}</code> — quote this if
          you get in touch.
        </p>
      )}
    </main>
  );
}
