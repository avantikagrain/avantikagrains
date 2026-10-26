import { z } from 'zod';

import { MAX_CART_LINES, MAX_ITEM_QUANTITY } from './limits';

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

export const pincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit PIN code');

export const phoneSchema = z
  .string()
  .regex(/^[6-9][0-9]{9}$/, 'Enter a valid 10-digit Indian mobile number');

export const addressSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: phoneSchema,
  line1: z.string().min(5).max(200),
  line2: z.string().max(200).optional(),
  landmark: z.string().max(120).optional(),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: pincodeSchema,
  country: z.literal('IN').default('IN'),
});

export const cartItemSchema = z.object({
  productId: objectIdSchema,
  variantId: objectIdSchema,
  quantity: z
    .number()
    .int()
    .min(1)
    .max(MAX_ITEM_QUANTITY, `A maximum of ${MAX_ITEM_QUANTITY} units per item is allowed`),
});

export const quoteRequestSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Your cart is empty').max(MAX_CART_LINES),
  couponCode: z.string().trim().max(32).optional(),
  pincode: pincodeSchema.optional(),
  paymentMethod: z.enum(['razorpay', 'cod']),
});

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(MAX_CART_LINES),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(['razorpay', 'cod']),
  couponCode: z.string().trim().max(32).optional(),
  customerNote: z.string().max(500).optional(),
  guestEmail: z.string().email().optional(),

  idempotencyKey: z.string().uuid('idempotencyKey must be a UUID'),
});

export const verifyPaymentSchema = z.object({
  orderNumber: z.string().trim().min(8).max(32),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const noClientPricing = z
  .object({})
  .passthrough()
  .superRefine((value, ctx) => {
    const forbidden = [
      'price', 'pricePaise', 'amount', 'amountPaise', 'total', 'totalPaise',
      'subtotal', 'subtotalPaise', 'discount', 'discountPaise', 'tax', 'taxPaise',
      'shipping', 'shippingPaise',
    ];
    for (const key of forbidden) {
      if (key in (value as Record<string, unknown>)) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `"${key}" is computed on the server and must not be sent by the client`,
        });
      }
    }
  });

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type VerifyPaymentRequest = z.infer<typeof verifyPaymentSchema>;
