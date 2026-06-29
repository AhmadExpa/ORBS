import express from "express";
import { productPlanSchema } from "../../lib/shared/index.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { Addon, ProductPlan, ServiceCategory } from "../../db/models/index.js";
import { HttpError } from "../../utils/http-error.js";

export const catalogRouter = express.Router();

catalogRouter.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const categories = await ServiceCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ categories });
  }),
);

catalogRouter.get(
  "/plans",
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.category) {
      const category = await ServiceCategory.findOne({ slug: req.query.category });
      if (!category) {
        throw new HttpError(404, "Category not found.");
      }
      filter.categoryId = category._id;
    }

    if (req.query.includeInactive !== "true") {
      filter.isActive = true;
    }

    const plans = await ProductPlan.find(filter)
      .populate("categoryId")
      .sort({ sortOrder: 1, monthlyPrice: 1 });

    res.json({ plans });
  }),
);

catalogRouter.get(
  "/plans/:slug",
  asyncHandler(async (req, res) => {
    const plan = await ProductPlan.findOne({ slug: req.params.slug }).populate("categoryId");
    if (!plan) {
      throw new HttpError(404, "Plan not found.");
    }

    res.json({ plan });
  }),
);

catalogRouter.get(
  "/addons",
  asyncHandler(async (req, res) => {
    const filter = { isActive: true };
    if (req.query.category) {
      const category = await ServiceCategory.findOne({ slug: req.query.category });
      if (category) {
        filter.categoryId = category._id;
      }
    }
    const addons = await Addon.find(filter).sort({ addonType: 1, sortOrder: 1, name: 1 });

    // Per-plan scoping: an add-on with an empty planIds applies to every plan
    // in its category; otherwise it only applies to the listed plans.
    const planId = req.query.plan ? String(req.query.plan) : "";
    const scoped = planId
      ? addons.filter((addon) => {
          const planIds = Array.isArray(addon.planIds) ? addon.planIds.map(String) : [];
          return planIds.length === 0 || planIds.includes(planId);
        })
      : addons;

    res.json({ addons: scoped });
  }),
);

catalogRouter.post(
  "/plans/validate",
  asyncHandler(async (req, res) => {
    const plan = productPlanSchema.parse(req.body);
    res.json({ plan });
  }),
);
