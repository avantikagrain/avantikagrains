import { customAlphabet } from 'nanoid';

const UNAMBIGUOUS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const randomPart = customAlphabet(UNAMBIGUOUS, 6);

export function generateOrderNumber(now = new Date()): string {
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

export function formatInvoiceNumber(
  prefix: string,
  financialYear: string,
  sequence: number,
): string {
  return `${prefix}/${financialYear}/${String(sequence).padStart(5, '0')}`;
}

export function financialYearFor(date = new Date()): string {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}
