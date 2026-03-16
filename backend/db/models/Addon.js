import mongoose from "mongoose";

const addonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory", required: true, index: true },
    addonType: { type: String, enum: ["feature", "region", "storage", "image"], default: "feature", index: true },
    selectionMode: { type: String, enum: ["multi", "single"], default: "multi" },
    optionCode: { type: String, default: "" },
    description: String,
    monthlyPrice: { type: Number, required: true, default: 0 },
    yearlyPrice: { type: Number, required: true, default: 0 },
    includedQuantity: { type: Number, default: 0 },
    pricePerUnitMonthly: { type: Number, default: 0 },
    pricePerUnitYearly: { type: Number, default: 0 },
    unitLabel: { type: String, default: "GB" },
    minQuantity: { type: Number, default: 0 },
    maxQuantity: { type: Number, default: 0 },
    quantityStep: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Addon = mongoose.models.Addon || mongoose.model("Addon", addonSchema);
