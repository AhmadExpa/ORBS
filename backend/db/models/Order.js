import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema(
  {
    label: String,
    amount: Number,
    type: String,
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductPlan", required: true },
    addons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Addon" }],
    billingCycle: { type: String, default: "monthly" },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["draft", "pending_verification", "approved", "rejected", "cancelled"],
      default: "draft",
      index: true,
    },
    lineItems: { type: [lineItemSchema], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
