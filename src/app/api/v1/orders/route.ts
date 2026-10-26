import type { NextRequest } from 'next/server';
import { created, ok, route } from '@/lib/api-response';
import { getSession } from '@/lib/auth/session';
import { badRequest, unauthenticated } from '@/lib/errors';
import { createOrderSchema, noClientPricing } from '@/lib/validation';
import { createOrder } from '@/services/orders';
import { connectDB } from '@/lib/db';
import { Order, User } from '@/models';
import { requireAccountForOrders } from '@/lib/order-policy';

export const dynamic = 'force-dynamic';

export const POST = route(async (request: NextRequest) => {
  const body = await request.json();

  noClientPricing.parse(body);
  const input = createOrderSchema.parse(body);

  const session = await getSession();

  if (!session) {
    if (requireAccountForOrders()) {
      throw unauthenticated('Please sign in to place an order');
    }

    if (!input.guestEmail) {
      throw badRequest('Sign in or provide an email address to place an order');
    }

    await connectDB();

    const registered = await User.exists({
      email: input.guestEmail.trim().toLowerCase(),
    });

    if (registered) {
      throw badRequest(
        'An account already exists for this email address. Please sign in to place this order.',
      );
    }
  }

  const result = await createOrder({
    items: input.items,
    shippingAddress: input.shippingAddress,
    billingAddress: input.billingAddress,
    paymentMethod: input.paymentMethod,
    couponCode: input.couponCode,
    customerNote: input.customerNote,
    userId: session?.id,
    guestEmail: session ? undefined : input.guestEmail,
    idempotencyKey: input.idempotencyKey,
  });

  const payload = {
    orderNumber: result.order.orderNumber,
    status: result.order.status,
    paymentMethod: result.order.paymentMethod,
    paymentStatus: result.order.paymentStatus,
    totalPaise: result.order.totalPaise,
    gateway: result.gateway,
  };

  return result.replayed ? ok(payload) : created(payload);
});

export const GET = route(async (request: NextRequest) => {
  const session = await getSession();
  if (!session) throw badRequest('Sign in to view your orders');

  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 10)));

  const orders = await Order.find({ user: session.id })
    .sort({ placedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('orderNumber status paymentStatus totalPaise placedAt items')
    .lean();

  return ok(orders);
});
