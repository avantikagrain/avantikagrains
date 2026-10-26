import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PLACEHOLDER_FSSAI = '00000000000000';

export interface IProductImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  displayOrder: number;
}

export interface IProductVariant {
  _id: Types.ObjectId;
  sku: string;

  packSize: string;

  weightGrams: number;
  pricePaise: number;
  mrpPaise: number;

  stockQty: number;

  reservedQty: number;

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

  tag?: string;
  shortDescription: string;
  longDescription?: string;
  images: IProductImage[];
  variants: IProductVariant[];
  specifications: { label: string; value: string }[];

  foodDisclosures: {
    fssaiLicenceNo?: string;
    manufacturerName?: string;
    manufacturerAddress?: string;
    countryOfOrigin?: string;
    shelfLifeDays?: number;
    isVegetarian?: boolean;
    storageInstructions?: string;
  };

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

variantSchema.pre('validate', function checkPriceAgainstMrp(next) {
  if (this.pricePaise > this.mrpPaise) {
    return next(new Error(`SKU ${this.sku}: price cannot exceed MRP`));
  }
  next();
});

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

  if (
    process.env.NODE_ENV === 'production' &&
    this.foodDisclosures?.fssaiLicenceNo === PLACEHOLDER_FSSAI
  ) {
    return next(
      new Error(
        `Refusing to publish "${this.name}" in production: the FSSAI licence ` +
          'number is still unset. Obtain the real 14-digit licence from the ' +
          'business before going live.',
      ),
    );
  }

  next();
});

export const Product: Model<IProduct> =
  (models.Product as Model<IProduct>) ?? model<IProduct>('Product', productSchema);
