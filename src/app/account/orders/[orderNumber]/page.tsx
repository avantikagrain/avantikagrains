import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getOrderForUser } from '@/server/account';
import { formatINR } from '@/lib/money';
import { buildWhatsappLink, orderSupportMessage } from '@/lib/whatsapp';
import type { OrderStatus } from '@/models';

export const metadata: Metadata = {
  title: 'Order detail',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  processing: 'Being packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso));
}

export default async function CustomerOrderDetail({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/account/login?next=${encodeURIComponent(`/account/orders/${orderNumber}`)}`);
  }

  const order = await getOrderForUser(session.id, orderNumber);
  if (!order) notFound();

  const whatsappLink = buildWhatsappLink({
    message: orderSupportMessage({
      orderNumber: order.orderNumber,
      totalPaise: order.totalPaise,
      status: order.status,
    }),
  });

  return (
    <div className="mx-auto max-w-[56rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-spec text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
      >
        <ArrowLeft size={14} /> Your orders
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-h2 leading-tight">{order.orderNumber}</h1>
          <p className="mt-1 text-spec text-[var(--fg-muted)]">
            Placed {formatWhen(order.placedAt)}
          </p>
        </div>
        <span className="rounded-[var(--radius-pill)] border border-[var(--accent)]/30 px-3.5 py-1.5 text-micro font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <section className="panel mt-8 rounded-[var(--radius-panel-lg)] p-6 sm:p-8">
        <h2 className="label">Items</h2>

        <ul className="mt-5 space-y-4">
          {order.items.map((item) => (
            <li key={item.sku} className="flex items-start gap-4">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt=""
                  width={52}
                  height={64}
                  className="flex-none rounded-[var(--radius-control)] bg-[var(--bg-sunken)] object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-body">{item.name}</p>
                <p className="mt-0.5 text-spec text-[var(--fg-faint)]">
                  {item.packSize} · {item.quantity} × {formatINR(item.unitPricePaise)}
                </p>
              </div>
              <p className="flex-none tabular-nums text-body">
                {formatINR(item.lineSubtotalPaise)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-6 border-t border-[var(--hairline)] pt-5">
          <Row label="Subtotal" value={formatINR(order.subtotalPaise)} />
          {order.discountPaise > 0 && (
            <Row
              label={`Discount${order.couponCode ? ` · ${order.couponCode}` : ''}`}
              value={`−${formatINR(order.discountPaise)}`}
            />
          )}
          <Row
            label="Shipping"
            value={order.shippingPaise === 0 ? 'Free' : formatINR(order.shippingPaise)}
          />
          {order.codFeePaise > 0 && (
            <Row label="COD handling" value={formatINR(order.codFeePaise)} />
          )}
        </dl>

        <div className="mt-4 flex items-baseline justify-between border-t border-[var(--hairline-strong)] pt-4">
          <span className="text-body font-medium">
            {order.paymentMethod === 'cod' ? 'Payable on delivery' : 'Total paid'}
          </span>
          <span className="display tabular-nums text-h3">
            {formatINR(order.totalPaise)}
          </span>
        </div>

        {order.taxPaise > 0 && (
          <p className="mt-1.5 text-micro text-[var(--fg-faint)]">
            Includes {formatINR(order.taxPaise)} GST
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="panel rounded-[var(--radius-panel)] p-6">
          <h2 className="label">Delivery address</h2>
          <address className="mt-3 space-y-0.5 text-spec not-italic text-[var(--fg-muted)]">
            <span className="block text-[var(--fg)]">{order.shippingAddress.fullName}</span>
            <span className="block tabular-nums">{order.shippingAddress.phone}</span>
            <span className="block">{order.shippingAddress.line1}</span>
            {order.shippingAddress.line2 && (
              <span className="block">{order.shippingAddress.line2}</span>
            )}
            {order.shippingAddress.landmark && (
              <span className="block">{order.shippingAddress.landmark}</span>
            )}
            <span className="block">
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              <span className="tabular-nums">{order.shippingAddress.pincode}</span>
            </span>
          </address>
        </section>

        <section className="panel rounded-[var(--radius-panel)] p-6">
          <h2 className="label">Progress</h2>
          <ol className="mt-3 space-y-3">
            {order.timeline.map((event, index) => (
              <li key={`${event.status}-${index}`}>
                <p className="text-spec text-[var(--fg)]">
                  {STATUS_LABELS[event.status]}
                </p>
                <p className="text-micro text-[var(--fg-faint)]">{formatWhen(event.at)}</p>
                {event.note && (
                  <p className="mt-0.5 text-micro text-[var(--fg-muted)]">{event.note}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2 text-spec font-medium text-[var(--accent)] underline underline-offset-4"
        >
          <MessageCircle size={15} strokeWidth={1.8} />
          Need help with this order?
        </a>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <dt className="text-spec text-[var(--fg-muted)]">{label}</dt>
      <dd className="text-spec tabular-nums text-[var(--fg-muted)]">{value}</dd>
    </div>
  );
}
