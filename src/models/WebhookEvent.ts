import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

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

webhookEventSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export const WebhookEvent: Model<IWebhookEvent> =
  (models.WebhookEvent as Model<IWebhookEvent>) ??
  model<IWebhookEvent>('WebhookEvent', webhookEventSchema);
