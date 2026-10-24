// mongoose is a CommonJS package. With "type": "module" in package.json,
// named ESM imports of its runtime exports fail under plain Node (tsx, seed
// scripts) even though bundlers paper over it — so take the default export
// and destructure. Types are erased at compile time and import normally.
import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/**
 * Sentinel FSSAI value used for demo and development seeding.
 *
 * Fourteen zeros is structurally valid but unmistakably not a real licence,
 * so nobody can confuse it for genuine compliance data. The publish gate
 * below rejects it whenever NODE_ENV is production.
 */
export const PLACEHOLDER_FSSAI = '00000000000000';

export interface IProductImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  displayOrder: number;
  /** Generated stand-in or stock photo, not real product photography. */
  isPlaceholder: boolean;
  /**
   * Required attribution for stock imagery. The Unsplash API Guidelines
   * oblige an application to credit the photographer and Unsplash wherever
   * a photo is displayed, so the credit travels with the image rather than
   * living in a file nobody renders.
   */
  credit?: {
    photographer: string;
    photographerUrl: string;
    source: string;
    sourceUrl: string;
  };
}

export interface IProductVariant {
  _id: Types.ObjectId;
  sku: string;
  /** Human label as printed on the pack, e.g. "1 KG", "250 g". */
  packSize: string;
  /** Normalised weight in grams — used for shipping rate calculation. */
  weightGrams: number;
  pricePaise: number;
  mrpPaise: number;
  /** Physical units on the shelf. */
  stockQty: number;
  /** Units held against unpaid orders. */
  reservedQty: number;
  /**
   * Denormalised `stockQty - reservedQty`, maintained inside the same atomic
   * $inc as every reservation.
   *
   * This field exists so a reservation can be a single conditional update:
   * MongoDB cannot compare two fields of the same array element inside a
   * query predicate, so `{ availableQty: { $gte: n } }` with the positional
   * operator is the only way to reserve stock without a read-then-write race.
   * Two concurrent buyers for the last unit: one update matches, the other
   * matches nothing and is told the item is out of stock.
   */
  availableQty: number;
  lowStockThreshold: number;
  isActive: boolean;
}

export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  localName?: string;
  slug: string;
  category: Types.ObjectId;
  /** Marketing label shown on the card, e.g. "Ancient Grain". */
  tag?: string;
  shortDescription: string;
  longDescription?: string;
  images: IProductImage[];
  variants: IProductVariant[];
  specifications: { label: string; value: string }[];
  /**
   * Statutory food disclosures. Left empty until the business supplies
   * verified values — a product may not go `active` without them.
   */
  foodDisclosures: {
    fssaiLicenceNo?: string;
    manufacturerName?: string;
    manufacturerAddress?: string;
    countryOfOrigin?: string;
    shelfLifeDays?: number;
    isVegetarian?: boolean;
    storageInstructions?: string;
  };
  /** HSN code and GST rate come from the client's CA, never from a default. */
  tax: { hsnCode?: string; gstRatePercent?: number };
  status: ProductStatus;
  isFeatured: boolean;
  relatedProducts: Types.ObjectId[];
  seo: { title?: string; description?: string };
  searchKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const imageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, required: true, trim: true, maxlength: 160 },
    width: Number,
    height: Number,
    displayOrder: { type: Number, default: 0 },
    isPlaceholder: { type: Boolean, default: false },
    credit: {
      type: {
        photographer: { type: String, required: true },
        photographerUrl: { type: String, required: true },
        source: { type: String, required: true },
        sourceUrl: { type: String, required: true },
      },
      required: false,
      _id: false,
    },
  },
  { _id: false },
);

const variantSchema = new Schema<IProductVariant>(
  {
    sku: { type: String, required: true, uppercase: true, trim: true, maxlength: 40 },
    packSize: { type: String, required: true, trim: true, maxlength: 30 },
    weightGrams: { type: Number, required: true, min: 1, validate: Number.isInteger },
    pricePaise: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'pricePaise must be an integer' },
    },
    mrpPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'mrpPaise must be an integer' },
    },
    stockQty: { type: Number, required: true, default: 0, min: 0 },
    reservedQty: { type: Number, required: true, default: 0, min: 0 },
    availableQty: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

/** Selling above MRP is illegal under the Legal Metrology rules. */
variantSchema.pre('validate', function checkPriceAgainstMrp(next) {
  if (this.pricePaise > this.mrpPaise) {
    return next(new Error(`SKU ${this.sku}: price cannot exceed MRP`));
  }
  next();
});

/**
 * The availability invariant. Reservation and commit paths maintain this
 * through atomic $inc, never through a document save — but any code path
 * that does save a variant must not break it.
 */
variantSchema.pre('validate', function checkAvailabilityInvariant(next) {
  if (this.availableQty !== this.stockQty - this.reservedQty) {
    return next(
      new Error(
        `SKU ${this.sku}: availableQty (${this.availableQty}) must equal ` +
          `stockQty (${this.stockQty}) - reservedQty (${this.reservedQty})`,
      ),
    );
  }
  next();
});

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    localName: { type: String, trim: true, maxlength: 140 },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [SLUG, 'Slug must be lowercase alphanumeric with hyphens'],
    },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    tag: { type: String, trim: true, maxlength: 40 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 400 },
    longDescription: { type: String, trim: true, maxlength: 6000 },
    images: { type: [imageSchema], default: [] },
    variants: {
      type: [variantSchema],
      required: true,
      validate: {
        validator: (v: IProductVariant[]) => v.length > 0,
        message: 'A product must have at least one variant',
      },
    },
    specifications: {
      type: [{ label: { type: String, required: true }, value: { type: String, required: true } }],
      default: [],
      _id: false,
    },
    foodDisclosures: {
      type: {
        fssaiLicenceNo: { type: String, trim: true },
        manufacturerName: { type: String, trim: true },
        manufacturerAddress: { type: String, trim: true },
        countryOfOrigin: { type: String, trim: true },
        shelfLifeDays: { type: Number, min: 1 },
        isVegetarian: Boolean,
        storageInstructions: { type: String, trim: true, maxlength: 500 },
      },
      default: {},
      _id: false,
    },
    tax: {
      type: {
        hsnCode: { type: String, trim: true },
        gstRatePercent: { type: Number, min: 0, max: 28 },
      },
      default: {},
      _id: false,
    },
    status: { type: String, enum: PRODUCT_STATUSES, default: 'draft', required: true },
    isFeatured: { type: Boolean, default: false },
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    seo: {
      type: {
        title: { type: String, maxlength: 70 },
        description: { type: String, maxlength: 160 },
      },
      default: {},
      _id: false,
    },
    searchKeywords: { type: [String], default: [] },
  },
  { timestamps: true },
);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });
productSchema.index({ status: 1, category: 1, createdAt: -1 });
productSchema.index({ status: 1, isFeatured: 1 });
productSchema.index({ 'variants.pricePaise': 1 });
productSchema.index(
  { name: 'text', localName: 'text', shortDescription: 'text', searchKeywords: 'text' },
  { weights: { name: 10, localName: 8, searchKeywords: 5, shortDescription: 1 }, name: 'product_search' },
);

/**
 * A product cannot be published until the data required to sell it legally
 * is present. This is the gate that keeps unverified catalogue rows out of
 * production — it is enforced in the model, not only in the admin UI.
 */
productSchema.pre('validate', function gatePublication(next) {
  if (this.status !== 'active') return next();

  const missing: string[] = [];
  if (this.images.length === 0) missing.push('at least one product image');
  if (!this.tax?.hsnCode) missing.push('tax.hsnCode');
  if (this.tax?.gstRatePercent === undefined) missing.push('tax.gstRatePercent');
  if (!this.foodDisclosures?.fssaiLicenceNo) missing.push('foodDisclosures.fssaiLicenceNo');
  if (!this.foodDisclosures?.manufacturerName) missing.push('foodDisclosures.manufacturerName');
  if (!this.foodDisclosures?.countryOfOrigin) missing.push('foodDisclosures.countryOfOrigin');

  if (missing.length > 0) {
    return next(
      new Error(
        `Cannot set status "active" — missing verified data: ${missing.join(', ')}. ` +
          'Obtain these from the business before publishing.',
      ),
    );
  }

  // Demo/development seeding fills the fields above with stand-in values so
  // the storefront can be shown to a client. Those stand-ins must never
  // reach a production deployment, where a fake licence number on an invoice
  // is a legal misrepresentation rather than a placeholder.
  if (process.env.NODE_ENV === 'production') {
    // A placeholder FSSAI number on a live food listing is a legal
    // misrepresentation, not a cosmetic gap. This block has no override.
    if (this.foodDisclosures?.fssaiLicenceNo === PLACEHOLDER_FSSAI) {
      return next(
        new Error(
          `Refusing to publish "${this.name}" in production: the FSSAI licence ` +
            'number is still the placeholder value. Obtain the real 14-digit ' +
            'licence from the business before going live.',
        ),
      );
    }

    // Imagery is a quality judgement the business owns, so this one can be
    // overridden — but only deliberately, by setting the variable. Left
    // unset, a deploy that still carries stand-in images fails loudly
    // instead of quietly shipping them.
    if (
      this.images.some((img) => img.isPlaceholder) &&
      process.env.ALLOW_PLACEHOLDER_IMAGES !== 'true'
    ) {
      return next(
        new Error(
          `Refusing to publish "${this.name}" in production: it still uses ` +
            'stand-in imagery rather than the mill\'s own photography. Replace ' +
            'the image, or set ALLOW_PLACEHOLDER_IMAGES=true to publish anyway.',
        ),
      );
    }
  }
  next();
});

export const Product: Model<IProduct> =
  (models.Product as Model<IProduct>) ?? model<IProduct>('Product', productSchema);
