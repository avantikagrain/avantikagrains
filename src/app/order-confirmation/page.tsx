'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/money';
import { LAST_ORDER_KEY, type PlacedOrder } from '@/lib/last-order';


let cached: PlacedOrder | null = null;
let read = false;

function snapshot(): PlacedOrder | null {
  if (!read) {
    read = true;
    try {
      const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
      cached = raw ? (JSON.parse(raw) as PlacedOrder) : null;
    } catch {
      // Blocked or corrupt storage — fall through to the generic view.
      cached = null;
    }
  }
  return cached;
}

/** The server cannot see sessionStorage, so it renders the generic view. */
function serverSnapshot(): PlacedOrder | null {
  return null;
}

function noopSubscribe(): () => void {
  return () => {};
}

export default function OrderConfirmationPage() {
  const order = useSyncExternalStore(noopSubscribe, snapshot, serverSnapshot);

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
              <ul className="mt-5 space-y-2.5">
                {order.items.map((item) => (
                  <li
                    key={`${item.name}-${item.packSize}`}
                    className="flex justify-between gap-4 text-spec"
                  >
                    <span className="text-[var(--fg-muted)]">
                      {item.name}
                      <span className="text-[var(--fg-faint)]">
                        {' '}
                        · {item.packSize} × {item.quantity}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-baseline justify-between border-t border-[var(--hairline-strong)] pt-4">
                <span className="text-body">
                  {order.paymentMethod === 'cod' ? 'Payable on delivery' : 'Paid'}
                </span>
                <span className="display tabular-nums text-h4">
                  {formatINR(order.totalPaise)}
                </span>
              </div>

              {order.paymentMethod === 'cod' && (
                <p className="mt-3 text-spec leading-relaxed text-[var(--fg-faint)]">
                  Please keep the exact amount ready for the courier.
                </p>
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