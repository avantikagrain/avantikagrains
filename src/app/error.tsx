'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { RefreshCw, Phone } from 'lucide-react';

/**
 * Render-error boundary for the whole storefront.
 *
 * Without this file an unhandled error — a database blip mid-request, say —
 * shows Next's own default screen, which looks like the site has fallen
 * over. This keeps the customer inside the brand, gives them a retry, and
 * gives them a way to reach a human if retrying does not help.
 *
 * `error.digest` is the only part of the error that is safe to show: it is
 * a server-side hash, so support can match it to a log line without any
 * internal detail reaching the browser.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The server already logged this with full context. Mirroring it to the
    // browser console helps whoever is debugging a report from a customer.
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
