import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, default: "medium", index: true },
    status: { type: String, default: "open", index: true },
    serviceId: String,
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "StaffUser" },
    lastReplyAt: Date,
  },
  { timestamps: true },
);

export const SupportTicket =
  mongoose.models.SupportTicket || mongoose.model("SupportTicket", supportTicketSchema);

