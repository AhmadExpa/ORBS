import mongoose from "mongoose";

const addonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory", required: true, index: true },
    description: String,
    monthlyPrice: { type: Number, required: true, default: 0 },
    yearlyPrice: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Addon = mongoose.models.Addon || mongoose.model("Addon", addonSchema);

