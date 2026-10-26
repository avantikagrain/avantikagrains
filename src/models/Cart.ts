import mongoose, { type Model, type Types } from 'mongoose';

import { MAX_ITEM_QUANTITY } from '@/lib/limits';

const { Schema, model, models } = mongoose;

export interface ICartItem {
  product: Types.ObjectId;
  variantId: Types.ObjectId;
  quantity: number;

  priceAtAddPaise: number;
  addedAt: Date;
}

export interface ICart {
  _id: Types.ObjectId;
  user?: Types.ObjectId;

  guestToken?: string;
  items: ICartItem[];
  appliedCouponCode?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: MAX_ITEM_QUANTITY,
      validate: { validator: Number.isInteger, message: 'quantity must be an integer' },
    },
    priceAtAddPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'must be an integer in paise' },
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    guestToken: { type: String, trim: true },
    items: { type: [cartItemSchema], default: [] },
    appliedCouponCode: { type: String, uppercase: true, trim: true },
    expiresAt: {
      type: Date,
      required: true,

      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true },
);

cartSchema.index({ user: 1 }, { unique: true, sparse: true });
cartSchema.index({ guestToken: 1 }, { unique: true, sparse: true });

cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

cartSchema.pre('validate', function requireOwner(next) {
  if (!this.user && !this.guestToken) {
    return next(new Error('A cart must belong to either a user or a guest token'));
  }
  next();
});

cartSchema.pre('save', function dedupeItems(next) {
  if (!this.isModified('items')) return next();

  const merged = new Map<string, ICartItem>();
  for (const item of this.items) {
    const key = `${item.product.toString()}:${item.variantId.toString()}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = Math.min(MAX_ITEM_QUANTITY, existing.quantity + item.quantity);
    } else {
      merged.set(key, item);
    }
  }
  this.items = [...merged.values()];
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  next();
});

export const Cart: Model<ICart> =
  (models.Cart as Model<ICart>) ?? model<ICart>('Cart', cartSchema);
