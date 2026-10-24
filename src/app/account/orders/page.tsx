import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { ArrowRight, PackageOpen } from 'lucide-react';
import { PageHeader } from '@/components/site/page-header';
import { SignOutButton } from '../sign-out-button';
import { getSession } from '@/lib/auth/session';
import { listOrdersForUser, type OrderListItem } from '@/server/account';
import { formatINR } from '@/lib/money';
import type { OrderStatus } from '@/models';

export const metadata: Metadata = {
  title: 'Your orders',
  description: 'Your order history with Avantika Grain Mills.',
  // An account page must never be indexed or cached by a shared proxy.
  robots: { index: false, follow: false },
};

/**
 * This page reads the session cookie, so it can never be statically
 * rendered or revalidated — each visitor must get their own render.
 */
export const dynamic = 'force-dynamic';

/**
 * How each order status reads to a customer, and the colour it carries.
 *
 * The model's status values are internal vocabulary ('pending_payment');
 * they are not shown to customers as-is.
 */
const STATUS: Record<OrderStatus, { label: string; tone: 'wait' | 'live' | 'good' | 'bad' }> = {
  pending_payment: { label: 'Awaiting payment', tone: 'wait' },
  confirmed: { label: 'Confirmed', tone: 'live' },
  processing: { label: 'Being packed', tone: 'live' },
  shipped: { label: 'Shipped', tone: 'live' },
  out_for_delivery: { label: 'Out for delivery', tone: 'live' },
  delivered: { label: 'Delivered', tone: 'good' },
  cancelled: { label: 'Cancelled', tone: 'bad' },
  returned: { label: 'Returned', tone: 'bad' },
  refunded: { label: 'Refunded', tone: 'bad' },
};

const TONE_CLASS: Record<'wait' | 'live' | 'good' | 'bad', string> = {
  wait: 'text-[var(--gold)] border-[var(--gold)]/35',
  live: 'text-[var(--accent)] border-[var(--accent)]/30',
  good: 'text-[var(--accent)] border-[var(--accent)]/30',
  bad: 'text-[var(--color-flag-bad)] border-[var(--color-flag-bad)]/30',
};

export default async function OrdersPage() {
  const session = await getSession();

  // Signing in returns the customer here, so the sign-in link carries this
  // page as `next` — otherwise they would land on the homepage and have to
  // find their way back.
  if (!session) redirect('/account/login?next=%2Faccount%2Forders');

  const orders = await listOrdersForUser(session.id);

  return (
    <>
      <PageHeader
        crumb={{ label: 'Avantika', href: '/' }}
        title="Your orders"
        intro={`Signed in as ${session.email}.`}
      />

      <div className="mx-auto max-w-[86rem] px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex items-center justify-between gap-6">
          <p className="label">
            {orders.length === 0
              ? 'No orders yet'
              : `${orders.length} order${orders.length === 1 ? '' : 's'}`}
          </p>
          <SignOutButton />
        </div>

        {orders.length === 0 ? (
          <div className="panel mt-7 rounded-[var(--radius-panel-lg)] px-6 py-16 text-center">
            <span
              aria-hidden
              className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--color-forest-100)] text-[var(--accent)]"
            >
              <PackageOpen size={22} strokeWidth={1.6} />
            </span>
            <h2 className="display mt-5 text-h4">Nothing here yet</h2>
            <p className="measure mx-auto mt-3 text-[var(--fg-muted)]">
              Once you place an order it appears here, with its status as it moves
              through the mill and on to delivery.
            </p>
            <Link href="/products" className="btn btn-primary mt-7">
              Browse products
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <ul className="mt-7 space-y-4">
            {orders.map((order) => (
              <OrderRow key={order.orderNumber} order={order} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function OrderRow({ order }: { order: OrderListItem }) {
  const status = STATUS[order.status];
  const placed = new Date(order.placedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <li className="panel rounded-[var(--radius-panel)] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div>
          <p className="spec font-medium tracking-[0.08em]">{order.orderNumber}</p>
          <p className="mt-1 text-micro text-[var(--fg-faint)]">
            Placed {placed} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'} ·{' '}
            {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`rounded-full border px-3 py-1 text-micro font-medium uppercase tracking-[0.1em] ${
              TONE_CLASS[status.tone]
            }`}
          >
            {status.label}
          </span>
          <span className="text-body font-medium">{formatINR(order.totalPaise)}</span>
        </div>
      </div>

      {order.preview.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-3 border-t border-[var(--hairline)] pt-4">
          {order.preview.map((item) => (
            <li key={`${item.name}-${item.packSize}`} className="flex items-center gap-2.5">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt=""
                  width={40}
                  height={50}
                  className="rounded-[var(--radius-control)] bg-[var(--bg-sunken)] object-cover"
                />
              )}
              <span className="text-spec text-[var(--fg-muted)]">
                {item.name}
                <span className="text-[var(--fg-faint)]">
                  {' '}
                  · {item.packSize} × {item.quantity}
                </span>
              </span>
            </li>
          ))}
          {order.itemCount > order.preview.length && (
            <li className="self-center text-micro text-[var(--fg-faint)]">
              and more
            </li>
          )}
        </ul>
      )}
    </li>
  );
}
