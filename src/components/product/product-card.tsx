'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, Loader2, ShoppingBag, Zap } from 'lucide-react';
import { useCart } from '@/components/cart/cart-store';
import { formatPaise, savingsPercent } from '@/lib/format';
import type { ProductCardData } from '@/server/catalogue';

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  const { add, buyNow } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);

  const discount = savingsPercent(product.pricePaise, product.mrpPaise);

  const line = {
    productId: product.productId,
    variantId: product.variantId,
    slug: product.slug,
    name: product.name,
    packSize: product.packSize,
    imageUrl: product.imageUrl,
    pricePaise: product.pricePaise,
  };

  function handleAdd() {
    add(line);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  function handleBuyNow() {
    setBuying(true);
    buyNow(line);
    router.push('/checkout');
  }

  return (
    <article className="panel panel-hover gold-edge reveal group flex flex-col overflow-hidden rounded-[var(--radius-panel-lg)]">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="media">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
              fill
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 22vw"
              priority={priority}
              className="object-cover transition-transform duration-[var(--t-slow)] ease-[var(--ease-lux)] group-hover:scale-[1.05]"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-spec text-[var(--fg-faint)]">
              No image
            </span>
          )}

          {product.tag && (
            <span className="glass absolute left-3 top-3 rounded-[var(--radius-pill)] px-2.5 py-1 text-micro text-[var(--accent)]">
              {product.tag}
            </span>
          )}

          {discount !== null && (
            <span className="absolute right-3 top-3 rounded-[var(--radius-pill)] bg-[var(--gold)] px-2.5 py-1 text-micro font-semibold text-[var(--color-forest-900)]">
              {discount}% OFF
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="display text-h4 leading-tight transition-colors duration-[var(--t-fast)] group-hover:text-[var(--accent)]">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 text-micro uppercase tracking-[0.1em] text-[var(--fg-faint)]">
          {product.localName ? `${product.localName} · ` : ''}
          {product.packSize}
        </p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="display text-h4 tabular-nums text-[var(--accent)]">
            {formatPaise(product.pricePaise)}
          </span>
          {discount !== null && (
            <span className="text-spec tabular-nums text-[var(--fg-faint)] line-through">
              {formatPaise(product.mrpPaise)}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!product.inStock || buying}
            className="btn btn-primary !h-10 flex-1 !px-3 !text-micro"
          >
            {buying ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Opening
              </>
            ) : (
              <>
                <Zap size={14} strokeWidth={2} /> Buy now
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.inStock}
            aria-label={`Add ${product.name} to cart`}
            className="btn btn-outline !h-10 !w-11 flex-none !px-0"
          >
            {added ? (
              <Check size={16} strokeWidth={2} className="text-[var(--color-flag-good)]" />
            ) : (
              <ShoppingBag size={16} strokeWidth={1.7} />
            )}
          </button>
        </div>

        {!product.inStock && (
          <p className="mt-2.5 text-micro uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
            Out of stock
          </p>
        )}
      </div>
    </article>
  );
}
