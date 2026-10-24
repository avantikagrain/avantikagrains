/**
 * All monetary values in this system are integer paise.
 *
 * Floating point rupees are never persisted, never summed and never sent to
 * a payment gateway. Razorpay itself expects paise, so paise is also the
 * wire format — no conversion at the gateway boundary.
 */

export type Paise = number;

const PAISE_PER_RUPEE = 100;

export class MoneyError extends Error {}

/** Guard used wherever an untrusted number enters the money domain. */
export function assertPaise(value: unknown, label = 'amount'): asserts value is Paise {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new MoneyError(`${label} must be a finite number`);
  }
  if (!Number.isInteger(value)) {
    throw new MoneyError(`${label} must be an integer in paise, received ${value}`);
  }
  if (value < 0) {
    throw new MoneyError(`${label} must not be negative`);
  }
  if (value > Number.MAX_SAFE_INTEGER) {
    throw new MoneyError(`${label} exceeds the safe integer range`);
  }
}

export function rupeesToPaise(rupees: number): Paise {
  if (!Number.isFinite(rupees)) {
    throw new MoneyError('rupees must be a finite number');
  }
  // Naive Math.round(rupees * 100) loses a paisa on values that are not
  // exactly representable in binary: 1.005 * 100 evaluates to
  // 100.49999999999999 and rounds DOWN to 100. Normalising through a fixed
  // decimal representation first removes the drift before rounding.
  const scaled = Number((rupees * PAISE_PER_RUPEE).toFixed(6));
  return Math.round(scaled);
}

export function paiseToRupees(paise: Paise): number {
  assertPaise(paise);
  return paise / PAISE_PER_RUPEE;
}

export function addPaise(...amounts: Paise[]): Paise {
  return amounts.reduce((sum, a) => {
    assertPaise(a);
    return sum + a;
  }, 0);
}

export function subtractPaise(a: Paise, b: Paise): Paise {
  assertPaise(a);
  assertPaise(b);
  if (b > a) throw new MoneyError('subtraction would produce a negative amount');
  return a - b;
}

export function multiplyPaise(amount: Paise, quantity: number): Paise {
  assertPaise(amount);
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new MoneyError('quantity must be a non-negative integer');
  }
  return amount * quantity;
}

/**
 * Percentage of an amount, rounded half-up to the nearest paisa.
 * Used by the tax and coupon services; the rate itself comes from
 * verified store configuration, never from a hardcoded constant.
 */
export function percentOf(amount: Paise, ratePercent: number): Paise {
  assertPaise(amount);
  if (!Number.isFinite(ratePercent) || ratePercent < 0) {
    throw new MoneyError('rate must be a non-negative number');
  }
  return Math.round((amount * ratePercent) / 100);
}

/** Display formatting only — never feed this back into a calculation. */
export function formatINR(paise: Paise, opts: { withSymbol?: boolean } = {}): string {
  assertPaise(paise);
  const { withSymbol = true } = opts;
  const formatted = new Intl.NumberFormat('en-IN', {
    style: withSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: paise % PAISE_PER_RUPEE === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paiseToRupees(paise));
  return formatted;
}

/**
 * Discount percentage for display badges.
 * Returns null when there is no genuine saving, so the UI cannot render a
 * misleading "SAVE 0%" label.
 */
export function discountPercent(pricePaise: Paise, mrpPaise: Paise): number | null {
  assertPaise(pricePaise, 'price');
  assertPaise(mrpPaise, 'mrp');
  if (mrpPaise <= pricePaise) return null;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
