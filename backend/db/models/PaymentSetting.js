import mongoose from "mongoose";

const paymentSettingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    qrCodeImageUrl: String,
    paymentLink: String,
    instructions: String,
    isActive: { type: Boolean, default: true },
    supportedFor: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const PaymentSetting =
  mongoose.models.PaymentSetting || mongoose.model("PaymentSetting", paymentSettingSchema);

