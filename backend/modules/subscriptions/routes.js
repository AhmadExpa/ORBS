import express from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { Subscription } from "../../db/models/index.js";
import { recordActivity } from "../../services/activity-log-service.js";
import { processSubscriptionRenewals } from "../../services/billing-cycle-service.js";
import { cancelCustomerSubscription } from "../../services/customer-cancellation-service.js";

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

subscriptionsRouter.post(
  "/:id/cancel",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const result = await cancelCustomerSubscription({
      subscriptionId: req.params.id,
      userId: req.auth.user._id,
      customer: req.auth.user,
    });

    await recordActivity({
      actorId: req.auth.user._id,
      actorRole: "customer",
      action: "subscription.cancelled_by_customer",
      targetType: "subscription",
      targetId: String(result.subscription._id),
      metadata: {
        orderId: result.order?._id ? String(result.order._id) : "",
        invoiceId: result.invoice?._id ? String(result.invoice._id) : "",
      },
    });

    res.json({
      success: true,
      message: "The subscription has been cancelled.",
      subscription: result.subscription,
      order: result.order,
      invoice: result.invoice,
    });
  }),
);
