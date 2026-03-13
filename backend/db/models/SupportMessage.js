import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "SupportTicket", required: true, index: true },
    senderType: { type: String, enum: ["customer", "admin", "support_agent"], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    publicSenderName: { type: String, default: "" },
    message: { type: String, required: true },
    attachments: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const SupportMessage =
  mongoose.models.SupportMessage || mongoose.model("SupportMessage", supportMessageSchema);
