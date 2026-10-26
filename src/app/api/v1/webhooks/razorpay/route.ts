import type { NextRequest } from 'next/server';
import { ok, handleError } from '@/lib/api-response';
import { processRazorpayWebhook } from '@/services/payments';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    const result = await processRazorpayWebhook(rawBody, signature);

    return ok(result);
  } catch (err) {
    logger.error({ err }, 'Razorpay webhook processing failed');

    return handleError(err, { route: 'webhooks/razorpay' });
  }
}
