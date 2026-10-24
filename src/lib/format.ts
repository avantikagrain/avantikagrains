/**
 * Client-safe formatting helpers.
 *
 * Separate from src/lib/money.ts on purpose: that module throws on invalid
 * input and is imported by server code that touches env and the database.
 * This one is pure and safe to bundle into a client component.
 */

export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function savingsPercent(pricePaise: number, mrpPaise: number): number | null {
  if (mrpPaise <= pricePaise) return null;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
