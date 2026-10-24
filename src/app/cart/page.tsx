'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart/cart-store';
import { formatPaise } from '@/lib/format';

export default function CartPage() {
  const { items, setQuantity, remove, displaySubtotalPaise, count, ready } = useCart();

  // Nothing renders until stored state has been read, otherwise the page
  // flashes "empty" on every load.
  if (!ready) {
    return (
      <div className="mx-auto max-w-[86rem] px-5 pb-20 pt-36 sm:px-8 sm:pt-44">
        <div className="h-7 w-40 animate-pulse bg-[var(--bg-raised)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[86rem] px-5 pb-24 pt-40 sm:px-8 sm:pt-48">
        <h1 className="display text-h1">Your cart is empty</h1>
        <p className="measure mt-5 text-lead text-[var(--fg-muted)]">
          Thirty-one products, all graded on the same line. The collection is a
          reasonable place to start.
        </p>
        <Link
          href="/products"
          className="mt-9 inline-flex h-11 items-center rounded-[var(--radius-control)] bg-[var(--accent)] px-6 text-spec text-[var(--color-cream-50)] transition-colors duration-[var(--t-fast)] hover:bg-[var(--accent-bright)]"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[86rem] px-5 pb-16 pt-36 sm:px-8 sm:pt-44">
      <h1 className="display text-h1">Cart</h1>
      <p className="mt-4 tabular-nums text-spec text-[var(--fg-faint)]">
        {count} {count === 1 ? 'item' : 'items'}
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
        <ul className="border-t border-[var(--hairline-strong)]">
          {items.map((item) => (
            <li
              key={item.variantId}
              className="grid grid-cols-[4.5rem_1fr_auto] gap-x-5 border-b border-[var(--hairline)] py-6"
            >
              <Link
                href={`/products/${item.slug}`}
                className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-raised)]"
              >
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="min-w-0">
                <Link href={`/products/${item.slug}`} className="display text-h4">
                  {item.name}
                </Link>
                <p className="mt-0.5 text-spec text-[var(--fg-faint)]">
                  {item.packSize} · {formatPaise(item.pricePaise)} each
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <div className="flex items-center border border-[var(--hairline)]">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                      aria-label={`Decrease quantity of ${item.name}`}
                      className="h-9 w-8 text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
                    >
                      −
                    </button>
                    <span className="w-8 text-center tabular-nums text-spec">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                      aria-label={`Increase quantity of ${item.name}`}
                      className="h-9 w-8 text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(item.variantId)}
                    className="text-spec text-[var(--fg-faint)] underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--color-flag-bad)]"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="tabular-nums text-body">
                {formatPaise(item.pricePaise * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="h-fit">
          <h2 className="display text-h3">Summary</h2>

          <div className="mt-6 flex items-baseline justify-between border-t border-[var(--hairline-strong)] pt-4">
            <span className="text-spec text-[var(--fg-muted)]">Items</span>
            <span className="tabular-nums text-body">
              {formatPaise(displaySubtotalPaise)}
            </span>
          </div>

          <p className="mt-5 text-spec leading-relaxed text-[var(--fg-faint)]">
            Shipping, GST and any discount are calculated on the server at checkout.
            The figure above is indicative.
          </p>

          <Link
            href="/checkout"
            className="mt-7 flex h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] text-spec text-[var(--color-cream-50)] transition-colors duration-[var(--t-fast)] hover:bg-[var(--accent-bright)]"
          >
            Continue to checkout
          </Link>

          <Link
            href="/products"
            className="mt-4 inline-block text-spec text-[var(--fg-muted)] underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--accent)]"
          >
            Keep shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
