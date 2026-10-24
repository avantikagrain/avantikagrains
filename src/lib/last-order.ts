/**
 * Where the checkout leaves the order it just placed, for the
 * confirmation screen to read.
 *
 * Its own module rather than a constant exported from
 * `app/order-confirmation/page.tsx`. Importing it from the page meant
 * checkout pulled a whole page component into its bundle for the sake of
 * one string, and tied one route's build to another's file existing —
 * which is exactly how it broke.
 *
 * sessionStorage, not a fetch by order number: an endpoint that returns
 * an order keyed on a number printed on every invoice would hand anyone
 * else's order to whoever guessed it, and most orders here are placed by
 * guests, so there is no session to check it against. The browser that
 * placed the order already knows what it ordered.
 */
export const LAST_ORDER_KEY = 'ag_last_order';

export interface PlacedOrder {
  orderNumber: string;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: string;
  totalPaise: number;
  email?: string;
  items: { name: string; packSize: string; quantity: number }[];
}