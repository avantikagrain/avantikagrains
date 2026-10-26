export type Paise = number;

const PAISE_PER_RUPEE = 100;

export class MoneyError extends Error {}

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

export function percentOf(amount: Paise, ratePercent: number): Paise {
  assertPaise(amount);
  if (!Number.isFinite(ratePercent) || ratePercent < 0) {
    throw new MoneyError('rate must be a non-negative number');
  }
  return Math.round((amount * ratePercent) / 100);
}

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

export function discountPercent(pricePaise: Paise, mrpPaise: Paise): number | null {
  assertPaise(pricePaise, 'price');
  assertPaise(mrpPaise, 'mrp');
  if (mrpPaise <= pricePaise) return null;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
