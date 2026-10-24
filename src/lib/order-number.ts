import { customAlphabet } from 'nanoid';

/**
 * Order numbers are customer-facing: they get read out on support calls and
 * typed into the tracking form. The alphabet below excludes 0/O and 1/I/L,
 * which are the characters people actually get wrong.
 *
 * Format: AG-260421-K7M3QX  (prefix, YYMMDD, 6 random chars)
 *
 * ~1.07 billion combinations per day, so collisions are vanishingly rare —
 * but `orderNumber` carries a unique index, and `createOrder` retries on
 * duplicate-key rather than trusting the odds.
 */
const UNAMBIGUOUS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const randomPart = customAlphabet(UNAMBIGUOUS, 6);

export function generateOrderNumber(now = new Date()): string {
  // Order numbers are read in IST by the people handling them, so the date
  // segment is IST — not UTC, which would roll over at 05:30 local.
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const yy = String(ist.getUTCFullYear()).slice(-2);
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(ist.getUTCDate()).padStart(2, '0');
  return `AG-${yy}${mm}${dd}-${randomPart()}`;
}

const ORDER_NUMBER_PATTERN = /^AG-\d{6}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export function isValidOrderNumber(value: string): boolean {
  return ORDER_NUMBER_PATTERN.test(value.trim().toUpperCase());
}

/** Invoice numbers are sequential per financial year — GST requires this. */
export function formatInvoiceNumber(
  prefix: string,
  financialYear: string,
  sequence: number,
): string {
  return `${prefix}/${financialYear}/${String(sequence).padStart(5, '0')}`;
}

/** Indian financial year label for a date, e.g. "2026-27". */
export function financialYearFor(date = new Date()): string {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth() + 1; // 1-12
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}
