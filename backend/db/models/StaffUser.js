import mongoose from "mongoose";

const staffUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "support_agent"], default: "admin" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export const StaffUser = mongoose.models.StaffUser || mongoose.model("StaffUser", staffUserSchema);

