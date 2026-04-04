import express from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { HttpError } from "../../utils/http-error.js";
import { Invoice } from "../../db/models/index.js";
import { processSubscriptionRenewals } from "../../services/billing-cycle-service.js";
import { payInvoiceWithWalletBalance } from "../../services/wallet-payment-service.js";

export const invoicesRouter = express.Router();

invoicesRouter.get(
  "/",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await processSubscriptionRenewals({ userIds: [req.auth.user._id] });

    const invoices = await Invoice.find({ userId: req.auth.user._id }).sort({ issuedAt: -1 });
    res.json({ invoices });
  }),
);

invoicesRouter.get(
  "/:id",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await processSubscriptionRenewals({ userIds: [req.auth.user._id] });

    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.auth.user._id });
    if (!invoice) {
      throw new HttpError(404, "Invoice not found.");
    }
    res.json({ invoice });
  }),
);

invoicesRouter.post(
  "/:id/pay-with-wallet",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const result = await payInvoiceWithWalletBalance({
      invoiceId: req.params.id,
      userId: req.auth.user._id,
    });

    res.json({
      success: true,
      message: "The invoice has been paid from your wallet balance.",
      invoice: result.invoice,
      order: result.order,
      subscription: result.subscription,
      submission: result.submission,
      user: result.user,
    });
  }),
);
