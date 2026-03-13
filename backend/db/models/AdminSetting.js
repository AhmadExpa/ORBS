import mongoose from "mongoose";

const adminSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: "" },
    group: { type: String, default: "general" },
  },
  { timestamps: true },
);

export const AdminSetting =
  mongoose.models.AdminSetting || mongoose.model("AdminSetting", adminSettingSchema);

