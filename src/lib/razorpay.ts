import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { getEnv } from './env';
import { AppError } from './errors';

/**
 * Razorpay adapter.
 *
 * Two different signatures exist and they are NOT interchangeable:
 *
 *  1. Checkout handler signature — HMAC-SHA256 of `order_id|payment_id`
 *     keyed with the API **key secret**. Proves the browser handler payload
 *     was not tampered with.
 *  2. Webhook signature — HMAC-SHA256 of the **raw request body** keyed with
 *     the **webhook secret** (a different value), delivered in the
 *     `X-Razorpay-Signature` header.
 *
 * Neither one, on its own, is proof of settlement. Capture status is read
 * back from the API or taken from a verified `payment.captured` webhook.
 */

let client: Razorpay | null = null;

export function razorpay(): Razorpay {
  if (!client) {
    const env = getEnv();
    client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

/**
 * Constant-time comparison. A plain `===` on signatures leaks timing
 * information that can be used to forge one byte at a time.
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  // timingSafeEqual throws on length mismatch, so length is checked first —
  // signature length is not secret.
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function hmacHex(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

export interface CheckoutHandlerPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Verifies the payload the Razorpay Checkout handler posts back. */
export function verifyCheckoutSignature(
  payload: CheckoutHandlerPayload,
  keySecret = getEnv().RAZORPAY_KEY_SECRET,
): boolean {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false;

  const expected = hmacHex(`${razorpay_order_id}|${razorpay_payment_id}`, keySecret);
  return safeCompare(expected, razorpay_signature);
}

/**
 * Verifies a webhook delivery.
 *
 * `rawBody` must be the exact bytes received. Re-serialising the parsed JSON
 * changes key order and whitespace, which changes the hash — this is the
 * single most common cause of "valid webhooks failing verification".
 *
 * `previousSecret` supports rotation: Razorpay retries older deliveries
 * signed with the secret that was active when they were first sent.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret = getEnv().RAZORPAY_WEBHOOK_SECRET,
  previousSecret?: string,
): boolean {
  if (!signature) return false;

  if (safeCompare(hmacHex(rawBody, secret), signature)) return true;
  if (previousSecret && safeCompare(hmacHex(rawBody, previousSecret), signature)) return true;

  return false;
}

export interface CreateGatewayOrderInput {
  /** Integer paise — Razorpay's own unit, so no conversion happens here. */
  amountPaise: number;
  /** Our order number, so a gateway record can be traced back. */
  receipt: string;
  notes?: Record<string, string>;
}

export async function createGatewayOrder(input: CreateGatewayOrderInput) {
  const { amountPaise, receipt, notes } = input;

  if (!Number.isInteger(amountPaise) || amountPaise < 100) {
    // Razorpay rejects amounts below ₹1.
    throw new AppError('BAD_REQUEST', 'Payment amount must be at least ₹1');
  }

  try {
    return await razorpay().orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,
      // Capture automatically on authorisation — avoids a separate capture
      // call and the window where an authorised payment is never captured.
      payment_capture: true,
    });
  } catch (err) {
    throw new AppError(
      'UPSTREAM_ERROR',
      'Could not reach the payment gateway. Please try again.',
      { cause: (err as Error).message },
    );
  }
}

/** Reads authoritative payment state back from Razorpay. */
export async function fetchGatewayPayment(paymentId: string) {
  try {
    return await razorpay().payments.fetch(paymentId);
  } catch (err) {
    throw new AppError('UPSTREAM_ERROR', 'Could not fetch payment status', {
      cause: (err as Error).message,
    });
  }
}

export async function createGatewayRefund(
  paymentId: string,
  amountPaise: number,
  notes?: Record<string, string>,
) {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new AppError('BAD_REQUEST', 'Refund amount must be a positive integer in paise');
  }
  try {
    return await razorpay().payments.refund(paymentId, {
      amount: amountPaise,
      speed: 'normal',
      notes,
    });
  } catch (err) {
    throw new AppError('UPSTREAM_ERROR', 'Refund request failed at the gateway', {
      cause: (err as Error).message,
    });
  }
}

/** Webhook events this application acts on. Anything else is recorded and ignored. */
export const HANDLED_WEBHOOK_EVENTS = [
  'payment.captured',
  'payment.failed',
  'refund.processed',
  'refund.failed',
] as const;

export type HandledWebhookEvent = (typeof HANDLED_WEBHOOK_EVENTS)[number];

export function isHandledEvent(event: string): event is HandledWebhookEvent {
  return (HANDLED_WEBHOOK_EVENTS as readonly string[]).includes(event);
}
