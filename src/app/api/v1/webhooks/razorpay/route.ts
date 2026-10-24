import type { NextRequest } from 'next/server';
import { ok, handleError } from '@/lib/api-response';
import { processRazorpayWebhook } from '@/services/payments';
import { logger } from '@/lib/logger';

// Must not be statically optimised or cached — every delivery is unique.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Razorpay webhook receiver.
 *
 * `request.text()` is used deliberately: the HMAC is computed over the exact
 * bytes Razorpay sent. Calling `request.json()` and re-stringifying would
 * reorder keys and change whitespace, and every signature check would fail.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    const result = await processRazorpayWebhook(rawBody, signature);

    // 200 on duplicates and ignored events too: a non-2xx makes Razorpay
    // retry, and retrying an event that was already handled correctly is
    // noise, not recovery.
    return ok(result);
  } catch (err) {
    logger.error({ err }, 'Razorpay webhook processing failed');
    // Genuine failures DO return non-2xx so the delivery is retried.
    return handleError(err, { route: 'webhooks/razorpay' });
  }
}
