// mongoose is a CommonJS package. With "type": "module" in package.json,
// named ESM imports of its runtime exports fail under plain Node (tsx, seed
// scripts) even though bundlers paper over it — so take the default export
// and destructure. Types are erased at compile time and import normally.
import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

/**
 * Wholesale and institutional enquiries.
 *
 * Kept as records rather than fired off as email, so nothing is lost in an
 * inbox and the sales pipeline has a status to work through. The admin
 * dashboard reads this collection.
 */

export const ENQUIRY_STATUSES = [
  'new',
  'contacted',
  'quoted',
  'won',
  'lost',
  'spam',
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_PURPOSES = [
  'wholesale',
  'private_label',
  'institutional',
  'export',
  'retail_stocking',
  'other',
] as const;
export type EnquiryPurpose = (typeof ENQUIRY_PURPOSES)[number];

export interface IBulkEnquiry {
  _id: Types.ObjectId;
  reference: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  purpose: EnquiryPurpose;
  /** Free text — buyers describe volume in their own units. */
  productsNeeded: string;
  estimatedMonthlyVolume?: string;
  packFormat?: string;
  message?: string;
  status: EnquiryStatus;
  internalNote?: string;
  handledBy?: Types.ObjectId;
  respondedAt?: Date;
  /** Kept for abuse investigation only; never shown in the dashboard. */
  submittedIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

const INDIAN_PHONE = /^[6-9][0-9]{9}$/;

const bulkEnquirySchema = new Schema<IBulkEnquiry>(
  {
    reference: { type: String, required: true, uppercase: true, trim: true },
    companyName: { type: String, required: true, trim: true, maxlength: 160 },
    contactName: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [INDIAN_PHONE, 'Enter a valid 10-digit Indian mobile number'],
    },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    purpose: { type: String, enum: ENQUIRY_PURPOSES, required: true },
    productsNeeded: { type: String, required: true, trim: true, maxlength: 600 },
    estimatedMonthlyVolume: { type: String, trim: true, maxlength: 120 },
    packFormat: { type: String, trim: true, maxlength: 120 },
    message: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'new', required: true },
    internalNote: { type: String, maxlength: 2000 },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date,
    submittedIp: { type: String, select: false },
  },
  { timestamps: true },
);

bulkEnquirySchema.index({ reference: 1 }, { unique: true });
bulkEnquirySchema.index({ status: 1, createdAt: -1 });
bulkEnquirySchema.index({ email: 1, createdAt: -1 });
// Rate-limit lookups query by phone within a window.
bulkEnquirySchema.index({ phone: 1, createdAt: -1 });

export const BulkEnquiry: Model<IBulkEnquiry> =
  (models.BulkEnquiry as Model<IBulkEnquiry>) ??
  model<IBulkEnquiry>('BulkEnquiry', bulkEnquirySchema);
