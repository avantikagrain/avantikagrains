import type { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Coupon, Order, Product, StoreSettings, type IStoreSettings } from '@/models';
import { AppError, badRequest, outOfStock } from '@/lib/errors';
import { addPaise, assertPaise, multiplyPaise, percentOf } from '@/lib/money';
import { MAX_ITEM_QUANTITY } from '@/lib/limits';
import type { PaymentMethod } from '@/models/Order';

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

export function splitInclusiveTax(
  inclusivePaise: number,
  ratePercent: number,
): { taxablePaise: number; taxPaise: number } {
  assertPaise(inclusivePaise);
  if (ratePercent <= 0) return { taxablePaise: inclusivePaise, taxPaise: 0 };

  const taxable = Math.round((inclusivePaise * 100) / (100 + ratePercent));
  return { taxablePaise: taxable, taxPaise: inclusivePaise - taxable };
}

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

  const order = lineSubtotals
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value);

  let cursor = 0;
  while (remainder > 0) {
    const target = order[cursor % order.length].index;

    if (allocated[target] < lineSubtotals[target]) {
      allocated[target] += 1;
      remainder -= 1;
    }
    cursor += 1;
    if (cursor > order.length * 2 + totalDiscount) break;
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

      discount = 0;
      break;
  }

  return Math.min(discount, subtotal);
}

export async function quoteOrder(input: QuoteInput): Promise<Quote> {
  await connectDB();

  if (input.items.length === 0) throw badRequest(EMPTY_CART);

  const settings = await loadSettings();
  const warnings: string[] = [];

  const lines: QuoteLine[] = [];

  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw badRequest('Quantity must be a positive whole number');
    }

    if (item.quantity > MAX_ITEM_QUANTITY) {
      throw badRequest(
        `A maximum of ${MAX_ITEM_QUANTITY} units per item is allowed. ` +
          'Please raise a bulk enquiry for larger quantities.',
      );
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

  const shippingPaise = freeShipping ? 0 : computeShipping(settings, subtotalAfterDiscount);

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

  let taxPaise = 0;

  if (settings.tax?.pricesIncludeTax !== false) {
    for (const line of lines) {
      const rate = line.gstRatePercent;
      if (rate === undefined) {
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

  const totalPaise = subtotalAfterDiscount + shippingPaise + codFeePaise;

  return {
    lines,
    subtotalPaise,
    discountPaise,
    shippingPaise,

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
