import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, route } from '@/lib/api-response';
import { requirePermission } from '@/lib/auth/session';
import { notFound } from '@/lib/errors';
import { connectDB } from '@/lib/db';
import { Order } from '@/models';
import { recordAudit } from '@/services/admin-audit';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  internalNote: z.string().trim().max(2000),
});

export const PATCH = route(
  async (request: NextRequest, context: { params: Promise<{ orderNumber: string }> }) => {
    const actor = await requirePermission('order:write');
    const { orderNumber } = await context.params;
    const input = bodySchema.parse(await request.json());

    await connectDB();

    const order = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() });
    if (!order) throw notFound('Order not found');

    const before = order.internalNote ?? '';
    order.internalNote = input.internalNote;
    await order.save();

    await recordAudit({
      actor,
      action: 'order.note',
      resourceType: 'Order',
      resourceId: order.orderNumber,
      changes: [{ field: 'internalNote', before, after: input.internalNote }],
      outcome: 'success',
      request,
    });

    return ok({ orderNumber: order.orderNumber, internalNote: order.internalNote });
  },
);
