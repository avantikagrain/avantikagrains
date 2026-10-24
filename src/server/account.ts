import 'server-only';
import { connectDB } from '@/lib/db';
import { Order, type OrderStatus } from '@/models';

/**
 * Data access for the signed-in customer's own pages.
 *
 * Every query here is scoped by the session's user id, which the caller
 * takes from the verified JWT — never from a route parameter or a query
 * string. Scoping at the query means a customer cannot read another
 * customer's order even if an id leaks, rather than relying on a check
 * after the document is already loaded.
 */

export interface OrderListItem {
  orderNumber: string;
  placedAt: string;
  status: OrderStatus;
  paymentMethod: 'razorpay' | 'cod';
  totalPaise: number;
  itemCount: number;
  /** First few lines, for a recognisable summary without a second query. */
  preview: { name: string; packSize: string; quantity: number; imageUrl?: string }[];
}

export async function listOrdersForUser(
  userId: string,
  limit = 25,
): Promise<OrderListItem[]> {
  await connectDB();

  const docs = await Order.find({ user: userId })
    .sort({ placedAt: -1 })
    .limit(limit)
    // Project only what the list renders. Orders carry addresses, payment
    // references and an audit trail; none of it belongs in a list payload.
    .select('orderNumber placedAt status paymentMethod totalPaise items')
    .lean();

  return docs.map((doc) => {
    const items = (doc.items ?? []) as {
      name: string;
      packSize: string;
      quantity: number;
      imageUrl?: string;
    }[];

    return {
      orderNumber: doc.orderNumber,
      // Serialised for the client boundary — a Date would need a
      // transform on every prop that crosses it.
      placedAt: new Date(doc.placedAt).toISOString(),
      status: doc.status,
      paymentMethod: doc.paymentMethod,
      totalPaise: doc.totalPaise,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      preview: items.slice(0, 3).map((item) => ({
        name: item.name,
        packSize: item.packSize,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      })),
    };
  });
}
