'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { MAX_ITEM_QUANTITY, clampQuantity } from '@/lib/limits';

export interface CartItem {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  packSize: string;
  imageUrl: string | null;
  quantity: number;

  pricePaise: number;
}

const STORAGE_KEY = 'ag_cart_v1';

const EMPTY: CartItem[] = [];

function readStorage(): CartItem[] {
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
    return;
  }
}

let snapshot: CartItem[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function currentSnapshot(): CartItem[] {
  if (!hydrated) {
    hydrated = true;
    snapshot = readStorage();
  }
  return snapshot;
}

function serverSnapshot(): CartItem[] {
  return EMPTY;
}

function emit() {
  for (const listener of listeners) listener();
}

function onStorageEvent(event: StorageEvent) {
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

function update(next: (current: CartItem[]) => CartItem[]) {
  const value = next(currentSnapshot());
  snapshot = value.length > 0 ? value : EMPTY;
  writeStorage(snapshot);
  emit();
}

function useCartItems(): CartItem[] {
  return useSyncExternalStore(subscribe, currentSnapshot, serverSnapshot);
}

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

  buyNow: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  count: number;
  displaySubtotalPaise: number;
  ready: boolean;
  maxQuantity: number;
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
            ? { ...i, quantity: clampQuantity(i.quantity + quantity) }
            : i,
        );
      }
      return [...current, { ...item, quantity: clampQuantity(quantity) }];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    update((current) =>
      quantity <= 0
        ? current.filter((i) => i.variantId !== variantId)
        : current.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: clampQuantity(quantity) }
              : i,
          ),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    update((current) => current.filter((i) => i.variantId !== variantId));
  }, []);

  const clear = useCallback(() => update(() => EMPTY), []);

  const buyNow = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    update(() => [{ ...item, quantity: clampQuantity(quantity) }]);
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
      maxQuantity: MAX_ITEM_QUANTITY,
    }),
    [items, add, buyNow, setQuantity, remove, clear, ready],
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
