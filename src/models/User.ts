import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;
import { USER_ROLES, type UserRole } from '@/lib/auth/rbac';

export interface IAddress {
  _id: Types.ObjectId;
  label?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  phone?: string;
  passwordHash: string;
  firstName: string;
  lastName?: string;
  role: UserRole;
  addresses: IAddress[];
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  isActive: boolean;

  refreshTokenFamily?: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  lastLoginAt?: Date;

  marketingOptInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const INDIAN_PINCODE = /^[1-9][0-9]{5}$/;
const INDIAN_PHONE = /^[6-9][0-9]{9}$/;

const addressSchema = new Schema<IAddress>(
  {
    label: { type: String, trim: true, maxlength: 40 },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [INDIAN_PHONE, 'Enter a valid 10-digit Indian mobile number'],
    },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    landmark: { type: String, trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, required: true, trim: true, maxlength: 80 },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: [INDIAN_PINCODE, 'Enter a valid 6-digit PIN code'],
    },
    country: { type: String, required: true, default: 'IN', enum: ['IN'] },
    isDefaultShipping: { type: Boolean, default: false },
    isDefaultBilling: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false },
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    phone: { type: String, trim: true, match: [INDIAN_PHONE, 'Enter a valid mobile number'] },

    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, trim: true, maxlength: 80 },
    role: { type: String, required: true, enum: USER_ROLES, default: 'customer' },
    addresses: { type: [addressSchema], default: [] },
    emailVerifiedAt: Date,
    phoneVerifiedAt: Date,
    isActive: { type: Boolean, default: true },
    refreshTokenFamily: { type: String, select: false },
    failedLoginAttempts: { type: Number, default: 0, min: 0 },
    lockedUntil: Date,
    lastLoginAt: Date,
    marketingOptInAt: Date,
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, createdAt: -1 });

userSchema.pre('save', function enforceSingleDefault(next) {
  if (this.isModified('addresses')) {
    let shippingSeen = false;
    let billingSeen = false;
    for (const addr of this.addresses) {
      if (addr.isDefaultShipping) {
        if (shippingSeen) addr.isDefaultShipping = false;
        shippingSeen = true;
      }
      if (addr.isDefaultBilling) {
        if (billingSeen) addr.isDefaultBilling = false;
        billingSeen = true;
      }
    }
    if (!shippingSeen && this.addresses.length > 0) {
      this.addresses[0].isDefaultShipping = true;
    }
  }
  next();
});

userSchema.virtual('isLocked').get(function (this: IUser) {
  return Boolean(this.lockedUntil && this.lockedUntil > new Date());
});

export const User: Model<IUser> =
  (models.User as Model<IUser>) ?? model<IUser>('User', userSchema);
