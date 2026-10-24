'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * Browser-side cart.
 *
 * Holds identifiers and quantities ONLY. The price shown in the cart is a
 * convenience for the shopper; the price actually charged is recomputed
 * server-side at /api/v1/checkout/quote from the database. Nothing stored
 * here is ever trusted as money.
 *
 * The cart lives in a module-level store rather than component state, read
 * through `useSyncExternalStore`. That buys three things over the previous
 * state-plus-effect version:
 *
 *   - no extra render on mount, because the stored cart is read during the
 *     first post-hydration render instead of being set afterwards;
 *   - writes happen in the mutation, not in an effect watching the value,
 *     so the cart cannot be one render stale on disk;
 *   - a `storage` listener keeps tabs in step — add something in one tab
 *     and the badge updates in the other, which people notice when they
 *     have the shop open twice.
 */

export interface CartItem {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  packSize: string;
  imageUrl: string | null;
  quantity: number;
  /** Display only — re-verified on the server at checkout. */
  pricePaise: number;
}

const STORAGE_KEY = 'ag_cart_v1';
const MAX_QTY = 99;

/**
 * Stable empty array.
 *
 * `getSnapshot` must return the same reference when nothing has changed or
 * React re-renders for ever, so an empty cart cannot be a fresh `[]`.
 */
const EMPTY: CartItem[] = [];

function readStorage(): CartItem[] {
  // Storage throws in private mode and when site data is blocked, so every
  // access is guarded and failure degrades to an empty cart.
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const items = parsed.filter(
      (i): i is CartItem =>
        typeof i === 'object' && i !== null && 'variantId' in i && 'quantity' in i,
    );
    return items.length > 0 ? items : EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeStorage(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Over quota or blocked — the cart still works for this page session.
  }
}

let snapshot: CartItem[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

/**
 * Reads the stored cart the first time a snapshot is needed on the client.
 *
 * Deferred to first read rather than done at module load so that importing
 * this file has no side effect, which matters because it is pulled into the
 * server bundle graph as well.
 */
function currentSnapshot(): CartItem[] {
  if (!hydrated) {
    hydrated = true;
    snapshot = readStorage();
  }
  return snapshot;
}

/**
 * During hydration React uses this instead, so the first client render
 * matches the server HTML exactly. It re-reads `currentSnapshot` straight
 * afterwards and re-renders if the stored cart was not empty.
 */
function serverSnapshot(): CartItem[] {
  return EMPTY;
}

function emit() {
  for (const listener of listeners) listener();
}

function onStorageEvent(event: StorageEvent) {
  // Only our key, and only genuine cross-document writes — a same-tab write
  // does not fire this event, so there is no feedback loop to guard.
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  snapshot = readStorage();
  emit();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener('storage', onStorageEvent);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener('storage', onStorageEvent);
    }
  };
}

/** The single way the cart ever changes. */
function update(next: (current: CartItem[]) => CartItem[]) {
  const value = next(currentSnapshot());
  snapshot = value.length > 0 ? value : EMPTY;
  writeStorage(snapshot);
  emit();
}

function useCartItems(): CartItem[] {
  return useSyncExternalStore(subscribe, currentSnapshot, serverSnapshot);
}

/**
 * False during server render and hydration, true once the stored cart has
 * been read. Components use it to avoid rendering a count that the server
 * could not know — the cart badge above all.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export interface CartContextValue {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  /**
   * Adds the item and reports that checkout should follow. Kept separate
   * from `add` so "Buy now" cannot be confused with a normal add in
   * analytics or in a component's own state.
   */
  buyNow: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  count: number;
  displaySubtotalPaise: number;
  ready: boolean;
}

export function useCart(): CartContextValue {
  const items = useCartItems();
  const ready = useHydrated();

  const add = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    update((current) => {
      const existing = current.find((i) => i.variantId === item.variantId);
      if (existing) {
        return current.map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + quantity) }
            : i,
        );
      }
      return [...current, { ...item, quantity: Math.min(MAX_QTY, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    update((current) =>
      quantity <= 0
        ? current.filter((i) => i.variantId !== variantId)
        : current.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.min(MAX_QTY, Math.floor(quantity)) }
              : i,
          ),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    update((current) => current.filter((i) => i.variantId !== variantId));
  }, []);

  const clear = useCallback(() => update(() => EMPTY), []);

  const buyNow = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    // Replace rather than append: "Buy now" means this item, not this item
    // plus whatever was left in the cart from an earlier visit.
    update(() => [{ ...item, quantity: Math.min(MAX_QTY, quantity) }]);
  }, []);

  return useMemo(
    () => ({
      items,
      add,
      buyNow,
      setQuantity,
      remove,
      clear,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      displaySubtotalPaise: items.reduce((sum, i) => sum + i.pricePaise * i.quantity, 0),
      ready,
    }),
    [items, add, buyNow, setQuantity, remove, clear, ready],
  );
}

/**
 * Kept so the root layout can declare where the cart belongs in the tree,
 * and so a future server-rendered cart has somewhere to inject state. The
 * store itself is module-level, so this renders its children unchanged.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
