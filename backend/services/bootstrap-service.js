import bcrypt from "bcryptjs";
import {
  Addon,
  AdminSetting,
  PaymentSetting,
  ProductPlan,
  ServiceCategory,
  StaffUser,
} from "../db/models/index.js";
import { env } from "../config/env.js";
import {
  addonSeeds,
  paymentSettingSeed,
  productPlanSeeds,
  serviceCategories,
} from "../lib/shared/index.js";

export async function ensureBootstrapData() {
  const existingAdmin = await StaffUser.findOne({ email: env.adminBootstrapEmail });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.adminBootstrapPassword, 10);
    await StaffUser.create({
      email: env.adminBootstrapEmail,
      name: "Primary Admin",
      passwordHash,
      role: "admin",
      isActive: true,
    });
  }

  const categoryMap = new Map();
  for (const categorySeed of serviceCategories) {
    let category = await ServiceCategory.findOne({ slug: categorySeed.slug });
    if (!category) {
      category = await ServiceCategory.create(categorySeed);
    } else {
      category.name = categorySeed.name;
      category.description = categorySeed.description;
      category.isActive = categorySeed.isActive;
      category.sortOrder = categorySeed.sortOrder;
      await category.save();
    }
    categoryMap.set(category.slug, category);
  }

  for (const planSeed of productPlanSeeds) {
    const category = categoryMap.get(planSeed.categorySlug);
    if (!category) {
      continue;
    }

    const existingPlan = await ProductPlan.findOne({ slug: planSeed.slug });
    if (!existingPlan) {
      await ProductPlan.create({
        ...planSeed,
        categoryId: category._id,
      });
    } else {
      existingPlan.categoryId = category._id;
      existingPlan.name = planSeed.name;
      existingPlan.description = planSeed.description;
      existingPlan.features = planSeed.features;
      existingPlan.techStack = planSeed.techStack || [];
      existingPlan.planType = planSeed.planType;
      existingPlan.billingCycles = planSeed.billingCycles;
      existingPlan.isManaged = planSeed.isManaged;
      existingPlan.isCustom = planSeed.isCustom;
      existingPlan.contactSalesOnly = planSeed.contactSalesOnly;
      existingPlan.displayPriceLabel = planSeed.displayPriceLabel;
      existingPlan.serviceType = planSeed.serviceType;
      existingPlan.isActive = planSeed.isActive;
      existingPlan.sortOrder = planSeed.sortOrder;
      await existingPlan.save();
    }
  }

  for (const addonSeed of addonSeeds) {
    const category = categoryMap.get(addonSeed.categorySlug);
    if (!category) {
      continue;
    }

    const existingAddon = await Addon.findOne({ name: addonSeed.name });
    if (!existingAddon) {
      await Addon.create({
        ...addonSeed,
        categoryId: category._id,
      });
    }
  }

  const existingPaymentSetting = await PaymentSetting.findOne({ title: paymentSettingSeed.title });
  if (!existingPaymentSetting) {
    await PaymentSetting.create(paymentSettingSeed);
  }

  const companyProfile = await AdminSetting.findOne({ key: "company-profile" });
  if (!companyProfile) {
    await AdminSetting.create({
      key: "company-profile",
      value: {
        companyName: "ElevenOrbits",
        supportEmail: env.supportEmail,
      },
      group: "general",
    });
  }
}
