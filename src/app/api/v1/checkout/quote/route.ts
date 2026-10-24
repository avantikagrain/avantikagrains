import type { NextRequest } from 'next/server';
import { ok, route } from '@/lib/api-response';
import { getSession } from '@/lib/auth/session';
import { noClientPricing, quoteRequestSchema } from '@/lib/validation';
import { quoteOrder } from '@/services/pricing';

export const dynamic = 'force-dynamic';

/**
 * Checkout preview. Returns exactly the figures that order creation will
 * use, because both call the same pricing service.
 */
export const POST = route(async (request: NextRequest) => {
  const body = await request.json();

  noClientPricing.parse(body);
  const input = quoteRequestSchema.parse(body);

  const session = await getSession();

  const quote = await quoteOrder({
    items: input.items,
    couponCode: input.couponCode,
    pincode: input.pincode,
    paymentMethod: input.paymentMethod,
    userId: session?.id,
  });

  return ok({
    lines: quote.lines.map((l) => ({
      sku: l.sku,
      name: l.name,
      packSize: l.packSize,
      quantity: l.quantity,
      unitPricePaise: l.unitPricePaise,
      unitMrpPaise: l.unitMrpPaise,
      lineSubtotalPaise: l.lineSubtotalPaise,
      lineDiscountPaise: l.lineDiscountPaise,
    })),
    subtotalPaise: quote.subtotalPaise,
    discountPaise: quote.discountPaise,
    shippingPaise: quote.shippingPaise,
    taxPaise: quote.taxPaise,
    taxInclusive: true,
    codFeePaise: quote.codFeePaise,
    totalPaise: quote.totalPaise,
    couponCode: quote.couponCode,
    warnings: quote.warnings,
  });
});
