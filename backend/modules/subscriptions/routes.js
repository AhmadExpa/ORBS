import express from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { Subscription } from "../../db/models/index.js";
import { processSubscriptionRenewals } from "../../services/billing-cycle-service.js";

export const subscriptionsRouter = express.Router();

subscriptionsRouter.get(
  "/",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await processSubscriptionRenewals({ userIds: [req.auth.user._id] });

    const subscriptions = await Subscription.find({ userId: req.auth.user._id })
      .populate({
        path: "productPlanId",
        populate: {
          path: "categoryId",
        },
      })
      .populate("addons")
      .sort({ createdAt: -1 });

    res.json({ subscriptions });
  }),
);
