import type { NextRequest } from 'next/server';
import { ok, route } from '@/lib/api-response';
import { verifyPaymentSchema } from '@/lib/validation';
import { verifyCheckoutPayment } from '@/services/payments';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async (request: NextRequest) => {
  const input = verifyPaymentSchema.parse(await request.json());

  const order = await verifyCheckoutPayment(input);

  return ok({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
  });
});
