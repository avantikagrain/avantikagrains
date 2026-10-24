import { describe, it, expect } from 'vitest';
import {
  addPaise,
  discountPercent,
  formatINR,
  MoneyError,
  multiplyPaise,
  paiseToRupees,
  percentOf,
  rupeesToPaise,
  subtractPaise,
} from '@/lib/money';

describe('paise conversion', () => {
  it('converts rupees to paise without float drift', () => {
    expect(rupeesToPaise(149)).toBe(14900);
    expect(rupeesToPaise(0.1)).toBe(10);
    // 1.005 * 100 is 100.49999... in binary float; must still round to 101.
    expect(rupeesToPaise(1.005)).toBe(101);
  });

  it('round-trips the real catalogue prices', () => {
    for (const rupees of [89, 99, 110, 149, 159, 199, 299, 349, 449, 499, 799]) {
      expect(paiseToRupees(rupeesToPaise(rupees))).toBe(rupees);
    }
  });
});

describe('paise guards', () => {
  it('rejects non-integer amounts', () => {
    expect(() => addPaise(14900.5)).toThrow(MoneyError);
  });

  it('rejects negative amounts', () => {
    expect(() => addPaise(-1)).toThrow(MoneyError);
  });

  it('refuses a subtraction that would go negative', () => {
    expect(() => subtractPaise(10000, 15000)).toThrow(MoneyError);
  });

  it('rejects fractional quantities', () => {
    expect(() => multiplyPaise(14900, 1.5)).toThrow(MoneyError);
  });
});

describe('order arithmetic', () => {
  it('computes a realistic cart total', () => {
    // 2 x Emmer Wheat (₹149) + 1 x Quinoa (₹349)
    const emmer = multiplyPaise(14900, 2);
    const quinoa = multiplyPaise(34900, 1);
    const subtotal = addPaise(emmer, quinoa);
    expect(subtotal).toBe(64700);
    expect(formatINR(subtotal)).toBe('₹647');
  });

  it('rounds percentage calculations half-up to the paisa', () => {
    // 5% of ₹110 = ₹5.50
    expect(percentOf(11000, 5)).toBe(550);
    // 5% of ₹99.01 = 495.05 paise -> 495
    expect(percentOf(9901, 5)).toBe(495);
  });
});

describe('discount badges', () => {
  it('matches the live catalogue savings', () => {
    expect(discountPercent(14900, 17900)).toBe(17); // Emmer Wheat
    expect(discountPercent(49900, 59900)).toBe(17); // Hemp Seeds
    expect(discountPercent(79900, 94900)).toBe(16); // Super Seeds Combo
  });

  it('returns null when there is no genuine saving', () => {
    expect(discountPercent(14900, 14900)).toBeNull();
    expect(discountPercent(14900, 10000)).toBeNull();
  });
});

describe('formatINR', () => {
  it('omits decimals for whole rupees and shows them otherwise', () => {
    expect(formatINR(14900)).toBe('₹149');
    expect(formatINR(14950)).toBe('₹149.50');
  });
});
