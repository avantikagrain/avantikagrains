export function requireAccountForOrders(): boolean {
  return process.env.REQUIRE_ACCOUNT_FOR_ORDERS === 'true';
}

export const CHECKOUT_REQUIRED_FIELDS = [
  'fullName',
  'phone',
  'line1',
  'city',
  'state',
  'pincode',
] as const;

export type CheckoutRequiredField = (typeof CHECKOUT_REQUIRED_FIELDS)[number];
