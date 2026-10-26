import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

export const COUPON_TYPES = ['percentage', 'fixed_amount', 'free_shipping'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export interface ICoupon {
  _id: Types.ObjectId;
  code: string;
  description?: string;
  type: CouponType;

  valuePercent?: number;

  valuePaise?: number;

  maxDiscountPaise?: number;
  minOrderPaise: number;

  totalUsageLimit?: number;
  perUserUsageLimit: number;
  usedCount: number;
  appliesToCategories: Types.ObjectId[];
  appliesToProducts: Types.ObjectId[];
  excludedProducts: Types.ObjectId[];
  firstOrderOnly: boolean;

  allowedPaymentMethods: ('razorpay' | 'cod')[];
  startsAt: Date;
  endsAt?: Date;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 32 },
    description: { type: String, maxlength: 300 },
    type: { type: String, enum: COUPON_TYPES, required: true },
    valuePercent: { type: Number, min: 0, max: 100 },
    valuePaise: {
      type: Number,
      min: 1,
      validate: { validator: Number.isInteger, message: 'must be an integer in paise' },
    },
    maxDiscountPaise: {
      type: Number,
      min: 1,
      validate: { validator: Number.isInteger, message: 'must be an integer in paise' },
    },
    minOrderPaise: { type: Number, default: 0, min: 0 },
    totalUsageLimit: { type: Number, min: 1 },
    perUserUsageLimit: { type: Number, default: 1, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    appliesToCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    appliesToProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    excludedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    firstOrderOnly: { type: Boolean, default: false },
    allowedPaymentMethods: {
      type: [{ type: String, enum: ['razorpay', 'cod'] }],
      default: ['razorpay', 'cod'],
    },
    startsAt: { type: Date, required: true, default: Date.now },
    endsAt: Date,
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

couponSchema.pre('validate', function requireValueForType(next) {
  if (this.type === 'percentage' && this.valuePercent === undefined) {
    return next(new Error('A percentage coupon requires valuePercent'));
  }
  if (this.type === 'fixed_amount' && this.valuePaise === undefined) {
    return next(new Error('A fixed-amount coupon requires valuePaise'));
  }
  if (this.endsAt && this.endsAt <= this.startsAt) {
    return next(new Error('endsAt must be after startsAt'));
  }
  next();
});

couponSchema.methods.isRedeemable = function (this: ICoupon): boolean {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startsAt > now) return false;
  if (this.endsAt && this.endsAt < now) return false;
  if (this.totalUsageLimit && this.usedCount >= this.totalUsageLimit) return false;
  return true;
};

export const Coupon: Model<ICoupon> =
  (models.Coupon as Model<ICoupon>) ?? model<ICoupon>('Coupon', couponSchema);
