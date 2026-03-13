import mongoose from "mongoose";

const productPlanSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    monthlyPrice: { type: Number, required: true, default: 0 },
    yearlyPrice: { type: Number, required: true, default: 0 },
    yearlyDiscountPercent: { type: Number, default: 0 },
    features: { type: [String], default: [] },
    planType: { type: String, default: "standard" },
    billingCycles: { type: [String], default: ["monthly"] },
    isManaged: { type: Boolean, default: true },
    isCustom: { type: Boolean, default: false },
    contactSalesOnly: { type: Boolean, default: false },
    displayPriceLabel: String,
    serviceType: String,
    techStack: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const ProductPlan = mongoose.models.ProductPlan || mongoose.model("ProductPlan", productPlanSchema);
