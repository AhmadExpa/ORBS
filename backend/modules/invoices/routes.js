import express from "express";
import fs from "fs";
import path from "path";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { HttpError } from "../../utils/http-error.js";
import { Invoice, Order, Subscription, User } from "../../db/models/index.js";
import { processSubscriptionRenewals } from "../../services/billing-cycle-service.js";
import { generateInvoicePdf } from "../../services/invoice-service.js";
import {
  isObjectStorageEnabled,
  storageObjectExists,
  streamStorageObjectToResponse,
} from "../../services/storage-service.js";
import { payInvoiceWithWalletBalance } from "../../services/wallet-payment-service.js";
import { sendInvoiceNotification } from "../../services/email-service.js";
import { recordActivity } from "../../services/activity-log-service.js";

export const invoicesRouter = express.Router();

function getInvoiceFileName(invoice) {
  return `${invoice.invoiceNumber || `invoice-${invoice._id}`}.pdf`;
}

function getLocalInvoicePath(invoice) {
  const candidates = [
    invoice.pdfPath,
    invoice.invoiceNumber ? path.join(env.invoiceDir, `${invoice.invoiceNumber}.pdf`) : "",
  ].filter(Boolean);

  return candidates.find((candidatePath) => fs.existsSync(candidatePath)) || "";
}

function applyPdfData(invoice, pdfData) {
  invoice.pdfPath = pdfData.pdfPath;
  invoice.pdfUrl = pdfData.pdfUrl;
  invoice.pdfStorageKey = pdfData.pdfStorageKey;
  invoice.pdfStorageProvider = pdfData.pdfStorageProvider;
}

async function resolveInvoiceRenderContext(invoice) {
  const [customer, subscription, order] = await Promise.all([
    User.findById(invoice.userId),
    invoice.subscriptionId ? Subscription.findById(invoice.subscriptionId).populate("productPlanId") : null,
    invoice.orderId ? Order.findById(invoice.orderId).populate("productPlanId") : null,
  ]);

  return {
    customer,
    planName:
      subscription?.productPlanId?.name ||
      order?.productPlanId?.name ||
      invoice.lineItems?.[0]?.label ||
      "Managed Service",
  };
}

async function regenerateInvoicePdf(invoice) {
  const { customer, planName } = await resolveInvoiceRenderContext(invoice);

  if (!customer) {
    throw new HttpError(404, "Invoice customer not found.");
  }

  const pdfData = await generateInvoicePdf({
    invoice,
    customer,
    planName,
    supportEmail: env.supportEmail,
  });

  applyPdfData(invoice, pdfData);
  await invoice.save();
  return invoice;
}

async function ensureInvoiceDownloadable(invoice) {
  if (isObjectStorageEnabled() && invoice.pdfStorageKey) {
    const existsInStorage = await storageObjectExists(invoice.pdfStorageKey);
    if (existsInStorage) {
      return invoice;
    }
  }

  if (getLocalInvoicePath(invoice)) {
    return invoice;
  }

  return regenerateInvoicePdf(invoice);
}

invoicesRouter.get(
  "/",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await processSubscriptionRenewals({ userIds: [req.auth.user._id] });

    const invoices = await Invoice.find({ userId: req.auth.user._id, status: { $ne: "deleted" } }).sort({ issuedAt: -1 });
    res.json({ invoices });
  }),
);

invoicesRouter.post(
  "/regenerate",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({ userId: req.auth.user._id, status: { $ne: "deleted" } }).sort({ issuedAt: -1 });
    const regeneratedInvoices = [];

    for (const invoice of invoices) {
      regeneratedInvoices.push(await regenerateInvoicePdf(invoice));
    }

    res.json({
      success: true,
      regenerated: regeneratedInvoices.length,
      invoices: regeneratedInvoices,
    });
  }),
);

invoicesRouter.get(
  "/:id",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await processSubscriptionRenewals({ userIds: [req.auth.user._id] });

    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.auth.user._id, status: { $ne: "deleted" } });
    if (!invoice) {
      throw new HttpError(404, "Invoice not found.");
    }
    res.json({ invoice });
  }),
);

invoicesRouter.post(
  "/:id/regenerate",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.auth.user._id, status: { $ne: "deleted" } });
    if (!invoice) {
      throw new HttpError(404, "Invoice not found.");
    }

    await regenerateInvoicePdf(invoice);
    res.json({ success: true, invoice });
  }),
);

invoicesRouter.get(
  "/:id/download",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await processSubscriptionRenewals({ userIds: [req.auth.user._id] });

    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.auth.user._id, status: { $ne: "deleted" } });
    if (!invoice) {
      throw new HttpError(404, "Invoice not found.");
    }

    await ensureInvoiceDownloadable(invoice);

    const fileName = getInvoiceFileName(invoice);
    res.setHeader("Cache-Control", "private, no-store");

    if (isObjectStorageEnabled() && invoice.pdfStorageKey) {
      const existsInStorage = await storageObjectExists(invoice.pdfStorageKey);
      if (existsInStorage) {
        const streamed = await streamStorageObjectToResponse({
          key: invoice.pdfStorageKey,
          res,
          contentType: "application/pdf",
          fileName,
        });

        if (streamed) {
          return;
        }
      }
    }

    const localInvoicePath = getLocalInvoicePath(invoice);
    if (!localInvoicePath) {
      throw new HttpError(404, "Invoice PDF could not be generated.");
    }

    res.download(localInvoicePath, fileName);
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
    await sendInvoiceNotification({
      customer: result.user || req.auth.user,
      invoice: result.invoice,
      planName:
        result.subscription?.productPlanId?.name ||
        result.order?.productPlanId?.name ||
        result.invoice?.lineItems?.[0]?.label ||
        "Managed Service",
      eventType: "invoice_paid",
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

invoicesRouter.delete(
  "/:id",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const reason = String(req.body.reason || "").trim();

    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.auth.user._id, status: { $ne: "deleted" } });
    if (!invoice) {
      throw new HttpError(404, "Invoice not found.");
    }

    if (invoice.status !== "void") {
      throw new HttpError(400, "Only void invoices can be deleted.");
    }

    invoice.status = "deleted";
    invoice.metadata = {
      ...(invoice.metadata || {}),
      deletedByCustomer: true,
      deletedAt: new Date().toISOString(),
      deleteReason: reason || "No reason provided",
    };
    await invoice.save();

    await recordActivity({
      actorId: req.auth.user._id,
      actorRole: "customer",
      action: "invoice.deleted_by_customer",
      targetType: "invoice",
      targetId: String(invoice._id),
      metadata: {
        invoiceNumber: invoice.invoiceNumber || "",
        reason: reason || "No reason provided",
      },
    });

    res.json({
      success: true,
      message: "The invoice has been deleted.",
    });
  }),
);
