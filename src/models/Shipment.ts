import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

export const SHIPMENT_STATUSES = [
  'pending',
  'created',
  'awb_assigned',
  'pickup_scheduled',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_delivery',
  'rto_initiated',
  'rto_delivered',
  'cancelled',
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export interface IShipmentEvent {
  status: string;
  description?: string;
  location?: string;
  occurredAt: Date;
  rawStatusCode?: string;
}

export interface IShipment {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  provider: 'shiprocket';

  providerOrderId?: string;
  providerShipmentId?: string;
  awbCode?: string;
  courierName?: string;
  courierId?: number;
  status: ShipmentStatus;

  idempotencyKey: string;
  pickupScheduledDate?: Date;
  expectedDeliveryDate?: Date;
  deliveredAt?: Date;
  trackingUrl?: string;
  labelUrl?: string;
  manifestUrl?: string;
  weightGrams: number;
  dimensionsCm?: { length: number; breadth: number; height: number };
  shippingChargePaise?: number;
  isCod: boolean;
  codAmountPaise?: number;
  codCollectedAt?: Date;
  codRemittedAt?: Date;
  events: IShipmentEvent[];
  lastSyncedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IShipmentEvent>(
  {
    status: { type: String, required: true },
    description: String,
    location: String,
    occurredAt: { type: Date, required: true },
    rawStatusCode: String,
  },
  { _id: false },
);

const shipmentSchema = new Schema<IShipment>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    provider: { type: String, enum: ['shiprocket'], default: 'shiprocket', required: true },
    providerOrderId: { type: String, trim: true },
    providerShipmentId: { type: String, trim: true },
    awbCode: { type: String, trim: true },
    courierName: { type: String, trim: true },
    courierId: Number,
    status: { type: String, enum: SHIPMENT_STATUSES, default: 'pending', required: true },
    idempotencyKey: { type: String, required: true },
    pickupScheduledDate: Date,
    expectedDeliveryDate: Date,
    deliveredAt: Date,
    trackingUrl: String,
    labelUrl: String,
    manifestUrl: String,
    weightGrams: { type: Number, required: true, min: 1 },
    dimensionsCm: {
      type: {
        length: { type: Number, min: 1 },
        breadth: { type: Number, min: 1 },
        height: { type: Number, min: 1 },
      },
      _id: false,
    },
    shippingChargePaise: {
      type: Number,
      min: 0,
      validate: { validator: Number.isInteger, message: 'must be an integer in paise' },
    },
    isCod: { type: Boolean, default: false },
    codAmountPaise: {
      type: Number,
      min: 0,
      validate: { validator: Number.isInteger, message: 'must be an integer in paise' },
    },
    codCollectedAt: Date,
    codRemittedAt: Date,
    events: { type: [eventSchema], default: [] },
    lastSyncedAt: Date,
    failureReason: String,
  },
  { timestamps: true },
);

shipmentSchema.index({ idempotencyKey: 1 }, { unique: true });
shipmentSchema.index({ order: 1 });
shipmentSchema.index({ awbCode: 1 }, { unique: true, sparse: true });
shipmentSchema.index({ providerShipmentId: 1 }, { unique: true, sparse: true });
shipmentSchema.index({ status: 1, createdAt: -1 });
shipmentSchema.index({ isCod: 1, codCollectedAt: 1, codRemittedAt: 1 });

shipmentSchema.pre('validate', function requireCodAmount(next) {
  if (this.isCod && (this.codAmountPaise === undefined || this.codAmountPaise <= 0)) {
    return next(new Error('A COD shipment requires a positive codAmountPaise'));
  }
  next();
});

export const Shipment: Model<IShipment> =
  (models.Shipment as Model<IShipment>) ?? model<IShipment>('Shipment', shipmentSchema);
