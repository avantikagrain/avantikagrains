'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { formatPaise } from '@/lib/format';
import { StatusBadge } from '../ui';

interface Variant {
  id: string;
  sku: string;
  packSize: string;
  pricePaise: number;
  mrpPaise: number;
  stockQty: number;
  reservedQty: number;
  availableQty: number;
  lowStockThreshold: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  variants: Variant[];
}

type Draft = Record<string, { priceRupees: string; stockQty: string }>;

function toDraft(variants: Variant[]): Draft {
  return Object.fromEntries(
    variants.map((variant) => [
      variant.id,
      {
        priceRupees: (variant.pricePaise / 100).toString(),
        stockQty: variant.stockQty.toString(),
      },
    ]),
  );
}

export function ProductRow({ product, canWrite }: { product: Product; canWrite: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(product.variants));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const lowStock = product.variants.some(
    (variant) => variant.isActive && variant.availableQty <= variant.lowStockThreshold,
  );

  function change(variantId: string, field: 'priceRupees' | 'stockQty', value: string) {
    setDraft((current) => ({
      ...current,
      [variantId]: { ...current[variantId], [field]: value },
    }));
    setSaved(false);
  }

  function buildUpdates() {
    const updates: {
      variantId: string;
      pricePaise?: number;
      stockQty?: number;
    }[] = [];

    for (const variant of product.variants) {
      const entry = draft[variant.id];
      if (!entry) continue;

      const update: { variantId: string; pricePaise?: number; stockQty?: number } = {
        variantId: variant.id,
      };
      let changed = false;

      const rupees = Number(entry.priceRupees);
      if (Number.isFinite(rupees) && rupees > 0) {
        const paise = Math.round(rupees * 100);
        if (paise !== variant.pricePaise) {
          update.pricePaise = paise;
          changed = true;
        }
      }

      const stock = Number(entry.stockQty);
      if (Number.isInteger(stock) && stock >= 0 && stock !== variant.stockQty) {
        update.stockQty = stock;
        changed = true;
      }

      if (changed) updates.push(update);
    }

    return updates;
  }

  async function save() {
    const variants = buildUpdates();
    if (variants.length === 0) return;

    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const response = await apiFetch(`/api/v1/admin/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ variants }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error?.message ?? 'The changes could not be saved.');
        setBusy(false);
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    }

    setBusy(false);
  }

  async function toggleStatus() {
    setBusy(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/v1/admin/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: product.status === 'active' ? 'draft' : 'active',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error?.message ?? 'The status could not be changed.');
        setBusy(false);
        return;
      }

      router.refresh();
    } catch {
      setError('Could not reach the server.');
    }

    setBusy(false);
  }

  const dirty = buildUpdates().length > 0;

  return (
    <li className="border-b border-[var(--hairline)] last:border-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <ChevronDown
            size={16}
            className={`flex-none text-[var(--fg-faint)] transition-transform duration-[var(--t-fast)] ${
              open ? 'rotate-180' : ''
            }`}
          />
          <span className="min-w-0">
            <span className="block truncate text-body font-medium">{product.name}</span>
            <span className="block text-micro text-[var(--fg-faint)]">
              {product.variants.length} pack size
              {product.variants.length === 1 ? '' : 's'} · {product.slug}
            </span>
          </span>
        </button>

        {lowStock && (
          <span className="rounded-[var(--radius-pill)] bg-[var(--color-cream-200)] px-2.5 py-1 text-micro font-medium text-[var(--color-flag-bad)]">
            Low stock
          </span>
        )}

        <StatusBadge status={product.status} />

        <Link
          href={`/products/${product.slug}`}
          className="text-micro text-[var(--fg-muted)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
        >
          View
        </Link>

        {canWrite && (
          <button
            type="button"
            onClick={toggleStatus}
            disabled={busy}
            className="rounded-[var(--radius-control)] border border-[var(--hairline-strong)] px-3 py-1.5 text-micro text-[var(--fg-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
          >
            {product.status === 'active' ? 'Unpublish' : 'Publish'}
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-[var(--hairline)] bg-[var(--bg-panel)] px-5 py-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-spec">
              <thead>
                <tr className="text-left text-micro uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
                  <th className="pb-2 pr-4 font-medium">Pack</th>
                  <th className="pb-2 pr-4 font-medium">SKU</th>
                  <th className="pb-2 pr-4 font-medium">Price (₹)</th>
                  <th className="pb-2 pr-4 font-medium">Stock</th>
                  <th className="pb-2 pr-4 font-medium">Reserved</th>
                  <th className="pb-2 font-medium">Available</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((variant) => (
                  <tr key={variant.id} className="border-t border-[var(--hairline)]">
                    <td className="py-2.5 pr-4">{variant.packSize}</td>
                    <td className="py-2.5 pr-4 text-[var(--fg-faint)]">{variant.sku}</td>
                    <td className="py-2.5 pr-4">
                      {canWrite ? (
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={draft[variant.id]?.priceRupees ?? ''}
                          onChange={(event) =>
                            change(variant.id, 'priceRupees', event.target.value)
                          }
                          aria-label={`Price for ${variant.sku}`}
                          className="h-8 w-24 rounded-[var(--radius-control)] border border-[var(--hairline-strong)] bg-[var(--bg-raised)] px-2 tabular-nums outline-none focus:border-[var(--accent)]"
                        />
                      ) : (
                        <span className="tabular-nums">{formatPaise(variant.pricePaise)}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      {canWrite ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={draft[variant.id]?.stockQty ?? ''}
                          onChange={(event) =>
                            change(variant.id, 'stockQty', event.target.value)
                          }
                          aria-label={`Stock for ${variant.sku}`}
                          className="h-8 w-20 rounded-[var(--radius-control)] border border-[var(--hairline-strong)] bg-[var(--bg-raised)] px-2 tabular-nums outline-none focus:border-[var(--accent)]"
                        />
                      ) : (
                        <span className="tabular-nums">{variant.stockQty}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-[var(--fg-faint)]">
                      {variant.reservedQty}
                    </td>
                    <td
                      className={`py-2.5 tabular-nums ${
                        variant.availableQty <= variant.lowStockThreshold
                          ? 'font-medium text-[var(--color-flag-bad)]'
                          : ''
                      }`}
                    >
                      {variant.availableQty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-spec text-[var(--color-flag-bad)]">
              {error}
            </p>
          )}

          {canWrite && (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={busy || !dirty}
                className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-spec text-[var(--color-cream-50)] transition-colors duration-[var(--t-fast)] hover:bg-[var(--accent-bright)] disabled:opacity-40"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                {busy ? 'Saving' : 'Save changes'}
              </button>
              {saved && !dirty && (
                <span aria-live="polite" className="text-micro text-[var(--color-flag-good)]">
                  Saved
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
