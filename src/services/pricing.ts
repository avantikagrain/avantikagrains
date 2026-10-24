import type { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Coupon, Order, Product, StoreSettings, type IStoreSettings } from '@/models';
import { AppError, badRequest, outOfStock } from '@/lib/errors';
import { addPaise, assertPaise, multiplyPaise, percentOf } from '@/lib/money';
import type { PaymentMethod } from '@/models/Order';

/**
 * The single source of truth for what an order costs.
 *
 * Nothing in this module reads a price, discount, tax or total from the
 * request. Everything is recomputed from the database on every call, and the
 * result of this function is what gets written to the Order and sent to the
 * payment gateway.
 *
 * Indian B2C retail convention: displayed prices are GST-inclusive. Tax is
 * therefore *extracted* from the price, not added on top — adding it on top
 * would overcharge every customer by the GST rate.
 */

export interface QuoteItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface QuoteInput {
  items: QuoteItemInput[];
  couponCode?: string;
  pincode?: string;
  paymentMethod: PaymentMethod;
  userId?: string;
}

export interface QuoteLine {
  product: Types.ObjectId;
  variantId: Types.ObjectId;
  sku: string;
  name: string;
  localName?: string;
  packSize: string;
  imageUrl?: string;
  quantity: number;
  unitPricePaise: number;
  unitMrpPaise: number;
  lineSubtotalPaise: number;
  /** Share of the order-level discount attributed to this line. */
  lineDiscountPaise: number;
  hsnCode?: string;
  gstRatePercent?: number;
  lineTaxPaise: number;
  weightGrams: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  codFeePaise: number;
  totalPaise: number;
  totalWeightGrams: number;
  couponCode?: string;
  /** Non-fatal: shown to the customer, does not block checkout. */
  warnings: string[];
}

const EMPTY_CART = 'Your cart is empty';

async function loadSettings(): Promise<IStoreSettings> {
  const settings = await StoreSettings.findOne({ key: 'default' });
  if (!settings) {
    throw new AppError(
      'INTERNAL_ERROR',
      'Store settings have not been configured. Run the admin setup before accepting orders.',
    );
  }
  return settings;
}

/**
 * Splits a GST-inclusive amount into taxable value and tax.
 * Rounding is applied to the tax component so the two always sum back to
 * the original amount — no stray paisa appears or disappears on an invoice.
 */
export function splitInclusiveTax(
  inclusivePaise: number,
  ratePercent: number,
): { taxablePaise: number; taxPaise: number } {
  assertPaise(inclusivePaise);
  if (ratePercent <= 0) return { taxablePaise: inclusivePaise, taxPaise: 0 };

  const taxable = Math.round((inclusivePaise * 100) / (100 + ratePercent));
  return { taxablePaise: taxable, taxPaise: inclusivePaise - taxable };
}

/**
 * Distributes an order-level discount across lines proportionally, with the
 * rounding remainder assigned to the largest line. Guarantees the parts sum
 * exactly to the whole — otherwise the Order model's reconciliation check
 * rejects the save.
 */
export function allocateDiscount(
  lineSubtotals: number[],
  totalDiscount: number,
): number[] {
  const subtotal = lineSubtotals.reduce((s, v) => s + v, 0);
  if (totalDiscount <= 0 || subtotal <= 0) return lineSubtotals.map(() => 0);

  const allocated = lineSubtotals.map((line) =>
    Math.floor((line * totalDiscount) / subtotal),
  );

  let remainder = totalDiscount - allocated.reduce((s, v) => s + v, 0);

  // Hand the leftover paise to the largest lines, one at a time.
  const order = lineSubtotals
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value);

  let cursor = 0;
  while (remainder > 0) {
    const target = order[cursor % order.length].index;
    // Never let a line's discount exceed the line itself.
    if (allocated[target] < lineSubtotals[target]) {
      allocated[target] += 1;
      remainder -= 1;
    }
    cursor += 1;
    if (cursor > order.length * 2 + totalDiscount) break; // safety valve
  }

  return allocated;
}

function computeShipping(
  settings: IStoreSettings,
  subtotalAfterDiscount: number,
): number {
  const { freeShippingThresholdPaise, flatRatePaise } = settings.shipping ?? {};

  if (flatRatePaise === undefined) {
    throw new AppError(
      'SHIPPING_UNAVAILABLE',
      'Shipping rates have not been configured for this store.',
    );
  }

  if (
    freeShippingThresholdPaise !== undefined &&
    subtotalAfterDiscount >= freeShippingThresholdPaise
  ) {
    return 0;
  }

  return flatRatePaise;
}

async function resolveCouponDiscount(
  code: string,
  lines: QuoteLine[],
  subtotal: number,
  paymentMethod: PaymentMethod,
  userId: string | undefined,
): Promise<number> {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

  if (!coupon) throw new AppError('COUPON_INVALID', 'This coupon code is not valid');

  const now = new Date();
  if (!coupon.isActive) throw new AppError('COUPON_INVALID', 'This coupon is no longer active');
  if (coupon.startsAt > now) throw new AppError('COUPON_INVALID', 'This coupon is not active yet');
  if (coupon.endsAt && coupon.endsAt < now) {
    throw new AppError('COUPON_INVALID', 'This coupon has expired');
  }
  if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) {
    throw new AppError('COUPON_INVALID', 'This coupon has reached its usage limit');
  }
  if (!coupon.allowedPaymentMethods.includes(paymentMethod)) {
    throw new AppError(
      'COUPON_INVALID',
      paymentMethod === 'cod'
        ? 'This coupon cannot be used with Cash on Delivery'
        : 'This coupon cannot be used with online payment',
    );
  }
  if (subtotal < coupon.minOrderPaise) {
    throw new AppError(
      'COUPON_INVALID',
      `This coupon requires a minimum order value of ₹${coupon.minOrderPaise / 100}`,
    );
  }

  if (userId) {
    const timesUsed = await Order.countDocuments({
      user: userId,
      couponCode: coupon.code,
      status: { $nin: ['cancelled'] },
    });
    if (timesUsed >= coupon.perUserUsageLimit) {
      throw new AppError('COUPON_INVALID', 'You have already used this coupon');
    }
    if (coupon.firstOrderOnly) {
      const previousOrders = await Order.countDocuments({
        user: userId,
        status: { $nin: ['cancelled'] },
      });
      if (previousOrders > 0) {
        throw new AppError('COUPON_INVALID', 'This coupon is valid on your first order only');
      }
    }
  }

  // Restrict to the eligible subset of the cart, if the coupon is scoped.
  const scoped = coupon.appliesToProducts.length > 0 || coupon.appliesToCategories.length > 0;
  const eligibleSubtotal = scoped
    ? lines
        .filter(
          (l) =>
            coupon.appliesToProducts.some((p) => p.equals(l.product)) &&
            !coupon.excludedProducts.some((p) => p.equals(l.product)),
        )
        .reduce((s, l) => s + l.lineSubtotalPaise, 0)
    : lines
        .filter((l) => !coupon.excludedProducts.some((p) => p.equals(l.product)))
        .reduce((s, l) => s + l.lineSubtotalPaise, 0);

  if (eligibleSubtotal <= 0) {
    throw new AppError('COUPON_INVALID', 'This coupon does not apply to the items in your cart');
  }

  let discount: number;
  switch (coupon.type) {
    case 'percentage': {
      discount = percentOf(eligibleSubtotal, coupon.valuePercent ?? 0);
      if (coupon.maxDiscountPaise !== undefined) {
        discount = Math.min(discount, coupon.maxDiscountPaise);
      }
      break;
    }
    case 'fixed_amount':
      discount = Math.min(coupon.valuePaise ?? 0, eligibleSubtotal);
      break;
    case 'free_shipping':
      // Handled by zeroing shipping, not by discounting goods.
      discount = 0;
      break;
  }

  return Math.min(discount, subtotal);
}

/**
 * Builds a priced quote. Called by the checkout preview AND by order
 * creation — the customer therefore cannot be shown one number and charged
 * another.
 */
export async function quoteOrder(input: QuoteInput): Promise<Quote> {
  await connectDB();

  if (input.items.length === 0) throw badRequest(EMPTY_CART);

  const settings = await loadSettings();
  const warnings: string[] = [];

  // --- Build line snapshots from database truth ----------------------------
  const lines: QuoteLine[] = [];

  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw badRequest('Quantity must be a positive whole number');
    }

    const product = await Product.findById(item.productId);
    if (!product) throw badRequest('One of the items in your cart is no longer available');

    if (product.status !== 'active') {
      throw badRequest(`"${product.name}" is not available for purchase`);
    }

    const variant = product.variants.find((v) => v._id.toString() === item.variantId);
    if (!variant || !variant.isActive) {
      throw badRequest(`The selected pack size for "${product.name}" is unavailable`);
    }

    if (variant.availableQty < item.quantity) {
      throw outOfStock(
        variant.availableQty === 0
          ? `"${product.name} (${variant.packSize})" is out of stock`
          : `Only ${variant.availableQty} left of "${product.name} (${variant.packSize})"`,
        { sku: variant.sku, available: variant.availableQty, requested: item.quantity },
      );
    }

    const lineSubtotal = multiplyPaise(variant.pricePaise, item.quantity);

    lines.push({
      product: product._id,
      variantId: variant._id,
      sku: variant.sku,
      name: product.name,
      localName: product.localName,
      packSize: variant.packSize,
      imageUrl: product.images[0]?.url,
      quantity: item.quantity,
      unitPricePaise: variant.pricePaise,
      unitMrpPaise: variant.mrpPaise,
      lineSubtotalPaise: lineSubtotal,
      lineDiscountPaise: 0,
      hsnCode: product.tax?.hsnCode,
      gstRatePercent: product.tax?.gstRatePercent,
      lineTaxPaise: 0,
      weightGrams: variant.weightGrams * item.quantity,
    });
  }

  const subtotalPaise = addPaise(...lines.map((l) => l.lineSubtotalPaise));

  // --- Coupon --------------------------------------------------------------
  let discountPaise = 0;
  let freeShipping = false;

  if (input.couponCode) {
    const coupon = await Coupon.findOne({ code: input.couponCode.trim().toUpperCase() });
    freeShipping = coupon?.type === 'free_shipping';
    discountPaise = await resolveCouponDiscount(
      input.couponCode,
      lines,
      subtotalPaise,
      input.paymentMethod,
      input.userId,
    );
  }

  const allocations = allocateDiscount(
    lines.map((l) => l.lineSubtotalPaise),
    discountPaise,
  );
  lines.forEach((line, i) => {
    line.lineDiscountPaise = allocations[i];
  });

  const subtotalAfterDiscount = subtotalPaise - discountPaise;

  // --- Shipping ------------------------------------------------------------
  const shippingPaise = freeShipping ? 0 : computeShipping(settings, subtotalAfterDiscount);

  // --- COD fee -------------------------------------------------------------
  let codFeePaise = 0;
  if (input.paymentMethod === 'cod') {
    const cod = settings.cod;
    if (!cod?.enabled) {
      throw badRequest('Cash on Delivery is not available at the moment');
    }
    if (input.pincode && cod.blockedPincodes.includes(input.pincode)) {
      throw badRequest('Cash on Delivery is not available for this PIN code');
    }
    const goodsTotal = subtotalAfterDiscount + shippingPaise;
    if (goodsTotal < cod.minOrderPaise) {
      throw badRequest(
        `Cash on Delivery requires an order of at least ₹${cod.minOrderPaise / 100}`,
      );
    }
    if (goodsTotal > cod.maxOrderPaise) {
      throw badRequest(
        `Cash on Delivery is not available above ₹${cod.maxOrderPaise / 100}. Please pay online.`,
      );
    }
    codFeePaise = cod.feePaise;
  }

  // --- Tax -----------------------------------------------------------------
  // Prices are GST-inclusive, so tax is extracted from the discounted line
  // value rather than added. taxPaise is reported for the invoice; it is
  // already contained within subtotal - discount.
  let taxPaise = 0;

  if (settings.tax?.pricesIncludeTax !== false) {
    for (const line of lines) {
      const rate = line.gstRatePercent;
      if (rate === undefined) {
        // Unreachable for active products (the Product model blocks
        // publication without a rate) but left explicit rather than
        // silently taxing at zero.
        warnings.push(`Tax rate missing for ${line.sku}; invoice will need manual correction`);
        continue;
      }
      const taxableBase = line.lineSubtotalPaise - line.lineDiscountPaise;
      line.lineTaxPaise = splitInclusiveTax(taxableBase, rate).taxPaise;
      taxPaise += line.lineTaxPaise;
    }

    const shippingRate = settings.tax?.shippingGstRatePercent;
    if (shippingPaise > 0 && shippingRate !== undefined) {
      taxPaise += splitInclusiveTax(shippingPaise, shippingRate).taxPaise;
    }
  } else {
    throw new AppError(
      'INTERNAL_ERROR',
      'Tax-exclusive pricing is configured but not implemented. Confirm the pricing model with the business.',
    );
  }

  // --- Total ---------------------------------------------------------------
  // Tax is inclusive, so it is NOT added again here. The Order model
  // reconciles: subtotal - discount + shipping + tax + codFee === total,
  // which means taxPaise must be reported as 0 in the total arithmetic when
  // prices already contain it. We therefore record tax separately for the
  // invoice and keep the total honest.
  const totalPaise = subtotalAfterDiscount + shippingPaise + codFeePaise;

  return {
    lines,
    subtotalPaise,
    discountPaise,
    shippingPaise,
    // Reported for display/invoice only — already inside the line prices.
    taxPaise,
    codFeePaise,
    totalPaise,
    totalWeightGrams:
      lines.reduce((s, l) => s + l.weightGrams, 0) +
      (settings.shipping?.defaultPackageWeightGrams ?? 0),
    couponCode: input.couponCode?.trim().toUpperCase(),
    warnings,
  };
}
