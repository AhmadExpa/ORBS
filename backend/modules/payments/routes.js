import express from "express";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { HttpError } from "../../utils/http-error.js";
import { PaymentSubmission } from "../../db/models/index.js";
import { serializeCustomerPaymentSubmission } from "../../services/payment-submission-view-service.js";

export const paymentsRouter = express.Router();

paymentsRouter.get(
  "/settings/active",
  asyncHandler(async (req, res) => {
    throw new HttpError(410, "Legacy billing configuration is no longer supported.");
  }),
);

paymentsRouter.get(
  "/submissions",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const submissions = await PaymentSubmission.find({ userId: req.auth.user._id })
      .populate({
        path: "orderId",
        populate: {
          path: "productPlanId",
        },
      })
      .populate("subscriptionId")
      .sort({ submittedAt: -1 });
    res.json({
      submissions: submissions.map(serializeCustomerPaymentSubmission),
      currency: env.stripeCurrency.toUpperCase(),
      merchantName: "ElevenOrbits",
    });
  }),
);

paymentsRouter.post(
  "/submissions",
  requireCustomer,
  asyncHandler(async (req, res) => {
    throw new HttpError(410, "This legacy endpoint is no longer supported. Use card checkout or card wallet top-up instead.");
  }),
);
