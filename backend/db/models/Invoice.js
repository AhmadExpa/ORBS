import mongoose from "mongoose";

const invoiceLineItemSchema = new mongoose.Schema(
  {
    label: String,
    amount: Number,
    quantity: { type: Number, default: 1 },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    billingCycle: { type: String, default: "monthly" },
    status: { type: String, enum: ["pending", "paid", "rejected", "void"], default: "pending", index: true },
    pdfUrl: String,
    pdfPath: String,
    paymentMethodType: { type: String, default: "pending_confirmation" },
    paymentReferenceCode: String,
    lineItems: { type: [invoiceLineItemSchema], default: [] },
    issuedAt: { type: Date, default: Date.now },
    paidAt: Date,
  },
  { timestamps: true },
);

export const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
