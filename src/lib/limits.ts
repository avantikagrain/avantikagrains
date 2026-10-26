export const MAX_ITEM_QUANTITY = 10;

export const MAX_CART_LINES = 50;

export const BULK_ENQUIRY_THRESHOLD = MAX_ITEM_QUANTITY;

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  const whole = Math.floor(quantity);
  if (whole < 1) return 1;
  return Math.min(MAX_ITEM_QUANTITY, whole);
}
