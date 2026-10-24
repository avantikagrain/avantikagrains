import Link from 'next/link';

/**
 * Shared opening for every editorial and policy page: a standfirst in the
 * display serif over a measured intro, with the crumb trail as plain text.
 * Consistent entry point so these pages read as one publication.
 */
export function PageHeader({
  crumb,
  title,
  intro,
  meta,
}: {
  crumb?: { label: string; href: string };
  title: string;
  intro?: string;
  meta?: string;
}) {
  return (
    <header className="border-b border-[var(--hairline)]">
      <div className="mx-auto max-w-[86rem] px-5 pb-16 pt-36 sm:px-8 sm:pb-20 sm:pt-44">
        {crumb && (
          <Link
            href={crumb.href}
            className="label transition-colors duration-[var(--t-fast)] hover:text-[var(--accent-bright)]"
          >
            {crumb.label}
          </Link>
        )}

        <h1 className="display measure-wide mt-5 text-h1">{title}</h1>

        {intro && (
          <p className="measure mt-6 text-lead leading-relaxed text-[var(--fg-muted)]">
            {intro}
          </p>
        )}

        {meta && (
          <p className="mt-8 text-micro uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">{meta}</p>
        )}
      </div>
    </header>
  );
}

/** Body wrapper for long-form prose — holds the measure and rhythm. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[86rem] px-5 py-16 sm:px-8 sm:py-20">
      <div className="measure-wide [&>h2]:display [&>h2]:mt-12 [&>h2]:text-h3 [&>h2:first-child]:mt-0 [&>h3]:mt-9 [&>h3]:text-h4 [&>p]:mt-4 [&>p]:leading-relaxed [&>p]:text-[var(--fg-muted)] [&>ul]:mt-4 [&>ul]:space-y-2 [&>ul]:text-[var(--fg-muted)] [&>ul>li]:pl-5 [&>ul>li]:relative [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[0.7em] [&>ul>li]:before:h-px [&>ul>li]:before:w-2.5 [&>ul>li]:before:bg-[var(--accent)]">
        {children}
      </div>
    </div>
  );
}
