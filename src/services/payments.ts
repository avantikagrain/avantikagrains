import crypto from 'node:crypto';
import { connectDB } from '@/lib/db';
import type { HydratedDocument } from 'mongoose';
import { Order, Payment, WebhookEvent, type IOrder } from '@/models';

type OrderDoc = HydratedDocument<IOrder>;
import { AppError, badRequest, notFound } from '@/lib/errors';
import {
  fetchGatewayPayment,
  isHandledEvent,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  type CheckoutHandlerPayload,
} from '@/lib/razorpay';
import { logger } from '@/lib/logger';
import { commitReservations, releaseReservations } from './inventory';
import { incrementCouponUsage } from './orders';

/**
 * Payment confirmation.
 *
 * Two independent paths can confirm an order, and both must be safe to run
 * twice and safe to run in either order:
 *
 *   A. the browser returns from Checkout with a signed handler payload
 *   B. Razorpay delivers a `payment.captured` webhook
 *
 * Whichever arrives first confirms the order; the second finds the work
 * already done and does nothing. The browser path alone is never trusted as
 * proof of settlement — the signature only proves the payload is authentic,
 * so the payment is also read back from the gateway.
 */

export interface VerifyCheckoutInput extends CheckoutHandlerPayload {
  orderNumber: string;
}

export async function verifyCheckoutPayment(input: VerifyCheckoutInput): Promise<OrderDoc> {
  await connectDB();

  const order = await Order.findOne({ orderNumber: input.orderNumber.trim().toUpperCase() });
  if (!order) throw notFound('Order not found');

  const payment = await Payment.findOne({ order: order._id, provider: 'razorpay' });
  if (!payment) throw notFound('No payment record exists for this order');

  // Already confirmed by the webhook — idempotent success, not an error.
  if (payment.status === 'captured' && payment.verifiedServerSide) {
    return order;
  }

  // The gateway order id in the payload must be the one we created. Without
  // this check a valid signature from an unrelated order would pass.
  if (payment.providerOrderId !== input.razorpay_order_id) {
    logger.error(
      { orderNumber: order.orderNumber, expected: payment.providerOrderId },
      'Checkout payload references a different gateway order',
    );
    throw new AppError('PAYMENT_VERIFICATION_FAILED', 'Payment could not be verified');
  }

  if (!verifyCheckoutSignature(input)) {
    payment.status = 'failed';
    payment.failureDescription = 'Signature verification failed';
    await payment.save();
    logger.error({ orderNumber: order.orderNumber }, 'Checkout signature verification failed');
    throw new AppError('PAYMENT_VERIFICATION_FAILED', 'Payment could not be verified');
  }

  // Signature is authentic. Now confirm with the gateway that the money
  // actually moved, and for the right amount.
  const gatewayPayment = await fetchGatewayPayment(input.razorpay_payment_id);

  const capturedAmount = Number(gatewayPayment.amount);
  if (capturedAmount !== order.totalPaise) {
    logger.error(
      { orderNumber: order.orderNumber, capturedAmount, expected: order.totalPaise },
      'Captured amount does not match the order total',
    );
    throw new AppError('PAYMENT_VERIFICATION_FAILED', 'Payment amount mismatch');
  }

  if (gatewayPayment.status !== 'captured') {
    throw new AppError(
      'PAYMENT_FAILED',
      `Payment is not captured (status: ${gatewayPayment.status})`,
    );
  }

  payment.providerPaymentId = input.razorpay_payment_id;
  payment.status = 'captured';
  payment.method = gatewayPayment.method;
  payment.verifiedServerSide = true;
  payment.verifiedAt = new Date();
  payment.verificationSource = 'checkout_signature';
  await payment.save();

  await confirmPaidOrder(order);
  return order;
}

/**
 * Moves a paid order to `confirmed` and turns stock holds into depletion.
 * Safe to call more than once.
 */
async function confirmPaidOrder(order: OrderDoc): Promise<void> {
  if (order.paymentStatus === 'paid' && order.status !== 'pending_payment') return;

  await commitReservations(order._id, order.idempotencyKey);

  order.paymentStatus = 'paid';
  if (order.status === 'pending_payment') {
    order.status = 'confirmed';
  }
  await order.save();

  await incrementCouponUsage(order.couponCode);
  logger.info({ orderNumber: order.orderNumber }, 'Order confirmed after verified payment');
}

export interface WebhookResult {
  handled: boolean;
  duplicate: boolean;
  event: string;
}

/**
 * Processes a Razorpay webhook.
 *
 * `rawBody` must be the untouched request body — re-serialising parsed JSON
 * changes the bytes and breaks the HMAC.
 */
export async function processRazorpayWebhook(
  rawBody: string,
  signature: string | null,
): Promise<WebhookResult> {
  await connectDB();

  if (!verifyWebhookSignature(rawBody, signature)) {
    // Record the rejection: repeated invalid signatures mean either a
    // misconfigured secret or someone probing the endpoint.
    logger.error('Razorpay webhook signature verification failed');
    throw new AppError('PAYMENT_VERIFICATION_FAILED', 'Invalid webhook signature');
  }

  const payload = JSON.parse(rawBody) as {
    event: string;
    payload?: { payment?: { entity?: Record<string, unknown> }; refund?: { entity?: Record<string, unknown> } };
  };

  // Razorpay does not always send a unique delivery id, so a hash of the
  // body is the fallback dedupe key.
  const eventId =
    (payload as { id?: string }).id ??
    crypto.createHash('sha256').update(rawBody).digest('hex');

  // Insert-first dedupe: the unique index rejects a repeat delivery, so the
  // handler below can never run twice for the same event.
  let record;
  try {
    record = await WebhookEvent.create({
      provider: 'razorpay',
      providerEventId: eventId,
      eventType: payload.event,
      signatureVerified: true,
      status: 'processing',
      payload: payload as unknown as Record<string, unknown>,
      attempts: 1,
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      logger.info({ eventId, event: payload.event }, 'Duplicate webhook ignored');
      return { handled: false, duplicate: true, event: payload.event };
    }
    throw err;
  }

  if (!isHandledEvent(payload.event)) {
    record.status = 'ignored';
    await record.save();
    return { handled: false, duplicate: false, event: payload.event };
  }

  try {
    await applyWebhookEvent(payload.event, payload, record._id);
    record.status = 'processed';
    record.processedAt = new Date();
    await record.save();
    return { handled: true, duplicate: false, event: payload.event };
  } catch (err) {
    record.status = 'failed';
    record.lastError = (err as Error).message;
    await record.save();
    // Rethrow so Razorpay retries — but the dedupe row now exists, so the
    // retry is only reprocessed if we explicitly reset it.
    throw err;
  }
}

async function applyWebhookEvent(
  event: string,
  payload: { payload?: { payment?: { entity?: Record<string, unknown> }; refund?: { entity?: Record<string, unknown> } } },
  webhookId: unknown,
): Promise<void> {
  const entity =
    event.startsWith('refund.')
      ? payload.payload?.refund?.entity
      : payload.payload?.payment?.entity;

  if (!entity) throw badRequest('Webhook payload is missing its entity');

  const gatewayOrderId = entity.order_id as string | undefined;
  const gatewayPaymentId = (event.startsWith('refund.')
    ? entity.payment_id
    : entity.id) as string | undefined;

  const payment = gatewayOrderId
    ? await Payment.findOne({ providerOrderId: gatewayOrderId })
    : await Payment.findOne({ providerPaymentId: gatewayPaymentId });

  if (!payment) {
    logger.warn({ gatewayOrderId, event }, 'Webhook references an unknown payment');
    return;
  }

  const order = await Order.findById(payment.order);
  if (!order) throw notFound('Order referenced by the webhook no longer exists');

  switch (event) {
    case 'payment.captured': {
      const amount = Number(entity.amount);
      if (amount !== order.totalPaise) {
        logger.error(
          { orderNumber: order.orderNumber, amount, expected: order.totalPaise },
          'Webhook capture amount mismatch — not confirming order',
        );
        throw new AppError('PAYMENT_VERIFICATION_FAILED', 'Captured amount mismatch');
      }

      if (payment.status !== 'captured') {
        payment.providerPaymentId = gatewayPaymentId;
        payment.status = 'captured';
        payment.method = entity.method as string | undefined;
        payment.verifiedServerSide = true;
        payment.verifiedAt = new Date();
        payment.verificationSource = 'webhook';
        await payment.save();
      }

      await confirmPaidOrder(order);
      break;
    }

    case 'payment.failed': {
      payment.status = 'failed';
      payment.failureCode = entity.error_code as string | undefined;
      payment.failureDescription = entity.error_description as string | undefined;
      await payment.save();

      // Return the held stock so an abandoned attempt does not block sales.
      // The order itself stays pending_payment so the customer can retry.
      if (order.status === 'pending_payment') {
        await releaseReservations(order.idempotencyKey, 'order_cancelled');
      }
      order.paymentStatus = 'failed';
      await order.save();
      break;
    }

    case 'refund.processed': {
      const refundId = entity.id as string;
      const refund = payment.refunds.find((r) => r.providerRefundId === refundId);

      if (refund) {
        refund.status = 'processed';
        refund.processedAt = new Date();
      } else {
        /**
         * A refund we have no record of — almost always one issued by hand
         * from the Razorpay dashboard, which is how a small operation
         * usually refunds a customer who phoned in.
         *
         * This webhook is signature-verified, so it is authoritative: the
         * money has left the account. Recording it is what keeps
         * `amountRefundedPaise` (recomputed from this array on save) in
         * step with the gateway. Logging and moving on would leave a fully
         * refunded order reading as partially refunded for ever, and the
         * refund absent from our books entirely.
         */
        const amountPaise = Number(entity.amount);

        if (!Number.isInteger(amountPaise) || amountPaise < 1) {
          // Never guess at an amount. Without a usable figure the safe
          // outcome is to leave the record untouched and raise it loudly.
          logger.error(
            { refundId, amount: entity.amount, paymentId: payment.id },
            'Refund webhook carried an unusable amount — not recorded, needs manual reconciliation',
          );
          break;
        }

        payment.refunds.push({
          providerRefundId: refundId,
          amountPaise,
          reason:
            (entity.notes as Record<string, string> | undefined)?.reason ??
            'Issued from the Razorpay dashboard',
          status: 'processed',
          source: 'gateway',
          requestedAt: new Date(),
          processedAt: new Date(),
        } as never);

        logger.warn(
          { refundId, amountPaise, paymentId: payment.id },
          'Recorded a refund that was issued outside the admin',
        );
      }

      await payment.save();

      order.paymentStatus =
        payment.amountRefundedPaise >= payment.amountPaise ? 'refunded' : 'partially_refunded';
      await order.save();
      break;
    }

    case 'refund.failed': {
      const refund = payment.refunds.find((r) => r.providerRefundId === (entity.id as string));
      if (refund) {
        refund.status = 'failed';
        refund.failureReason = entity.error_description as string | undefined;
        await payment.save();
      }
      break;
    }
  }

  await WebhookEvent.updateOne(
    { _id: webhookId },
    { relatedOrder: order._id, relatedPayment: payment._id },
  );
}

/**
 * Reconciliation: payments the gateway considers captured but which this
 * system never confirmed (a webhook that never arrived and a customer who
 * closed the tab). Run as a scheduled job.
 */
export async function findUnreconciledPayments(sinceHours = 24) {
  await connectDB();
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

  return Payment.find({
    provider: 'razorpay',
    status: { $in: ['created', 'authorized'] },
    createdAt: { $gte: since },
  })
    .populate('order', 'orderNumber totalPaise status paymentStatus')
    .lean();
}
