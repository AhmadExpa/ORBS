import mongoose from "mongoose";

const billingAddressSchema = new mongoose.Schema(
  {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: String,
    secondaryEmail: String,
    address: String,
    role: { type: String, default: "customer" },
    company: String,
    billingAddress: billingAddressSchema,
    accountBalance: { type: Number, default: 0 },
    stripeCustomerId: { type: String, index: true },
    defaultPaymentMethodId: String,
    defaultPaymentMethodBrand: String,
    defaultPaymentMethodLast4: String,
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
