import mongoose from "mongoose";

const paymentSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    submissionType: {
      type: String,
      enum: ["order_payment", "wallet_topup"],
      default: "order_payment",
      index: true,
    },
    amount: { type: Number, default: 0 },
    invoiceCode: { type: String, required: true },
    paymentMethodType: { type: String, default: "manual_qr" },
    screenshotUrl: String,
    status: {
      type: String,
      enum: ["pending_verification", "approved", "rejected"],
      default: "pending_verification",
      index: true,
    },
    adminRemarks: String,
    submittedAt: { type: Date, default: Date.now, index: true },
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffUser" },
  },
  { timestamps: true },
);

export const PaymentSubmission =
  mongoose.models.PaymentSubmission || mongoose.model("PaymentSubmission", paymentSubmissionSchema);
