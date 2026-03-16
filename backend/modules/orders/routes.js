import express from "express";
import { orderQuoteSchema } from "../../lib/shared/index.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { Invoice, Order, PaymentSetting, ProductPlan, Subscription, Addon } from "../../db/models/index.js";
import { buildOrderLineItems, calculateOrderTotal } from "../../services/pricing-service.js";
import { getStorageMinimumQuantity } from "../../lib/shared/pricing.js";
import { nextInvoiceNumber, generateInvoicePdf } from "../../services/invoice-service.js";
import { env } from "../../config/env.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { recordActivity } from "../../services/activity-log-service.js";

export const ordersRouter = express.Router();

function findAddonOrThrow(addonsById, addonId, message) {
  if (!addonId) {
    return null;
  }

  const addon = addonsById.get(String(addonId));
  if (!addon) {
    throw new HttpError(400, message);
  }

  return addon;
}

function validateSingleAddonType(addon, expectedType, message) {
  if (addon && addon.addonType !== expectedType) {
    throw new HttpError(400, message);
  }
}

function buildConfigurationDetails({ regionAddon, imageAddon, storageAddon, storageQuantity }) {
  const details = [];

  if (regionAddon) {
    details.push({ label: "Region", value: regionAddon.name });
  }

  if (imageAddon) {
    details.push({ label: "Image", value: imageAddon.name });
  }

  if (storageAddon && storageQuantity) {
    details.push({
      label: "Storage",
      value: `${storageQuantity} ${storageAddon.unitLabel || "GB"} ${storageAddon.name}`,
    });
  }

  return details;
}

async function buildQuote(body) {
  const payload = orderQuoteSchema.parse(body);
  const plan = await ProductPlan.findById(payload.productPlanId).populate("categoryId");
  if (!plan || !plan.isActive) {
    throw new HttpError(404, "Selected plan is unavailable.");
  }

  if (plan.contactSalesOnly) {
    return {
      plan,
      addons: [],
      billingCycle: "contact_sales",
      lineItems: [],
      totalAmount: 0,
      contactSalesOnly: true,
    };
  }

  const categoryAddons = await Addon.find({ categoryId: plan.categoryId._id, isActive: true }).sort({ addonType: 1, sortOrder: 1, name: 1 });
  const addonsById = new Map(categoryAddons.map((addon) => [String(addon._id), addon]));

  const featureAddonIds = [...new Set(payload.addonIds || [])];
  const featureAddons = featureAddonIds.map((addonId) =>
    findAddonOrThrow(addonsById, addonId, "One of the selected feature add-ons is unavailable."),
  );
  if (featureAddons.some((addon) => addon.addonType !== "feature")) {
    throw new HttpError(400, "Only feature add-ons can be selected from the feature add-on list.");
  }

  const regionOptions = categoryAddons.filter((addon) => addon.addonType === "region");
  const imageOptions = categoryAddons.filter((addon) => addon.addonType === "image");
  const storageOptions = categoryAddons.filter((addon) => addon.addonType === "storage");

  const regionAddon = findAddonOrThrow(addonsById, payload.selectedRegionId, "Selected region is unavailable.");
  const imageAddon = findAddonOrThrow(addonsById, payload.selectedImageId, "Selected image is unavailable.");
  const storageAddon = findAddonOrThrow(addonsById, payload.selectedStorageId, "Selected storage option is unavailable.");

  validateSingleAddonType(regionAddon, "region", "Selected region is invalid.");
  validateSingleAddonType(imageAddon, "image", "Selected image is invalid.");
  validateSingleAddonType(storageAddon, "storage", "Selected storage option is invalid.");

  if (regionOptions.length && !regionAddon) {
    throw new HttpError(400, "Please select a region before creating the order.");
  }

  if (imageOptions.length && !imageAddon) {
    throw new HttpError(400, "Please select an image before creating the order.");
  }

  if (storageOptions.length && !storageAddon) {
    throw new HttpError(400, "Please select a storage configuration before creating the order.");
  }

  let storageQuantity = 0;
  if (storageAddon) {
    const minimumQuantity = getStorageMinimumQuantity(storageAddon);
    const normalizedQuantity = Number(payload.storageQuantity ?? minimumQuantity);
    const quantityStep = Math.max(Number(storageAddon.quantityStep || 1), 1);
    const maximumQuantity = Number(storageAddon.maxQuantity || 0);

    if (normalizedQuantity < minimumQuantity) {
      throw new HttpError(400, `Storage must be at least ${minimumQuantity} ${storageAddon.unitLabel || "GB"}.`);
    }

    if (maximumQuantity > 0 && normalizedQuantity > maximumQuantity) {
      throw new HttpError(400, `Storage cannot exceed ${maximumQuantity} ${storageAddon.unitLabel || "GB"}.`);
    }

    if ((normalizedQuantity - minimumQuantity) % quantityStep !== 0) {
      throw new HttpError(400, `Storage must increase in ${quantityStep} ${storageAddon.unitLabel || "GB"} increments.`);
    }

    storageQuantity = normalizedQuantity;
  }

  const lineItems = buildOrderLineItems(plan, featureAddons, payload.billingCycle, {
    regionAddon,
    imageAddon,
    storageAddon,
    storageQuantity,
  });
  const totalAmount = calculateOrderTotal(lineItems);
  const finalNote = String(payload.finalNote || "").trim();

  return {
    plan,
    addons: featureAddons,
    regionAddon,
    imageAddon,
    storageAddon,
    storageQuantity,
    configurationDetails: buildConfigurationDetails({
      regionAddon,
      imageAddon,
      storageAddon,
      storageQuantity,
    }),
    finalNote,
    billingCycle: payload.billingCycle,
    lineItems,
    totalAmount,
    contactSalesOnly: false,
  };
}

ordersRouter.post(
  "/quote",
  asyncHandler(async (req, res) => {
    const quote = await buildQuote(req.body);
    res.json({ quote });
  }),
);

ordersRouter.post(
  "/",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const quote = await buildQuote(req.body);

    if (quote.contactSalesOnly) {
      throw new HttpError(400, "This plan requires a contact sales flow.");
    }

    const order = await Order.create({
      userId: req.auth.user._id,
      productPlanId: quote.plan._id,
      addons: quote.addons.map((addon) => addon._id),
      billingCycle: quote.billingCycle,
      totalAmount: quote.totalAmount,
      status: "pending_verification",
      lineItems: quote.lineItems,
      metadata: {
        regionAddonId: quote.regionAddon?._id || null,
        imageAddonId: quote.imageAddon?._id || null,
        storageAddonId: quote.storageAddon?._id || null,
        storageQuantity: quote.storageQuantity || 0,
        configurationDetails: quote.configurationDetails,
        customerNote: quote.finalNote || "",
      },
    });

    const subscription = await Subscription.create({
      userId: req.auth.user._id,
      orderId: order._id,
      productPlanId: quote.plan._id,
      addons: quote.addons.map((addon) => addon._id),
      billingCycle: quote.billingCycle,
      status: "pending_verification",
      sharedDetails: quote.configurationDetails,
      metadata: {
        managedBy: "ElevenOrbits Team",
        regionAddonId: quote.regionAddon?._id || null,
        imageAddonId: quote.imageAddon?._id || null,
        storageAddonId: quote.storageAddon?._id || null,
        storageQuantity: quote.storageQuantity || 0,
        customerNote: quote.finalNote || "",
      },
    });

    const invoiceNumber = await nextInvoiceNumber(Invoice);
    const invoice = await Invoice.create({
      userId: req.auth.user._id,
      subscriptionId: subscription._id,
      orderId: order._id,
      invoiceNumber,
      amount: quote.totalAmount,
      currency: "USD",
      status: "pending",
      paymentMethodType: "pending_confirmation",
      lineItems: quote.lineItems.map((item) => ({
        label: item.label,
        amount: item.amount,
        quantity: item.quantity || 1,
      })),
      billingCycle: quote.billingCycle,
    });

    const pdfData = await generateInvoicePdf({
      invoice,
      customer: req.auth.user,
      planName: quote.plan.name,
      supportEmail: env.supportEmail,
    });

    invoice.pdfPath = pdfData.pdfPath;
    invoice.pdfUrl = pdfData.pdfUrl;
    await invoice.save();

    const paymentSetting = await PaymentSetting.findOne({ isActive: true }).sort({ updatedAt: -1 });

    await recordActivity({
      actorId: req.auth.user._id,
      actorRole: "customer",
      action: "order.created",
      targetType: "order",
      targetId: String(order._id),
      metadata: {
        billingCycle: quote.billingCycle,
        totalAmount: quote.totalAmount,
      },
    });

    res.status(201).json({
      order,
      subscription,
      invoice,
      paymentSetting,
    });
  }),
);

ordersRouter.get(
  "/:id",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.auth.user._id })
      .populate("productPlanId addons")
      .lean();

    if (!order) {
      throw new HttpError(404, "Order not found.");
    }

    const subscription = await Subscription.findOne({ orderId: order._id });
    const invoice = await Invoice.findOne({ orderId: order._id });
    const paymentSetting = await PaymentSetting.findOne({ isActive: true }).sort({ updatedAt: -1 });

    res.json({ order, subscription, invoice, paymentSetting });
  }),
);
