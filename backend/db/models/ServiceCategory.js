import mongoose from "mongoose";

const serviceCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const ServiceCategory =
  mongoose.models.ServiceCategory || mongoose.model("ServiceCategory", serviceCategorySchema);

