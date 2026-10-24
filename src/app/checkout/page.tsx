'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCart } from '@/components/cart/cart-store';
import { formatPaise } from '@/lib/format';
import { LAST_ORDER_KEY } from '@/lib/last-order';
import { apiFetch } from '@/lib/api-client';

/**
 * Checkout, step one: the server-priced quote.
 *
 * The figures shown here come from POST /api/v1/checkout/quote, which
 * recomputes everything from the database. The cart's own prices are
 * display-only, so this screen is the first place the customer sees the
 * amount that will actually be charged — and it is also the screen that
 * surfaces a price change or a stock shortfall before payment rather than
 * after.
 *
 * Placing the order posts to /api/v1/orders, which prices the cart again
 * server-side and refuses any amount sent from here. Cash on delivery is
 * accepted immediately and the customer lands on the confirmation screen.
 * An online payment comes back with a gateway order to hand to Checkout.
 *
 * The idempotency key is generated once per attempt and reused on retry, so
 * a double-click, a flaky connection or an impatient refresh resolves to the
 * same single order rather than two.
 */

interface QuoteLine {
  sku: string;
  name: string;
  packSize: string;
  quantity: number;
  unitPricePaise: number;
  lineSubtotalPaise: number;
  lineDiscountPaise: number;
}

interface Quote {
  lines: QuoteLine[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  taxInclusive: boolean;
  codFeePaise: number;
  totalPaise: number;
  warnings: string[];
}

type Method = 'razorpay' | 'cod';

interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY_ADDRESS: Address = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
};

/** Razorpay injects this when its Checkout script loads. */
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayCheckout(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const [method, setMethod] = useState<Method>('razorpay');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [email, setEmail] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // The PIN code drives both the quote and the delivery address; keeping two
  // copies of it is how they end up disagreeing.
  const pincode = address.pincode;

  /**
   * One key per attempt. Generated lazily so it is not created during
   * render, and replaced only after an order is actually accepted — a retry
   * after a failure must reuse it, or a request that in fact succeeded
   * server-side would create a second order.
   */
  const idempotencyKey = useRef<string | null>(null);

  function setField<K extends keyof Address>(key: K, value: Address[K]) {
    setAddress((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    if (!ready || items.length === 0) return;

    const controller = new AbortController();

    async function quoteOrder() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch('/api/v1/checkout/quote', {
          method: 'POST',
          signal: controller.signal,
          body: JSON.stringify({
            items: items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
            })),
            paymentMethod: method,
            ...(pincode.length === 6 ? { pincode } : {}),
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? 'Could not price this order');
        }
        setQuote(payload.data);
      } catch (err: unknown) {
        // An abort means a newer quote is already in flight. Returning
        // early leaves the spinner up for that one — the previous code
        // cleared it in a `finally`, which flickered the total back to
        // "ready" while the real answer was still on its way.
        if (controller.signal.aborted) return;
        setQuote(null);
        setError(err instanceof Error ? err.message : 'Could not price this order');
      }

      setLoading(false);
    }

    void quoteOrder();
    return () => controller.abort();
  }, [items, method, pincode, ready]);

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (placing) return;

    setPlacing(true);
    setPlaceError(null);
    setFieldErrors({});

    // Minted on first submit, inside the handler — a ref must not be read
    // or written during render, and this is also the first moment the key
    // is actually needed.
    idempotencyKey.current ??= crypto.randomUUID();

    try {
      const response = await apiFetch('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          shippingAddress: {
            fullName: address.fullName.trim(),
            phone: address.phone.trim(),
            line1: address.line1.trim(),
            // Optional fields must be absent rather than empty: the schema
            // caps their length but an empty string is not a valid value.
            ...(address.line2.trim() ? { line2: address.line2.trim() } : {}),
            ...(address.landmark.trim() ? { landmark: address.landmark.trim() } : {}),
            city: address.city.trim(),
            state: address.state.trim(),
            pincode: address.pincode,
            country: 'IN',
          },
          paymentMethod: method,
          guestEmail: email.trim() || undefined,
          idempotencyKey: idempotencyKey.current,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const details = payload?.error?.details;
        if (Array.isArray(details)) {
          setFieldErrors(
            Object.fromEntries(
              details.map((d: { field: string; message: string }) => [
                // The server reports nested paths such as
                // "shippingAddress.pincode"; the form knows the leaf.
                d.field.split('.').at(-1) ?? d.field,
                d.message,
              ]),
            ),
          );
          setPlaceError('Please correct the highlighted fields.');
        } else {
          setPlaceError(payload?.error?.message ?? 'The order could not be placed.');
        }
        setPlacing(false);
        return;
      }

      const order = payload.data ?? payload;

      // Remember what was ordered for the confirmation screen. Written
      // before any gateway handoff so it survives the round trip.
      try {
        window.sessionStorage.setItem(
          LAST_ORDER_KEY,
          JSON.stringify({
            orderNumber: order.orderNumber,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            totalPaise: order.totalPaise,
            email: email.trim() || undefined,
            items: items.map((i) => ({
              name: i.name,
              packSize: i.packSize,
              quantity: i.quantity,
            })),
          }),
        );
      } catch {
        // Storage blocked — the confirmation page degrades to the generic
        // view, which is a worse screen but not a failed order.
      }

      if (order.paymentMethod === 'cod' || !order.gateway) {
        // Cash on delivery is already confirmed server-side.
        clear();
        router.push('/order-confirmation');
        return;
      }

      const ready = await loadRazorpayCheckout();
      if (!ready) {
        setPlaceError(
          'The payment window could not be loaded. Your order is held — check your connection and try again, or choose cash on delivery.',
        );
        setPlacing(false);
        return;
      }

      const checkout = new window.Razorpay!({
        key: order.gateway.keyId,
        order_id: order.gateway.gatewayOrderId,
        amount: order.gateway.amountPaise,
        currency: order.gateway.currency,
        name: 'Avantika Grain Mills',
        description: `Order ${order.orderNumber}`,
        prefill: {
          name: address.fullName,
          email: email.trim(),
          contact: address.phone,
        },
        theme: { color: '#1e4430' },
        handler: async (result: Record<string, string>) => {
          // The browser's word that payment succeeded is not evidence. The
          // server re-checks the signature before anything is marked paid.
          const verify = await apiFetch('/api/v1/payments/verify', {
            method: 'POST',
            body: JSON.stringify({
              orderNumber: order.orderNumber,
              razorpay_order_id: result.razorpay_order_id,
              razorpay_payment_id: result.razorpay_payment_id,
              razorpay_signature: result.razorpay_signature,
            }),
          });

          if (!verify.ok) {
            setPlaceError(
              'Payment was taken but could not be verified. Do not pay again — contact the mill with your order number.',
            );
            setPlacing(false);
            return;
          }

          clear();
          router.push('/order-confirmation');
        },
        modal: {
          ondismiss: () => {
            setPlacing(false);
            setPlaceError(
              'Payment was cancelled. Your order is held and the stock is reserved for a short while — you can try again.',
            );
          },
        },
      });

      checkout.open();
    } catch {
      setPlaceError('Could not reach the server. Check your connection and try again.');
      setPlacing(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-[86rem] px-5 pb-20 pt-36 sm:px-8 sm:pt-44">
        <div className="h-7 w-48 animate-pulse bg-[var(--bg-raised)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[86rem] px-5 pb-24 pt-40 sm:px-8 sm:pt-48">
        <h1 className="display text-h2">Nothing to check out</h1>
        <p className="measure mt-4 text-[var(--fg-muted)]">
          Your cart is empty, so there is nothing to price.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex h-11 items-center rounded-[var(--radius-control)] bg-[var(--accent)] px-6 text-spec text-[var(--color-cream-50)]"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[86rem] px-5 pb-16 pt-36 sm:px-8 sm:pt-44">
      <h1 className="display text-h1">Checkout</h1>
      <p className="measure mt-5 text-[var(--fg-muted)]">
        Every amount below is calculated on the server from current catalogue prices,
        not from your browser.
      </p>

      <form
        onSubmit={placeOrder}
        className="mt-12 grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16"
      >
        <div>
          <section>
            <h2 className="display text-h3">Payment method</h2>
            <div className="mt-5 space-y-3">
              {(
                [
                  ['razorpay', 'Pay online', 'UPI, card or net banking through Razorpay.'],
                  ['cod', 'Cash on delivery', 'Pay the courier. A handling fee applies.'],
                ] as const
              ).map(([value, label, note]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer gap-3 border p-4 transition-colors duration-[var(--t-fast)] ${
                    method === value
                      ? 'border-[var(--accent)] bg-[rgb(212 175 106 / 0.1)]'
                      : 'border-[var(--hairline)] hover:border-[var(--hairline-strong)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={value}
                    checked={method === value}
                    onChange={() => setMethod(value)}
                    className="mt-1 accent-[var(--accent)]"
                  />
                  <span>
                    <span className="block text-body">{label}</span>
                    <span className="mt-0.5 block text-spec text-[var(--fg-muted)]">
                      {note}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="display text-h3">Delivery address</h2>
            <p className="measure mt-3 text-spec text-[var(--fg-muted)]">
              The PIN code also decides shipping and whether cash on delivery is
              available, so the total above updates as you type it.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field
                label="Full name"
                value={address.fullName}
                onChange={(v) => setField('fullName', v)}
                autoComplete="name"
                error={fieldErrors.fullName}
                required
              />
              <Field
                label="Mobile"
                value={address.phone}
                onChange={(v) => setField('phone', v.replace(/\D/g, '').slice(0, 10))}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                hint="10 digits, for delivery updates"
                error={fieldErrors.phone}
                required
              />
              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                type="email"
                autoComplete="email"
                hint="Your order confirmation goes here"
                error={fieldErrors.guestEmail}
                required
                className="sm:col-span-2"
              />
              <Field
                label="Address"
                value={address.line1}
                onChange={(v) => setField('line1', v)}
                autoComplete="address-line1"
                error={fieldErrors.line1}
                required
                className="sm:col-span-2"
              />
              <Field
                label="Apartment, floor (optional)"
                value={address.line2}
                onChange={(v) => setField('line2', v)}
                autoComplete="address-line2"
                error={fieldErrors.line2}
                className="sm:col-span-2"
              />
              <Field
                label="Landmark (optional)"
                value={address.landmark}
                onChange={(v) => setField('landmark', v)}
                error={fieldErrors.landmark}
                className="sm:col-span-2"
              />
              <Field
                label="City"
                value={address.city}
                onChange={(v) => setField('city', v)}
                autoComplete="address-level2"
                error={fieldErrors.city}
                required
              />
              <Field
                label="State"
                value={address.state}
                onChange={(v) => setField('state', v)}
                autoComplete="address-level1"
                error={fieldErrors.state}
                required
              />
              <Field
                label="PIN code"
                value={address.pincode}
                onChange={(v) => setField('pincode', v.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="453001"
                error={fieldErrors.pincode}
                required
              />
            </div>
          </section>

          <section className="mt-12">
            <h2 className="display text-h3">Items</h2>
            <dl className="mt-5">
              {(quote?.lines ?? []).map((line) => (
                <div key={line.sku} className="spec">
                  <dt>
                    {line.name}
                    <span className="text-[var(--fg-faint)]"> · {line.packSize}</span>
                  </dt>
                  <dd className="tabular-nums">
                    {line.quantity} × {formatPaise(line.unitPricePaise)} ={' '}
                    {formatPaise(line.lineSubtotalPaise)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="h-fit border border-[var(--hairline)] bg-[var(--bg-raised)] p-6">
          <h2 className="display text-h4">Order total</h2>

          {loading && (
            <p className="mt-5 text-spec text-[var(--fg-faint)]">Pricing…</p>
          )}

          {error && (
            <div className="mt-5 border-l-2 border-[var(--color-flag-bad)] pl-3">
              <p className="text-spec text-[var(--color-flag-bad)]">{error}</p>
            </div>
          )}

          {quote && !loading && (
            <>
              <dl className="mt-5">
                <Row label="Subtotal" value={formatPaise(quote.subtotalPaise)} />
                {quote.discountPaise > 0 && (
                  <Row label="Discount" value={`−${formatPaise(quote.discountPaise)}`} />
                )}
                <Row
                  label="Shipping"
                  value={quote.shippingPaise === 0 ? 'Free' : formatPaise(quote.shippingPaise)}
                />
                {quote.codFeePaise > 0 && (
                  <Row label="COD handling" value={formatPaise(quote.codFeePaise)} />
                )}
              </dl>

              <div className="mt-4 flex items-baseline justify-between border-t border-[var(--hairline-strong)] pt-4">
                <span className="text-body">Total</span>
                <span className="display tabular-nums text-h3">
                  {formatPaise(quote.totalPaise)}
                </span>
              </div>

              <p className="mt-2 text-spec text-[var(--fg-faint)]">
                Includes {formatPaise(quote.taxPaise)} GST
              </p>

              {quote.warnings.length > 0 && (
                <ul className="mt-5 space-y-1.5">
                  {quote.warnings.map((warning) => (
                    <li
                      key={warning}
                      className="border-l-2 border-[var(--color-flag-warn)] pl-3 text-spec text-[var(--fg-muted)]"
                    >
                      {warning}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {placeError && (
            <div
              role="alert"
              className="mt-5 border-l-[3px] border-[var(--color-flag-bad)] bg-[var(--bg-sunken)] px-3.5 py-3"
            >
              <p className="text-spec leading-relaxed text-[var(--color-flag-bad)]">
                {placeError}
              </p>
            </div>
          )}

          {/*
            Disabled until there is a server-priced quote. Without one there
            is no total on screen, and a button that charges an amount the
            customer has not been shown is not a checkout.
          */}
          <button
            type="submit"
            disabled={placing || loading || !quote}
            className="btn btn-primary mt-7 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placing && <Loader2 size={16} className="animate-spin" />}
            {placing
              ? 'Placing your order'
              : method === 'cod'
                ? 'Place order'
                : `Pay now${quote ? ` · ${formatPaise(quote.totalPaise)}` : ''}`}
          </button>

          <p className="mt-3 text-spec leading-relaxed text-[var(--fg-faint)]">
            {method === 'cod'
              ? 'No payment now. Pay the courier when the order arrives.'
              : 'You will be taken to the payment window. Card and UPI details are entered with the payment provider, never on this site.'}
          </p>

          <Link
            href="/cart"
            className="mt-5 inline-block text-spec text-[var(--accent)] underline decoration-1 underline-offset-4"
          >
            Back to cart
          </Link>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  error,
  required,
  className = '',
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'>) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, '-');
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={`block ${className}`} htmlFor={id}>
      <span className="text-spec text-[var(--fg-muted)]">
        {label}
        {required && (
          <span className="text-[var(--color-flag-bad)]" aria-hidden>
            {' '}
            *
          </span>
        )}
      </span>
      <input
        {...rest}
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`mt-2 h-12 w-full rounded-[var(--radius-control)] border bg-[var(--bg-raised)] px-3.5 outline-none transition-colors ${
          error
            ? 'border-[var(--color-flag-bad)]'
            : 'border-[var(--hairline-strong)] focus:border-[var(--accent)]'
        }`}
      />
      {hint && !error && (
        <span id={`${id}-hint`} className="mt-1.5 block text-micro text-[var(--fg-faint)]">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="mt-1.5 block text-micro text-[var(--color-flag-bad)]">
          {error}
        </span>
      )}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-t border-[var(--hairline)] py-2 text-spec">
      <dt className="text-[var(--fg-muted)]">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}