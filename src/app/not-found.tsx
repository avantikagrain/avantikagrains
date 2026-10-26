import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[86rem] flex-col items-center justify-center px-5 py-24 text-center sm:px-8">
      <p className="label">Error 404</p>
      <h1 className="display mt-4 text-h2">
        This page isn&rsquo;t here.
      </h1>
      <p className="measure mt-5 text-[var(--fg-muted)]">
        The link may be out of date, or the product may have been renamed. The
        full catalogue is one click away.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link href="/products" className="btn btn-primary">
          <Search size={16} />
          Browse all products
        </Link>
        <Link href="/" className="btn btn-outline">
          Home
          <ArrowRight size={15} />
        </Link>
      </div>
    </main>
  );
}
