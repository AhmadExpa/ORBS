import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    productPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductPlan", required: true },
    addons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Addon" }],
    billingCycle: { type: String, default: "monthly" },
    status: {
      type: String,
      enum: ["pending_verification", "active", "suspended", "cancelled", "expired"],
      default: "pending_verification",
      index: true,
    },
    startDate: Date,
    renewalDate: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const Subscription =
  mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);

