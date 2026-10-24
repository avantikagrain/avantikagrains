// mongoose is a CommonJS package. With "type": "module" in package.json,
// named ESM imports of its runtime exports fail under plain Node (tsx, seed
// scripts) even though bundlers paper over it — so take the default export
// and destructure. Types are erased at compile time and import normally.
import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

/**
 * Two-part inventory model.
 *
 * `InventoryReservation` holds stock while an order awaits payment. It
 * carries a TTL so a crashed checkout never strands stock — MongoDB expires
 * the document and the sweeper (`releaseExpiredReservations`) returns the
 * units to the variant's available pool.
 *
 * `InventoryMovement` is the append-only ledger. Every change to stockQty
 * has a corresponding movement row, so physical counts can be reconciled
 * against the system at any time.
 */

export const RESERVATION_STATUSES = ['held', 'committed', 'released', 'expired'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export interface IInventoryReservation {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  variantId: Types.ObjectId;
  sku: string;
  quantity: number;
  order?: Types.ObjectId;
  idempotencyKey: string;
  status: ReservationStatus;
  expiresAt: Date;
  committedAt?: Date;
  releasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IInventoryReservation>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    sku: { type: String, required: true, uppercase: true },
    quantity: { type: Number, required: true, min: 1 },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    idempotencyKey: { type: String, required: true },
    status: { type: String, enum: RESERVATION_STATUSES, default: 'held', required: true },
    expiresAt: {
      type: Date,
      required: true,
      // 20 minutes: long enough for a UPI collect request, short enough that
      // stock is not held hostage by abandoned checkouts.
      default: () => new Date(Date.now() + 20 * 60 * 1000),
    },
    committedAt: Date,
    releasedAt: Date,
  },
  { timestamps: true },
);

reservationSchema.index({ idempotencyKey: 1 }, { unique: true });
reservationSchema.index({ order: 1 });
reservationSchema.index({ status: 1, expiresAt: 1 });
reservationSchema.index({ product: 1, variantId: 1, status: 1 });

export const InventoryReservation: Model<IInventoryReservation> =
  (models.InventoryReservation as Model<IInventoryReservation>) ??
  model<IInventoryReservation>('InventoryReservation', reservationSchema);

export const MOVEMENT_REASONS = [
  'purchase_received',
  'order_committed',
  'order_cancelled',
  'order_returned',
  'manual_adjustment',
  'damage_writeoff',
  'stock_count_correction',
  'reservation_expired',
] as const;
export type MovementReason = (typeof MOVEMENT_REASONS)[number];

export interface IInventoryMovement {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  variantId: Types.ObjectId;
  sku: string;
  /** Signed: negative removes stock, positive adds it. */
  delta: number;
  balanceAfter: number;
  reason: MovementReason;
  order?: Types.ObjectId;
  reservation?: Types.ObjectId;
  note?: string;
  performedBy?: Types.ObjectId;
  createdAt: Date;
}

const movementSchema = new Schema<IInventoryMovement>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    sku: { type: String, required: true, uppercase: true },
    delta: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v !== 0,
        message: 'delta must be a non-zero integer',
      },
    },
    balanceAfter: { type: Number, required: true, min: 0 },
    reason: { type: String, enum: MOVEMENT_REASONS, required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    reservation: { type: Schema.Types.ObjectId, ref: 'InventoryReservation' },
    note: { type: String, maxlength: 500 },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

movementSchema.index({ product: 1, variantId: 1, createdAt: -1 });
movementSchema.index({ sku: 1, createdAt: -1 });
movementSchema.index({ order: 1 });
movementSchema.index({ reason: 1, createdAt: -1 });

/** The ledger is append-only — correcting an error means a new row. */
movementSchema.pre('save', function blockUpdates(next) {
  if (!this.isNew) {
    return next(new Error('Inventory movements are append-only and cannot be modified'));
  }
  next();
});

export const InventoryMovement: Model<IInventoryMovement> =
  (models.InventoryMovement as Model<IInventoryMovement>) ??
  model<IInventoryMovement>('InventoryMovement', movementSchema);
