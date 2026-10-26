'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { CheckCircle2, Package, ArrowRight, MessageCircle } from 'lucide-react';
import { formatINR } from '@/lib/money';
import { LAST_ORDER_KEY, type PlacedOrder } from '@/lib/last-order';
import { buildWhatsappLink, orderSupportMessage } from '@/lib/whatsapp';

let cached: PlacedOrder | null = null;
let read = false;

function snapshot(): PlacedOrder | null {
  if (!read) {
    read = true;
    try {
      const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
      cached = raw ? (JSON.parse(raw) as PlacedOrder) : null;
    } catch {
      cached = null;
    }
  }
  return cached;
}

function serverSnapshot(): PlacedOrder | null {
  return null;
}

function noopSubscribe(): () => void {
  return () => {};
}

export default function OrderConfirmationPage() {
  const order = useSyncExternalStore(noopSubscribe, snapshot, serverSnapshot);

  const whatsappLink = order
    ? buildWhatsappLink({
        message: orderSupportMessage({
          orderNumber: order.orderNumber,
          totalPaise: order.totalPaise,
          status: order.status ?? order.paymentStatus,
        }),
      })
    : null;

  return (
    <div className="mx-auto max-w-[86rem] px-5 pb-24 pt-36 sm:px-8 sm:pt-44">
      <div className="mx-auto max-w-2xl text-center">
        <span
          aria-hidden
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-forest-100)] text-[var(--accent)]"
        >
          <CheckCircle2 size={30} strokeWidth={1.6} />
        </span>

        <h1 className="display mt-7 text-h1">Order confirmed</h1>

        <p className="measure mx-auto mt-5 leading-relaxed text-[var(--fg-muted)]">
          Thank you. Your order has been placed and is now with the mill at Depalpur.
          {order?.email ? ` A confirmation has been sent to ${order.email}.` : ''}
        </p>
      </div>

      <div className="panel mx-auto mt-10 max-w-xl rounded-[var(--radius-panel-lg)] p-6 text-left sm:p-8">
          <div className="flex items-center gap-3 border-b border-[var(--hairline)] pb-5">
            <span aria-hidden className="text-[var(--gold)]">
              <Package size={22} strokeWidth={1.7} />
            </span>
            <div>
              <p className="label">Order number</p>
              <p className="spec mt-1 font-medium tracking-[0.08em]">
                {order?.orderNumber ?? 'Check your email for the order number'}
              </p>
            </div>
          </div>

          {order ? (
            <>
              <ul className="mt-5 space-y-3">
                {order.items.map((item) => (
                  <li
                    key={`${item.name}-${item.packSize}`}
                    className="flex justify-between gap-4 text-spec"
                  >
                    <span className="min-w-0">
                      <span className="block text-[var(--fg)]">{item.name}</span>
                      <span className="block text-micro text-[var(--fg-faint)]">
                        {item.packSize} · {item.quantity} ×{' '}
                        {formatINR(item.unitPricePaise)}
                      </span>
                    </span>
                    <span className="flex-none tabular-nums text-[var(--fg-muted)]">
                      {formatINR(item.lineSubtotalPaise)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-5 border-t border-[var(--hairline)] pt-4">
                {order.subtotalPaise !== undefined && (
                  <Line label="Subtotal" value={formatINR(order.subtotalPaise)} />
                )}
                {order.discountPaise ? (
                  <Line label="Discount" value={`−${formatINR(order.discountPaise)}`} />
                ) : null}
                {order.shippingPaise !== undefined && (
                  <Line
                    label="Shipping"
                    value={
                      order.shippingPaise === 0 ? 'Free' : formatINR(order.shippingPaise)
                    }
                  />
                )}
                {order.codFeePaise ? (
                  <Line label="COD handling" value={formatINR(order.codFeePaise)} />
                ) : null}
              </dl>

              <div className="mt-4 flex items-baseline justify-between border-t border-[var(--hairline-strong)] pt-4">
                <span className="text-body">
                  {order.paymentMethod === 'cod' ? 'Payable on delivery' : 'Paid'}
                </span>
                <span className="display tabular-nums text-h4">
                  {formatINR(order.totalPaise)}
                </span>
              </div>

              {order.taxPaise !== undefined && order.taxPaise > 0 && (
                <p className="mt-1.5 text-micro text-[var(--fg-faint)]">
                  Includes {formatINR(order.taxPaise)} GST
                </p>
              )}

              {order.paymentMethod === 'cod' && (
                <p className="mt-3 text-spec leading-relaxed text-[var(--fg-faint)]">
                  Please keep the exact amount ready for the courier.
                </p>
              )}

              {order.shippingAddress && (
                <div className="mt-6 border-t border-[var(--hairline)] pt-5">
                  <p className="label">Delivering to</p>
                  <address className="mt-2 space-y-0.5 text-spec not-italic text-[var(--fg-muted)]">
                    <span className="block text-[var(--fg)]">
                      {order.shippingAddress.fullName}
                    </span>
                    <span className="block tabular-nums">
                      {order.shippingAddress.phone}
                    </span>
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
                </div>
              )}

              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-spec font-medium text-[var(--accent)] underline underline-offset-4"
                >
                  <MessageCircle size={15} strokeWidth={1.8} />
                  Questions about this order? Message us
                </a>
              )}
            </>
          ) : (
            <p className="mt-5 text-spec leading-relaxed text-[var(--fg-muted)]">
              The details of this order are not in this browser any more — that happens
              after the tab is closed. The order itself is safe. It is in the
              confirmation email, and in your account if you were signed in when you
              placed it.
            </p>
          )}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/products" className="btn btn-primary">
          Continue shopping
          <ArrowRight size={16} />
        </Link>
        <Link href="/account/orders" className="btn btn-outline">
          Your orders
        </Link>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1 text-spec">
      <dt className="text-[var(--fg-muted)]">{label}</dt>
      <dd className="tabular-nums text-[var(--fg-muted)]">{value}</dd>
    </div>
  );
}
