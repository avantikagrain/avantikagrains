'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Minus, Plus, ShoppingBag, Zap } from 'lucide-react';
import { useCart } from '@/components/cart/cart-store';
import { formatPaise } from '@/lib/format';

interface Variant {
  id: string;
  packSize: string;
  pricePaise: number;
  mrpPaise: number;
  inStock: boolean;
}

interface Product {
  slug: string;
  name: string;
  variants: Variant[];
  images: { url: string; alt: string }[];
}

export function AddToCart({ product }: { product: Product }) {
  const { add, buyNow } = useCart();
  const router = useRouter();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  if (!variant) return null;

  const line = {
    productId: product.slug,
    variantId: variant.id,
    slug: product.slug,
    name: product.name,
    packSize: variant.packSize,
    imageUrl: product.images[0]?.url ?? null,
    pricePaise: variant.pricePaise,
  };

  function handleAdd() {
    add(line, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  function handleBuyNow() {
    // Held until the route changes, so a double tap on a slow connection
    // cannot fire two navigations.
    setBuying(true);
    buyNow(line, quantity);
    router.push('/checkout');
  }

  return (
    <>
      <div className="mt-8">
        {product.variants.length > 1 && (
          <fieldset>
            <legend className="label">Pack size</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <label
                  key={v.id}
                  className={`cursor-pointer rounded-[var(--radius-control)] border px-4 py-2.5 text-spec tabular-nums transition-colors duration-[var(--t-fast)] ${
                    v.id === variantId
                      ? 'border-[var(--accent)] bg-[var(--color-forest-100)] font-medium text-[var(--accent)]'
                      : 'border-[var(--hairline-strong)] text-[var(--fg-muted)] hover:border-[var(--accent)]'
                  } ${v.inStock ? '' : 'cursor-not-allowed opacity-40'}`}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={v.id}
                    checked={v.id === variantId}
                    disabled={!v.inStock}
                    onChange={() => setVariantId(v.id)}
                    className="sr-only"
                  />
                  {v.packSize} · {formatPaise(v.pricePaise)}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-6 flex items-center gap-4">
          <span className="label">Quantity</span>
          <div className="flex items-center rounded-[var(--radius-pill)] border border-[var(--hairline-strong)]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="grid h-10 w-10 place-items-center rounded-full text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)] disabled:opacity-30"
            >
              <Minus size={15} />
            </button>
            <span aria-live="polite" className="w-8 text-center text-spec tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              disabled={quantity >= 99}
              aria-label="Increase quantity"
              className="grid h-10 w-10 place-items-center rounded-full text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)] disabled:opacity-30"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Buy now is the conversion path and gets the filled button; add
            to cart keeps a browsing shopper browsing. */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!variant.inStock || buying}
            className="btn btn-primary flex-1"
          >
            {buying ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Opening checkout
              </>
            ) : (
              <>
                <Zap size={16} strokeWidth={2} /> Buy now
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!variant.inStock}
            className="btn btn-outline flex-1"
          >
            {added ? (
              <>
                <Check size={16} className="text-[var(--color-flag-good)]" /> Added
              </>
            ) : (
              <>
                <ShoppingBag size={16} strokeWidth={1.7} /> Add to cart
              </>
            )}
          </button>
        </div>

        {!variant.inStock && (
          <p className="mt-3 text-spec text-[var(--fg-faint)]">
            This pack size is out of stock.
          </p>
        )}

        {added && (
          <Link
            href="/cart"
            className="mt-4 inline-block text-spec font-medium text-[var(--accent)] underline underline-offset-4"
          >
            View cart
          </Link>
        )}
      </div>

      {/* Mobile purchase bar.
          On a phone the buttons above scroll out of view exactly when
          someone finishes reading and decides. This keeps the action
          reachable; it only renders below lg, where that is true. */}
      <div
        className="glass fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-[var(--hairline)] px-4 py-3 lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-micro text-[var(--fg-faint)]">{variant.packSize}</p>
          <p className="display text-h4 tabular-nums leading-tight text-[var(--accent)]">
            {formatPaise(variant.pricePaise * quantity)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!variant.inStock}
          aria-label="Add to cart"
          className="btn btn-outline !h-11 !w-12 flex-none !px-0"
        >
          <ShoppingBag size={17} strokeWidth={1.7} />
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!variant.inStock || buying}
          className="btn btn-primary !h-11 flex-none !px-6 !text-spec"
        >
          {buying ? <Loader2 size={15} className="animate-spin" /> : 'Buy now'}
        </button>
      </div>
    </>
  );
}
