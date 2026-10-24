// mongoose is a CommonJS package. With "type": "module" in package.json,
// named ESM imports of its runtime exports fail under plain Node (tsx, seed
// scripts) even though bundlers paper over it — so take the default export
// and destructure. Types are erased at compile time and import normally.
import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  parent?: Types.ObjectId;
  image?: { url: string; alt: string };
  displayOrder: number;
  isActive: boolean;
  seo: { title?: string; description?: string };
  createdAt: Date;
  updatedAt: Date;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [SLUG, 'Slug must be lowercase alphanumeric with hyphens'],
    },
    description: { type: String, trim: true, maxlength: 1000 },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    image: {
      type: { url: { type: String, required: true }, alt: { type: String, required: true } },
      required: false,
      _id: false,
    },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seo: {
      type: {
        title: { type: String, maxlength: 70 },
        description: { type: String, maxlength: 160 },
      },
      default: {},
      _id: false,
    },
  },
  { timestamps: true },
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parent: 1, displayOrder: 1 });
categorySchema.index({ isActive: 1 });

/** A category cannot be its own parent. Deeper cycles are checked in the service layer. */
categorySchema.pre('save', function preventSelfParent(next) {
  if (this.parent && this.parent.equals(this._id)) {
    return next(new Error('A category cannot be its own parent'));
  }
  next();
});

export const Category: Model<ICategory> =
  (models.Category as Model<ICategory>) ?? model<ICategory>('Category', categorySchema);
