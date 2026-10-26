import type { HydratedDocument, Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Coupon, Order, Payment, type IOrder, type IOrderAddressSnapshot } from '@/models';

type OrderDoc = HydratedDocument<IOrder>;
import { AppError, badRequest, notFound } from '@/lib/errors';
import { generateOrderNumber } from '@/lib/order-number';
import { createGatewayOrder } from '@/lib/razorpay';
import { logger } from '@/lib/logger';
import { commitReservations, releaseReservations, reserveStock } from './inventory';
import { quoteOrder, type QuoteItemInput } from './pricing';
import type { PaymentMethod } from '@/models/Order';

export interface CreateOrderInput {
  items: QuoteItemInput[];
  shippingAddress: IOrderAddressSnapshot;
  billingAddress?: IOrderAddressSnapshot;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  customerNote?: string;
  userId?: string;
  guestEmail?: string;

  idempotencyKey: string;
}

export interface CreateOrderResult {
  order: OrderDoc;

  gateway?: {
    keyId: string;
    gatewayOrderId: string;
    amountPaise: number;
    currency: 'INR';
  };

  replayed: boolean;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  await connectDB();

  if (!input.idempotencyKey || input.idempotencyKey.length < 16) {
    throw badRequest('A valid idempotency key is required');
  }
  if (!input.userId && !input.guestEmail) {
    throw badRequest('An email address is required to place an order');
  }

  const existing = await Order.findOne({ idempotencyKey: input.idempotencyKey });
  if (existing) {
    logger.info({ orderNumber: existing.orderNumber }, 'Idempotent replay of order creation');
    const payment = await Payment.findOne({ order: existing._id });
    return {
      order: existing,
      replayed: true,
      gateway:
        payment?.providerOrderId && existing.paymentMethod === 'razorpay'
          ? {
              keyId: process.env.RAZORPAY_KEY_ID!,
              gatewayOrderId: payment.providerOrderId,
              amountPaise: existing.totalPaise,
              currency: 'INR',
            }
          : undefined,
    };
  }

  const quote = await quoteOrder({
    items: input.items,
    couponCode: input.couponCode,
    pincode: input.shippingAddress.pincode,
    paymentMethod: input.paymentMethod,
    userId: input.userId,
  });

  await reserveStock(
    quote.lines.map((l) => ({
      productId: l.product,
      variantId: l.variantId,
      sku: l.sku,
      quantity: l.quantity,
    })),
    input.idempotencyKey,
  );

  let order: OrderDoc;

  try {
    order = await createOrderDocument(input, quote);
  } catch (err) {
    await releaseReservations(input.idempotencyKey, 'order_cancelled');
    throw err;
  }

  try {
    if (input.paymentMethod === 'cod') {
      await commitReservations(order._id, input.idempotencyKey);
      order.paymentStatus = 'cod_pending';
      order.status = 'confirmed';
      await order.save();

      await Payment.create({
        order: order._id,
        provider: 'cod',
        amountPaise: order.totalPaise,
        status: 'created',
        verifiedServerSide: false,
      });

      await incrementCouponUsage(order.couponCode);
      return { order, replayed: false };
    }

    const gatewayOrder = await createGatewayOrder({
      amountPaise: order.totalPaise,
      receipt: order.orderNumber,
      notes: { orderNumber: order.orderNumber },
    });

    await Payment.create({
      order: order._id,
      provider: 'razorpay',
      providerOrderId: gatewayOrder.id,
      amountPaise: order.totalPaise,
      status: 'created',
      verifiedServerSide: false,
    });

    return {
      order,
      replayed: false,
      gateway: {
        keyId: process.env.RAZORPAY_KEY_ID!,
        gatewayOrderId: gatewayOrder.id,
        amountPaise: order.totalPaise,
        currency: 'INR',
      },
    };
  } catch (err) {
    logger.error({ err, orderNumber: order.orderNumber }, 'Payment setup failed after order creation');
    await releaseReservations(input.idempotencyKey, 'order_cancelled').catch(() => undefined);
    order.status = 'cancelled';
    order.cancellationReason = 'Payment could not be initiated';
    await order.save().catch(() => undefined);
    throw err;
  }
}

async function createOrderDocument(
  input: CreateOrderInput,
  quote: Awaited<ReturnType<typeof quoteOrder>>,
): Promise<OrderDoc> {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await Order.create({
        orderNumber: generateOrderNumber(),
        user: input.userId,
        guestEmail: input.guestEmail,
        items: quote.lines.map((l) => ({
          product: l.product,
          variantId: l.variantId,
          sku: l.sku,
          name: l.name,
          localName: l.localName,
          packSize: l.packSize,
          imageUrl: l.imageUrl,
          quantity: l.quantity,
          unitPricePaise: l.unitPricePaise,
          unitMrpPaise: l.unitMrpPaise,
          lineSubtotalPaise: l.lineSubtotalPaise,
          hsnCode: l.hsnCode,
          gstRatePercent: l.gstRatePercent,
          lineTaxPaise: l.lineTaxPaise,
          weightGrams: l.weightGrams,
        })),
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress ?? input.shippingAddress,
        subtotalPaise: quote.subtotalPaise,
        discountPaise: quote.discountPaise,
        shippingPaise: quote.shippingPaise,
        taxPaise: quote.taxPaise,
        taxInclusive: true,
        codFeePaise: quote.codFeePaise,
        totalPaise: quote.totalPaise,
        couponCode: quote.couponCode,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === 'cod' ? 'cod_pending' : 'pending',
        status: 'pending_payment',
        idempotencyKey: input.idempotencyKey,
        customerNote: input.customerNote,
      });
    } catch (err) {
      const isDuplicateOrderNumber =
        typeof err === 'object' &&
        err !== null &&
        (err as { code?: number }).code === 11000 &&
        'keyPattern' in err &&
        Object.keys((err as { keyPattern: object }).keyPattern).includes('orderNumber');

      if (isDuplicateOrderNumber && attempt < MAX_ATTEMPTS) {
        logger.warn({ attempt }, 'Order number collision, regenerating');
        continue;
      }
      throw err;
    }
  }

  throw new AppError('INTERNAL_ERROR', 'Could not allocate an order number');
}

async function incrementCouponUsage(code?: string): Promise<void> {
  if (!code) return;
  await Coupon.updateOne({ code }, { $inc: { usedCount: 1 } }).catch((err) => {
    logger.error({ err, code }, 'Failed to increment coupon usage');
  });
}

export { incrementCouponUsage };

export async function cancelOrder(
  orderId: string,
  reason: string,
  actor?: Types.ObjectId | string,
): Promise<OrderDoc> {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) throw notFound('Order not found');

  if (!['pending_payment', 'confirmed', 'processing'].includes(order.status)) {
    throw badRequest(`An order that is already ${order.status} cannot be cancelled`);
  }

  if (order.status === 'pending_payment') {
    await releaseReservations(order.idempotencyKey, 'order_cancelled');
  }

  order.status = 'cancelled';
  order.cancellationReason = reason;
  order.statusHistory.push({
    status: 'cancelled',
    at: new Date(),
    note: reason,
    byUser: actor as Types.ObjectId | undefined,
  });

  await order.save();
  logger.info({ orderNumber: order.orderNumber, reason }, 'Order cancelled');
  return order;
}

export async function findOrderForCustomer(
  orderNumber: string,
  identity: { userId?: string; email?: string },
): Promise<OrderDoc> {
  await connectDB();

  const order = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() });
  if (!order) throw notFound('Order not found');

  const owns =
    (identity.userId && order.user?.toString() === identity.userId) ||
    (identity.email && order.guestEmail === identity.email.toLowerCase());

  if (!owns) throw notFound('Order not found');

  return order;
}
