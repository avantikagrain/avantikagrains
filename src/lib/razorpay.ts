import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { getEnv } from './env';
import { AppError } from './errors';

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

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

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

export function verifyCheckoutSignature(
  payload: CheckoutHandlerPayload,
  keySecret = getEnv().RAZORPAY_KEY_SECRET,
): boolean {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false;

  const expected = hmacHex(`${razorpay_order_id}|${razorpay_payment_id}`, keySecret);
  return safeCompare(expected, razorpay_signature);
}

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
  amountPaise: number;

  receipt: string;
  notes?: Record<string, string>;
}

export async function createGatewayOrder(input: CreateGatewayOrderInput) {
  const { amountPaise, receipt, notes } = input;

  if (!Number.isInteger(amountPaise) || amountPaise < 100) {
    throw new AppError('BAD_REQUEST', 'Payment amount must be at least ₹1');
  }

  try {
    return await razorpay().orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,

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
