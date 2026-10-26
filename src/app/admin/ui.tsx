import Link from 'next/link';
import type { OrderStatus } from '@/models';

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-h2 leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-spec text-[var(--fg-muted)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-panel)] border border-[var(--hairline)] bg-[var(--bg-raised)] ${className}`}
    >
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  href,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: 'neutral' | 'alert';
}) {
  const body = (
    <div
      className={`h-full rounded-[var(--radius-panel)] border bg-[var(--bg-raised)] p-5 transition-colors duration-[var(--t-fast)] ${
        tone === 'alert' && value !== '0'
          ? 'border-[var(--color-flag-bad)]'
          : 'border-[var(--hairline)]'
      } ${href ? 'hover:border-[var(--accent)]' : ''}`}
    >
      <p className="text-micro uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
        {label}
      </p>
      <p className="display mt-2 text-h3 tabular-nums leading-none">{value}</p>
      {hint && <p className="mt-1.5 text-micro text-[var(--fg-faint)]">{hint}</p>}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

const STATUS_TONES: Record<string, string> = {
  pending_payment: 'bg-[var(--color-gold-100)] text-[var(--color-gold-700)]',
  confirmed: 'bg-[var(--color-forest-100)] text-[var(--color-forest-800)]',
  processing: 'bg-[var(--color-forest-100)] text-[var(--color-forest-800)]',
  shipped: 'bg-[var(--color-forest-100)] text-[var(--color-forest-700)]',
  out_for_delivery: 'bg-[var(--color-forest-100)] text-[var(--color-forest-700)]',
  delivered: 'bg-[var(--color-forest-100)] text-[var(--color-flag-good)]',
  cancelled: 'bg-[var(--color-cream-200)] text-[var(--color-flag-bad)]',
  returned: 'bg-[var(--color-cream-200)] text-[var(--color-flag-bad)]',
  refunded: 'bg-[var(--color-cream-200)] text-[var(--fg-muted)]',
  new: 'bg-[var(--color-gold-100)] text-[var(--color-gold-700)]',
  contacted: 'bg-[var(--color-forest-100)] text-[var(--color-forest-800)]',
  quoted: 'bg-[var(--color-forest-100)] text-[var(--color-forest-700)]',
  won: 'bg-[var(--color-forest-100)] text-[var(--color-flag-good)]',
  lost: 'bg-[var(--color-cream-200)] text-[var(--color-flag-bad)]',
  spam: 'bg-[var(--color-cream-200)] text-[var(--fg-faint)]',
  active: 'bg-[var(--color-forest-100)] text-[var(--color-flag-good)]',
  draft: 'bg-[var(--color-cream-200)] text-[var(--fg-muted)]',
  archived: 'bg-[var(--color-cream-200)] text-[var(--fg-faint)]',
  paid: 'bg-[var(--color-forest-100)] text-[var(--color-flag-good)]',
  pending: 'bg-[var(--color-gold-100)] text-[var(--color-gold-700)]',
  failed: 'bg-[var(--color-cream-200)] text-[var(--color-flag-bad)]',
  cod_pending: 'bg-[var(--color-gold-100)] text-[var(--color-gold-700)]',
  cod_collected: 'bg-[var(--color-forest-100)] text-[var(--color-flag-good)]',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? 'bg-[var(--bg-sunken)] text-[var(--fg-muted)]';
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-[var(--radius-pill)] px-2.5 py-1 text-micro font-medium ${tone}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="text-spec text-[var(--fg-faint)]">{message}</p>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function href(target: number): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (target > 1) search.set('page', String(target));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <div className="flex items-center justify-between border-t border-[var(--hairline)] px-5 py-3.5">
      <p className="text-micro text-[var(--fg-faint)]">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={href(page - 1)}
            className="rounded-[var(--radius-control)] border border-[var(--hairline-strong)] px-3 py-1.5 text-spec text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={href(page + 1)}
            className="rounded-[var(--radius-control)] border border-[var(--hairline-strong)] px-3 py-1.5 text-spec text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

export function formatDateTime(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

export function formatDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending payment',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};
