import express from "express";
import { paymentSubmissionSchema } from "../../lib/shared/index.js";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { uploadPaymentProof } from "../../middleware/uploads.js";
import { HttpError } from "../../utils/http-error.js";
import { Invoice, Order, PaymentSetting, PaymentSubmission, Subscription } from "../../db/models/index.js";
import { recordActivity } from "../../services/activity-log-service.js";
import { processSubscriptionRenewals } from "../../services/billing-cycle-service.js";
import { generateInvoicePdf } from "../../services/invoice-service.js";

export const paymentsRouter = express.Router();

paymentsRouter.get(
  "/settings/active",
  asyncHandler(async (req, res) => {
    const filter = { isActive: true };
    if (req.query.category) {
      filter.supportedFor = req.query.category;
    }
    const setting = await PaymentSetting.findOne(filter).sort({ updatedAt: -1 });
    res.json({ paymentSetting: setting });
  }),
);

paymentsRouter.get(
  "/submissions",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await processSubscriptionRenewals({ userIds: [req.auth.user._id] });

    const submissions = await PaymentSubmission.find({ userId: req.auth.user._id })
      .populate({
        path: "orderId",
        populate: {
          path: "productPlanId",
        },
      })
      .populate("subscriptionId")
      .sort({ submittedAt: -1 });
    res.json({ submissions });
  }),
);

paymentsRouter.post(
  "/submissions",
  requireCustomer,
  uploadPaymentProof.single("proof"),
  asyncHandler(async (req, res) => {
    const payload = paymentSubmissionSchema.parse(req.body);
    const screenshotUrl = req.file ? `/files/uploads/payment-proofs/${req.file.filename}` : "";

    if (payload.submissionType === "wallet_topup") {
      const submission = await PaymentSubmission.create({
        userId: req.auth.user._id,
        submissionType: "wallet_topup",
        amount: payload.amount,
        invoiceCode: payload.invoiceCode,
        paymentMethodType: payload.paymentMethodType,
        screenshotUrl,
        status: "pending_verification",
      });

      await recordActivity({
        actorId: req.auth.user._id,
        actorRole: "customer",
        action: "wallet.topup_submitted",
        targetType: "payment_submission",
        targetId: String(submission._id),
        metadata: {
          amount: payload.amount,
        },
      });

      res.status(201).json({
        submission,
        message:
          "Your wallet top-up request has been submitted. After admin verification, the approved amount will be added to your portal balance.",
      });
      return;
    }

    const order = await Order.findOne({ _id: payload.orderId, userId: req.auth.user._id });
    if (!order) {
      throw new HttpError(404, "Order not found.");
    }

    const subscription = await Subscription.findOne({ orderId: order._id, userId: req.auth.user._id }).populate(
      "productPlanId",
    );

    const submission = await PaymentSubmission.create({
      userId: req.auth.user._id,
      orderId: order._id,
      subscriptionId: subscription?._id,
      submissionType: "order_payment",
      amount: order.totalAmount,
      invoiceCode: payload.invoiceCode,
      paymentMethodType: payload.paymentMethodType,
      screenshotUrl,
      status: "pending_verification",
    });

    order.status = "pending_verification";
    await order.save();

    const invoice = await Invoice.findOne({ orderId: order._id });
    if (invoice) {
      invoice.paymentReferenceCode = payload.invoiceCode;
      invoice.paymentMethodType = payload.paymentMethodType;
      const pdfData = await generateInvoicePdf({
        invoice,
        customer: req.auth.user,
        planName: subscription?.productPlanId?.name || "Managed Service",
        supportEmail: env.supportEmail,
      });
      invoice.pdfPath = pdfData.pdfPath;
      invoice.pdfUrl = pdfData.pdfUrl;
      await invoice.save();
    }

    await recordActivity({
      actorId: req.auth.user._id,
      actorRole: "customer",
      action: "payment.submitted",
      targetType: "payment_submission",
      targetId: String(submission._id),
      metadata: {
        orderId: String(order._id),
        amount: order.totalAmount,
      },
    });

    res.status(201).json({
      submission,
      message:
        "Your payment is in process. After verification, it will be added to your account. International payments usually take less than 3–4 hours to process.",
    });
  }),
);
