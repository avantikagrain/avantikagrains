import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, route } from '@/lib/api-response';
import { requirePermission } from '@/lib/auth/session';
import { badRequest, notFound } from '@/lib/errors';
import { connectDB } from '@/lib/db';
import { ORDER_STATUSES, Order, canTransition } from '@/models';
import { cancelOrder } from '@/services/orders';
import { recordAudit } from '@/services/admin-audit';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const PATCH = route(
  async (request: NextRequest, context: { params: Promise<{ orderNumber: string }> }) => {
    const actor = await requirePermission('order:write');
    const { orderNumber } = await context.params;
    const input = bodySchema.parse(await request.json());

    await connectDB();

    const order = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() });
    if (!order) throw notFound('Order not found');

    const previous = order.status;

    if (previous === input.status) {
      throw badRequest(`The order is already ${previous.replace(/_/g, ' ')}`);
    }

    if (!canTransition(previous, input.status)) {
      throw badRequest(
        `An order that is ${previous.replace(/_/g, ' ')} cannot move to ${input.status.replace(/_/g, ' ')}`,
      );
    }

    if (input.status === 'cancelled') {
      await requirePermission('order:cancel');
      const cancelled = await cancelOrder(
        String(order._id),
        input.note?.trim() || 'Cancelled by staff',
        actor.id,
      );

      await recordAudit({
        actor,
        action: 'order.cancel',
        resourceType: 'Order',
        resourceId: cancelled.orderNumber,
        changes: [{ field: 'status', before: previous, after: 'cancelled' }],
        outcome: 'success',
        reason: input.note,
        request,
      });

      return ok({ orderNumber: cancelled.orderNumber, status: cancelled.status });
    }

    order.status = input.status;

    if (input.note?.trim()) {
      const event = order.statusHistory.at(-1);
      if (event) event.note = input.note.trim();
    }

    if (input.status === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'cod_collected';
    }

    await order.save();

    await recordAudit({
      actor,
      action: 'order.status',
      resourceType: 'Order',
      resourceId: order.orderNumber,
      changes: [{ field: 'status', before: previous, after: order.status }],
      outcome: 'success',
      reason: input.note,
      request,
    });

    return ok({ orderNumber: order.orderNumber, status: order.status });
  },
);
