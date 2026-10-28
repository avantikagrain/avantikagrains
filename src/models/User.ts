import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: "HOME" | "OFFICE" | "OTHER";
  isDefault: boolean;
}

export interface IUser extends Document {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  password?: string;
  role: "customer" | "admin";
  isVerified: boolean;
  addresses: IUserAddress[];
  createdAt: Date;
  updatedAt: Date;
}

const UserAddressSchema = new Schema<IUserAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, default: "Madhya Pradesh" },
    postalCode: { type: String, required: true },
    country: { type: String, default: "India" },
    addressType: { type: String, enum: ["HOME", "OFFICE", "OTHER"], default: "HOME" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    addresses: [UserAddressSchema],
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
