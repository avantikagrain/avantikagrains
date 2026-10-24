// mongoose is a CommonJS package. With "type": "module" in package.json,
// named ESM imports of its runtime exports fail under plain Node (tsx, seed
// scripts) even though bundlers paper over it — so take the default export
// and destructure. Types are erased at compile time and import normally.
import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

export const ORDER_STATUSES = [
  'pending_payment',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
  'refunded',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['razorpay', 'cod'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  'pending',
  'paid',
  'failed',
  'partially_refunded',
  'refunded',
  'cod_pending',
  'cod_collected',
] as const;
export type OrderPaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Legal, auditable state machine. Any transition not listed here is rejected
 * at the model layer, so no service or admin action can skip a step.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'returned', 'cancelled'],
  out_for_delivery: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: ['refunded'],
  returned: ['refunded'],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Immutable snapshot of a line item. Once written it is never updated —
 * if the catalogue price changes tomorrow, this order still shows what the
 * customer actually agreed to pay.
 */
export interface IOrderItem {
  product: Types.ObjectId;
  variantId: Types.ObjectId;
  sku: string;
  name: string;
  localName?: string;
  packSize: string;
  imageUrl?: string;
  quantity: number;
  unitPricePaise: number;
  unitMrpPaise: number;
  lineSubtotalPaise: number;
  hsnCode?: string;
  gstRatePercent?: number;
  lineTaxPaise: number;
  weightGrams: number;
}

export interface IOrderAddressSnapshot {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IOrderStatusEvent {
  status: OrderStatus;
  at: Date;
  note?: string;
  byUser?: Types.ObjectId;
  bySystem?: string;
}

export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  user?: Types.ObjectId;
  guestEmail?: string;
  items: IOrderItem[];
  shippingAddress: IOrderAddressSnapshot;
  billingAddress: IOrderAddressSnapshot;

  // Every figure below is computed server-side. Nothing here is ever
  // accepted from the browser.
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  /**
   * GST amount. When `taxInclusive` is true (Indian B2C default) this is the
   * tax CONTAINED WITHIN subtotal + shipping, recorded for the invoice — it
   * is not added again when computing the total.
   */
  taxPaise: number;
  taxInclusive: boolean;
  codFeePaise: number;
  totalPaise: number;
  currency: 'INR';

  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: OrderPaymentStatus;
  status: OrderStatus;
  statusHistory: IOrderStatusEvent[];

  /** Client-supplied key that makes order creation safely retryable. */
  idempotencyKey: string;

  customerNote?: string;
  internalNote?: string;
  invoiceNumber?: string;
  invoiceIssuedAt?: Date;
  placedAt: Date;
  confirmedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const intPaise = {
  type: Number,
  required: true,
  min: 0,
  validate: { validator: Number.isInteger, message: 'must be an integer in paise' },
};

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    localName: String,
    packSize: { type: String, required: true },
    imageUrl: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPricePaise: intPaise,
    unitMrpPaise: intPaise,
    lineSubtotalPaise: intPaise,
    hsnCode: String,
    gstRatePercent: { type: Number, min: 0, max: 28 },
    lineTaxPaise: { ...intPaise, default: 0 },
    weightGrams: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const addressSnapshotSchema = new Schema<IOrderAddressSnapshot>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    landmark: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true, default: 'IN' },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, uppercase: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    guestEmail: { type: String, lowercase: true, trim: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v: IOrderItem[]) => v.length > 0,
        message: 'An order must contain at least one item',
      },
    },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    billingAddress: { type: addressSnapshotSchema, required: true },

    subtotalPaise: intPaise,
    discountPaise: { ...intPaise, default: 0 },
    shippingPaise: { ...intPaise, default: 0 },
    taxPaise: { ...intPaise, default: 0 },
    taxInclusive: { type: Boolean, required: true, default: true },
    codFeePaise: { ...intPaise, default: 0 },
    totalPaise: intPaise,
    currency: { type: String, enum: ['INR'], default: 'INR', required: true },

    couponCode: { type: String, uppercase: true, trim: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending', required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending_payment', required: true },
    statusHistory: {
      type: [
        new Schema<IOrderStatusEvent>(
          {
            status: { type: String, enum: ORDER_STATUSES, required: true },
            at: { type: Date, required: true, default: Date.now },
            note: String,
            byUser: { type: Schema.Types.ObjectId, ref: 'User' },
            bySystem: String,
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    idempotencyKey: { type: String, required: true },

    customerNote: { type: String, maxlength: 500 },
    internalNote: { type: String, maxlength: 2000 },
    invoiceNumber: String,
    invoiceIssuedAt: Date,
    placedAt: { type: Date, required: true, default: Date.now },
    confirmedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ idempotencyKey: 1 }, { unique: true });
orderSchema.index({ user: 1, placedAt: -1 });
orderSchema.index({ status: 1, placedAt: -1 });
orderSchema.index({ paymentStatus: 1, placedAt: -1 });
orderSchema.index({ guestEmail: 1, placedAt: -1 }, { sparse: true });
orderSchema.index({ 'shippingAddress.pincode': 1 });

orderSchema.pre('validate', function requireContact(next) {
  if (!this.user && !this.guestEmail) {
    return next(new Error('An order must have either a user or a guest email'));
  }
  next();
});

/**
 * Totals must reconcile. This is the last line of defence against a
 * mis-computed or tampered total reaching the payment gateway.
 */
orderSchema.pre('validate', function verifyTotals(next) {
  const lineSum = this.items.reduce((s, i) => s + i.lineSubtotalPaise, 0);
  if (lineSum !== this.subtotalPaise) {
    return next(
      new Error(`subtotalPaise (${this.subtotalPaise}) does not match line items (${lineSum})`),
    );
  }

  // With inclusive pricing the GST is already inside subtotal and shipping,
  // so adding taxPaise here would charge it twice.
  const expected =
    this.subtotalPaise -
    this.discountPaise +
    this.shippingPaise +
    this.codFeePaise +
    (this.taxInclusive ? 0 : this.taxPaise);

  if (expected !== this.totalPaise) {
    return next(
      new Error(`totalPaise (${this.totalPaise}) does not reconcile with components (${expected})`),
    );
  }

  if (this.discountPaise > this.subtotalPaise) {
    return next(new Error('discount cannot exceed subtotal'));
  }

  // Inclusive tax can never exceed the amount it is supposedly contained in.
  if (this.taxInclusive && this.taxPaise > this.totalPaise) {
    return next(new Error('inclusive taxPaise cannot exceed totalPaise'));
  }

  // Line-level tax must sum to the order-level figure, or the invoice and
  // the GST return will disagree.
  const lineTaxSum = this.items.reduce((s, i) => s + i.lineTaxPaise, 0);
  if (lineTaxSum > this.taxPaise) {
    return next(
      new Error(`line tax (${lineTaxSum}) exceeds order taxPaise (${this.taxPaise})`),
    );
  }
  next();
});

/** COD orders are never marked as paid online. */
orderSchema.pre('validate', function guardCodPaymentStatus(next) {
  if (this.paymentMethod === 'cod' && this.paymentStatus === 'paid') {
    return next(
      new Error('A COD order cannot have paymentStatus "paid" — use "cod_collected"'),
    );
  }
  if (this.paymentMethod === 'razorpay' && this.paymentStatus.startsWith('cod_')) {
    return next(new Error('A Razorpay order cannot use a COD payment status'));
  }
  next();
});

/** Line items are immutable once the order exists. */
orderSchema.pre('save', function freezeItems(next) {
  if (!this.isNew && this.isModified('items')) {
    return next(new Error('Order items are immutable and cannot be modified after creation'));
  }
  if (!this.isNew && (this.isModified('totalPaise') || this.isModified('subtotalPaise'))) {
    return next(new Error('Order totals are immutable after creation'));
  }
  next();
});

/** Enforce the status state machine and keep the audit trail in sync. */
orderSchema.pre('save', function enforceTransition(next) {
  if (this.isNew) {
    this.statusHistory = [{ status: this.status, at: new Date(), bySystem: 'order-created' }];
    return next();
  }

  if (this.isModified('status')) {
    const previous = this.statusHistory.at(-1)?.status;
    if (previous && !canTransition(previous, this.status)) {
      return next(
        new Error(`Illegal order status transition: ${previous} → ${this.status}`),
      );
    }
    this.statusHistory.push({ status: this.status, at: new Date() });

    if (this.status === 'confirmed' && !this.confirmedAt) this.confirmedAt = new Date();
    if (this.status === 'delivered' && !this.deliveredAt) this.deliveredAt = new Date();
    if (this.status === 'cancelled' && !this.cancelledAt) this.cancelledAt = new Date();
  }
  next();
});

export const Order: Model<IOrder> =
  (models.Order as Model<IOrder>) ?? model<IOrder>('Order', orderSchema);
