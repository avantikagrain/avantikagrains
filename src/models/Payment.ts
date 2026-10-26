import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

export const PAYMENT_RECORD_STATUSES = [
  'created',
  'authorized',
  'captured',
  'failed',
  'partially_refunded',
  'refunded',
] as const;
export type PaymentRecordStatus = (typeof PAYMENT_RECORD_STATUSES)[number];

export interface IRefund {
  _id: Types.ObjectId;
  providerRefundId?: string;
  amountPaise: number;
  reason: string;
  status: 'pending' | 'processed' | 'failed';

  source: 'internal' | 'gateway';
  requestedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  requestedAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

export interface IPayment {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  provider: 'razorpay' | 'cod';

  providerOrderId?: string;

  providerPaymentId?: string;
  amountPaise: number;
  amountRefundedPaise: number;
  currency: 'INR';
  status: PaymentRecordStatus;

  method?: string;

  verifiedServerSide: boolean;
  verifiedAt?: Date;
  verificationSource?: 'checkout_signature' | 'webhook' | 'reconciliation' | 'manual';
  failureCode?: string;
  failureDescription?: string;
  refunds: IRefund[];

  providerSnapshot?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    providerRefundId: { type: String, trim: true },
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'must be an integer in paise' },
    },
    reason: { type: String, required: true, maxlength: 500 },
    status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    source: { type: String, enum: ['internal', 'gateway'], default: 'internal', required: true },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',

      required(this: IRefund) {
        return this.source !== 'gateway';
      },
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date, default: Date.now },
    processedAt: Date,
    failureReason: String,
  },
  { _id: true },
);

const paymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    provider: { type: String, enum: ['razorpay', 'cod'], required: true },
    providerOrderId: { type: String, trim: true },
    providerPaymentId: { type: String, trim: true },
    amountPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'must be an integer in paise' },
    },
    amountRefundedPaise: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: 'must be an integer in paise' },
    },
    currency: { type: String, enum: ['INR'], default: 'INR' },
    status: { type: String, enum: PAYMENT_RECORD_STATUSES, default: 'created', required: true },
    method: { type: String, trim: true },
    verifiedServerSide: { type: Boolean, default: false },
    verifiedAt: Date,
    verificationSource: {
      type: String,
      enum: ['checkout_signature', 'webhook', 'reconciliation', 'manual'],
    },
    failureCode: String,
    failureDescription: String,
    refunds: { type: [refundSchema], default: [] },
    providerSnapshot: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ providerOrderId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ providerPaymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ verifiedServerSide: 1, status: 1 });

paymentSchema.pre('validate', function requireVerification(next) {
  if (this.status === 'captured' && this.provider === 'razorpay' && !this.verifiedServerSide) {
    return next(
      new Error('A Razorpay payment cannot be captured without server-side verification'),
    );
  }
  next();
});

paymentSchema.pre('validate', function capRefunds(next) {
  const processed = this.refunds
    .filter((r) => r.status !== 'failed')
    .reduce((s, r) => s + r.amountPaise, 0);

  if (processed > this.amountPaise) {
    return next(new Error('Total refunds cannot exceed the captured amount'));
  }
  this.amountRefundedPaise = this.refunds
    .filter((r) => r.status === 'processed')
    .reduce((s, r) => s + r.amountPaise, 0);
  next();
});

export const Payment: Model<IPayment> =
  (models.Payment as Model<IPayment>) ?? model<IPayment>('Payment', paymentSchema);
