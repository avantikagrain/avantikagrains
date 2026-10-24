// mongoose is a CommonJS package. With "type": "module" in package.json,
// named ESM imports of its runtime exports fail under plain Node (tsx, seed
// scripts) even though bundlers paper over it — so take the default export
// and destructure. Types are erased at compile time and import normally.
import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

/**
 * Single-document store configuration.
 *
 * Every field here must be filled from values the business has verified.
 * Nothing is seeded with a plausible-looking default: a wrong GSTIN or an
 * invented FSSAI number on an invoice is a compliance problem, not a bug.
 */

export interface IStoreSettings {
  _id: Types.ObjectId;
  /** Enforces the singleton — always 'default'. */
  key: 'default';

  /**
   * True while the store is running on demo stand-ins (placeholder FSSAI,
   * generated imagery, invented commercials). Production boot refuses to
   * start while this is set.
   */
  demoDataInUse: boolean;

  business: {
    legalName?: string;
    tradeName?: string;
    registeredAddress?: string;
    /** 15-character GSTIN. Required before any tax-inclusive invoice. */
    gstin?: string;
    pan?: string;
    iec?: string;
    /** 14-digit FSSAI licence. Mandatory for food sales in India. */
    fssaiLicenceNo?: string;
    fssaiValidUntil?: Date;
    supportEmail?: string;
    supportPhone?: string;
  };

  tax: {
    /** Prices on the site include GST (standard for Indian B2C retail). */
    pricesIncludeTax: boolean;
    /** State of supply, used to split CGST+SGST vs IGST. */
    originStateCode?: string;
    shippingHsnCode?: string;
    shippingGstRatePercent?: number;
    /** Discounts reduce the taxable value before GST is computed. */
    discountReducesTaxableValue: boolean;
    configurationVerifiedBy?: string;
    configurationVerifiedAt?: Date;
  };

  shipping: {
    freeShippingThresholdPaise?: number;
    flatRatePaise?: number;
    pickupPincode?: string;
    defaultPackageWeightGrams: number;
    maxOrderWeightGrams: number;
  };

  cod: {
    enabled: boolean;
    feePaise: number;
    minOrderPaise: number;
    maxOrderPaise: number;
    /** Empty means "wherever the courier serves". */
    blockedPincodes: string[];
  };

  payments: {
    razorpayLiveMode: boolean;
    /** Set once the Razorpay webhook has actually been configured. */
    razorpayWebhookConfiguredAt?: Date;
  };

  invoicing: {
    seriesPrefix: string;
    nextSequence: number;
    financialYear?: string;
  };

  content: {
    announcementBar?: { text: string; linkUrl?: string; isActive: boolean };
    featuredCategoryIds: Types.ObjectId[];
  };

  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const FSSAI = /^[0-9]{14}$/;

const storeSettingsSchema = new Schema<IStoreSettings>(
  {
    key: { type: String, enum: ['default'], default: 'default', required: true },
    demoDataInUse: { type: Boolean, default: false },

    business: {
      type: {
        legalName: String,
        tradeName: String,
        registeredAddress: String,
        gstin: { type: String, uppercase: true, trim: true, match: [GSTIN, 'Invalid GSTIN format'] },
        pan: { type: String, uppercase: true, trim: true },
        iec: { type: String, uppercase: true, trim: true },
        fssaiLicenceNo: {
          type: String,
          trim: true,
          match: [FSSAI, 'FSSAI licence number must be 14 digits'],
        },
        fssaiValidUntil: Date,
        supportEmail: { type: String, lowercase: true, trim: true },
        supportPhone: { type: String, trim: true },
      },
      default: {},
      _id: false,
    },

    tax: {
      type: {
        pricesIncludeTax: { type: Boolean, default: true },
        originStateCode: String,
        shippingHsnCode: String,
        shippingGstRatePercent: { type: Number, min: 0, max: 28 },
        discountReducesTaxableValue: { type: Boolean, default: true },
        configurationVerifiedBy: String,
        configurationVerifiedAt: Date,
      },
      default: {},
      _id: false,
    },

    shipping: {
      type: {
        freeShippingThresholdPaise: { type: Number, min: 0 },
        flatRatePaise: { type: Number, min: 0 },
        pickupPincode: { type: String, match: [/^[1-9][0-9]{5}$/, 'Invalid PIN code'] },
        defaultPackageWeightGrams: { type: Number, default: 100, min: 1 },
        maxOrderWeightGrams: { type: Number, default: 30000, min: 1 },
      },
      default: {},
      _id: false,
    },

    cod: {
      type: {
        enabled: { type: Boolean, default: true },
        feePaise: { type: Number, default: 0, min: 0 },
        minOrderPaise: { type: Number, default: 0, min: 0 },
        maxOrderPaise: { type: Number, default: 500000, min: 0 },
        blockedPincodes: { type: [String], default: [] },
      },
      default: {},
      _id: false,
    },

    payments: {
      type: {
        razorpayLiveMode: { type: Boolean, default: false },
        razorpayWebhookConfiguredAt: Date,
      },
      default: {},
      _id: false,
    },

    invoicing: {
      type: {
        seriesPrefix: { type: String, default: 'AG' },
        nextSequence: { type: Number, default: 1, min: 1 },
        financialYear: String,
      },
      default: {},
      _id: false,
    },

    content: {
      type: {
        announcementBar: {
          type: {
            text: { type: String, maxlength: 200 },
            linkUrl: String,
            isActive: { type: Boolean, default: false },
          },
          _id: false,
        },
        featuredCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      },
      default: {},
      _id: false,
    },

    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

storeSettingsSchema.index({ key: 1 }, { unique: true });

/**
 * Readiness gate used by the launch checklist and by the publish guard on
 * products. Returns the list of things still missing — empty means ready.
 */
storeSettingsSchema.methods.missingForLaunch = function (
  this: IStoreSettings,
): string[] {
  const missing: string[] = [];
  if (this.demoDataInUse) missing.push('demo stand-in data is still in use');
  if (!this.business?.gstin) missing.push('business.gstin');
  if (!this.business?.legalName) missing.push('business.legalName');
  if (!this.business?.registeredAddress) missing.push('business.registeredAddress');
  if (!this.business?.fssaiLicenceNo) missing.push('business.fssaiLicenceNo');
  if (!this.business?.supportEmail) missing.push('business.supportEmail');
  if (!this.business?.supportPhone) missing.push('business.supportPhone');
  if (!this.tax?.originStateCode) missing.push('tax.originStateCode');
  if (!this.tax?.configurationVerifiedAt) missing.push('tax.configurationVerifiedAt (CA sign-off)');
  if (!this.shipping?.pickupPincode) missing.push('shipping.pickupPincode');
  if (this.payments?.razorpayLiveMode && !this.payments?.razorpayWebhookConfiguredAt) {
    missing.push('payments.razorpayWebhookConfiguredAt');
  }
  return missing;
};

export const StoreSettings: Model<IStoreSettings> =
  (models.StoreSettings as Model<IStoreSettings>) ??
  model<IStoreSettings>('StoreSettings', storeSettingsSchema);
