// mongoose is a CommonJS package. With "type": "module" in package.json,
// named ESM imports of its runtime exports fail under plain Node (tsx, seed
// scripts) even though bundlers paper over it — so take the default export
// and destructure. Types are erased at compile time and import normally.
import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

/**
 * Webhook idempotency ledger.
 *
 * Razorpay and Shiprocket both retry on non-2xx, and both can deliver the
 * same event more than once even on success. Every handler inserts here
 * FIRST; the unique index on (provider, providerEventId) means a duplicate
 * insert fails and the handler returns 200 without reprocessing.
 */

export const WEBHOOK_PROCESSING_STATUSES = [
  'received',
  'processing',
  'processed',
  'failed',
  'ignored',
] as const;
export type WebhookProcessingStatus = (typeof WEBHOOK_PROCESSING_STATUSES)[number];

export interface IWebhookEvent {
  _id: Types.ObjectId;
  provider: 'razorpay' | 'shiprocket';
  /** Provider's own event id; falls back to a hash of the raw body. */
  providerEventId: string;
  eventType: string;
  signatureVerified: boolean;
  status: WebhookProcessingStatus;
  payload: Record<string, unknown>;
  relatedOrder?: Types.ObjectId;
  relatedPayment?: Types.ObjectId;
  relatedShipment?: Types.ObjectId;
  attempts: number;
  lastError?: string;
  processedAt?: Date;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    provider: { type: String, enum: ['razorpay', 'shiprocket'], required: true },
    providerEventId: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, trim: true },
    signatureVerified: { type: Boolean, required: true, default: false },
    status: { type: String, enum: WEBHOOK_PROCESSING_STATUSES, default: 'received' },
    payload: { type: Schema.Types.Mixed, required: true },
    relatedOrder: { type: Schema.Types.ObjectId, ref: 'Order' },
    relatedPayment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    relatedShipment: { type: Schema.Types.ObjectId, ref: 'Shipment' },
    attempts: { type: Number, default: 0, min: 0 },
    lastError: String,
    processedAt: Date,
    receivedAt: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true },
);

webhookEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true });
webhookEventSchema.index({ status: 1, receivedAt: -1 });
webhookEventSchema.index({ relatedOrder: 1 });
webhookEventSchema.index({ eventType: 1, receivedAt: -1 });
// Retain 180 days for dispute resolution, then expire.
webhookEventSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export const WebhookEvent: Model<IWebhookEvent> =
  (models.WebhookEvent as Model<IWebhookEvent>) ??
  model<IWebhookEvent>('WebhookEvent', webhookEventSchema);
