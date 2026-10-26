import { describe, it, expect } from 'vitest';
import { allocateDiscount, splitInclusiveTax } from '@/services/pricing';
import { generateOrderNumber, financialYearFor, isValidOrderNumber } from '@/lib/order-number';

describe('inclusive GST extraction', () => {
  it('splits a 5% inclusive price so the parts sum back exactly', () => {
    const { taxablePaise, taxPaise } = splitInclusiveTax(14900, 5);
    expect(taxablePaise + taxPaise).toBe(14900);
    expect(taxablePaise).toBe(14190);
    expect(taxPaise).toBe(710);
  });

  it('never loses or invents a paisa across the whole catalogue', () => {
    const prices = [8900, 9900, 11000, 13000, 13900, 14500, 14900, 15900,
                    16000, 16900, 18000, 18900, 19900, 29900, 34900, 44900, 49900, 79900];
    for (const price of prices) {
      for (const rate of [0, 5, 12, 18]) {
        const { taxablePaise, taxPaise } = splitInclusiveTax(price, rate);
        expect(taxablePaise + taxPaise).toBe(price);
        expect(Number.isInteger(taxPaise)).toBe(true);
        expect(taxPaise).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('treats a zero rate as no tax', () => {
    expect(splitInclusiveTax(14900, 0)).toEqual({ taxablePaise: 14900, taxPaise: 0 });
  });
});

describe('discount allocation', () => {
  it('distributes exactly, with no paisa created or lost', () => {
    const lines = [14900, 34900, 19900];
    const allocated = allocateDiscount(lines, 5000);
    expect(allocated.reduce((s, v) => s + v, 0)).toBe(5000);
  });

  it('handles an indivisible remainder', () => {
    const allocated = allocateDiscount([10000, 10000, 10000], 100);
    expect(allocated.reduce((s, v) => s + v, 0)).toBe(100);
    expect(allocated).toHaveLength(3);
  });

  it('never allocates more to a line than the line is worth', () => {
    const lines = [100, 50000];
    const allocated = allocateDiscount(lines, 49000);
    expect(allocated.reduce((s, v) => s + v, 0)).toBe(49000);
    allocated.forEach((value, i) => {
      expect(value).toBeLessThanOrEqual(lines[i]);
    });
  });

  it('returns zeros for no discount', () => {
    expect(allocateDiscount([14900, 34900], 0)).toEqual([0, 0]);
  });

  it('survives an empty-value cart without dividing by zero', () => {
    expect(allocateDiscount([0, 0], 500)).toEqual([0, 0]);
  });

  it('allocates a 100% discount exactly', () => {
    const lines = [14900, 34900, 19900];
    const total = lines.reduce((s, v) => s + v, 0);
    const allocated = allocateDiscount(lines, total);
    expect(allocated.reduce((s, v) => s + v, 0)).toBe(total);
  });
});

describe('order numbers', () => {
  it('produces the documented format', () => {
    const number = generateOrderNumber(new Date('2026-04-21T10:00:00Z'));
    expect(number).toMatch(/^AG-260421-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
    expect(isValidOrderNumber(number)).toBe(true);
  });

  it('uses the IST date, not UTC', () => {
    const number = generateOrderNumber(new Date('2026-04-20T20:30:00Z'));
    expect(number.startsWith('AG-260421-')).toBe(true);
  });

  it('excludes characters people misread', () => {
    for (let i = 0; i < 200; i += 1) {
      const suffix = generateOrderNumber().split('-')[2];
      expect(suffix).not.toMatch(/[01OIL]/);
    }
  });

  it('does not collide across many generations', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i += 1) seen.add(generateOrderNumber());
    expect(seen.size).toBe(5000);
  });

  it('rejects a malformed order number', () => {
    expect(isValidOrderNumber('AG-2604-ABC')).toBe(false);
    expect(isValidOrderNumber('XX-260421-K7M3QX')).toBe(false);
  });
});

describe('financial year', () => {
  it('starts in April', () => {
    expect(financialYearFor(new Date('2026-04-01T06:00:00Z'))).toBe('2026-27');
    expect(financialYearFor(new Date('2026-03-31T06:00:00Z'))).toBe('2025-26');
  });

  it('keeps January in the previous April year', () => {
    expect(financialYearFor(new Date('2027-01-15T06:00:00Z'))).toBe('2026-27');
  });
});
