import { env } from "../config/env.js";
import { Invoice, Order, PaymentSubmission, Subscription, User } from "../db/models/index.js";
import { withTransaction } from "../db/postgres-model.js";
import { generateInvoicePdf } from "./invoice-service.js";
import { recordActivity } from "./activity-log-service.js";
import { retrieveCharge } from "./stripe-service.js";

const openDisputeStatuses = new Set([
  "needs_response",
  "under_review",
  "warning_needs_response",
  "warning_under_review",
]);

const merchantResolvedStatuses = new Set(["won", "warning_closed", "prevented"]);
const customerResolvedStatuses = new Set(["lost"]);

function toDateFromUnix(value) {
  const timestamp = Number(value || 0);
  return timestamp > 0 ? new Date(timestamp * 1000) : null;
}

export function normalizeStripeId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.id || "";
}

export function stripeAmountToMajorUnit(amount) {
  return Number((Number(amount || 0) / 100).toFixed(2));
}

export function getStripeDisputeOutcome(disputeStatus) {
  const status = String(disputeStatus || "").toLowerCase();

  if (customerResolvedStatuses.has(status)) {
    return "lost";
  }

  if (merchantResolvedStatuses.has(status)) {
    return "resolved";
  }

  if (openDisputeStatuses.has(status)) {
    return "open";
  }

  return "open";
}

export function getPaymentStatusForStripeDispute(disputeStatus) {
  const outcome = getStripeDisputeOutcome(disputeStatus);

  if (outcome === "lost") {
    return "charged_back";
  }

  if (outcome === "resolved") {
    return "approved";
  }

  return "disputed";
}

function getInvoiceStatusForStripeDispute(disputeStatus) {
  const outcome = getStripeDisputeOutcome(disputeStatus);

  if (outcome === "lost") {
    return "charged_back";
  }

  if (outcome === "resolved") {
    return "paid";
  }

  return "disputed";
}

function formatDisputeDueBy(dispute) {
  const dueBy = toDateFromUnix(dispute?.evidence_details?.due_by);
  return dueBy ? dueBy.toISOString().slice(0, 10) : "";
}

function buildDisputeSnapshot({ dispute, eventType, chargeId, paymentIntentId }) {
  return {
    id: dispute.id,
    status: dispute.status || "",
    reason: dispute.reason || "",
    eventType,
    chargeId,
    paymentIntentId,
    amount: stripeAmountToMajorUnit(dispute.amount),
    currency: String(dispute.currency || env.stripeCurrency || "usd").toUpperCase(),
    caseType: dispute.payment_method_details?.card?.case_type || "",
    dueBy: formatDisputeDueBy(dispute),
    updatedAt: new Date().toISOString(),
  };
}

function buildAdminRemarks({ dispute, eventType }) {
  const dueBy = formatDisputeDueBy(dispute);
  const parts = [
    `Stripe dispute ${dispute.id} is ${String(dispute.status || "open").replaceAll("_", " ")}.`,
    dispute.reason ? `Reason: ${String(dispute.reason).replaceAll("_", " ")}.` : "",
    dueBy ? `Evidence due by ${dueBy}.` : "",
    `Last event: ${eventType}.`,
  ];

  return parts.filter(Boolean).join(" ");
}

function isSubscriptionTerminal(subscription) {
  return ["cancelled", "expired"].includes(subscription?.status);
}

function normalizeDocumentId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return value._id ? String(value._id) : "";
  }

  return String(value);
}

async function findDisputedSubmission({ disputeId, paymentIntentId, chargeId }) {
  const filters = [];

  if (disputeId) {
    filters.push({ stripeDisputeId: disputeId });
  }

  if (paymentIntentId) {
    filters.push({ gatewayPaymentId: paymentIntentId });
  }

  if (chargeId) {
    filters.push({ gatewayChargeId: chargeId });
  }

  if (!filters.length) {
    return null;
  }

  return PaymentSubmission.findOne(filters.length === 1 ? filters[0] : { $or: filters });
}

async function findInvoiceForSubmission(submission) {
  if (!submission) {
    return null;
  }

  if (submission.invoiceCode) {
    const byReference = await Invoice.findOne({ paymentReferenceCode: submission.invoiceCode });
    if (byReference) {
      return byReference;
    }
  }

  if (submission.gatewayPaymentId) {
    const byPaymentIntent = await Invoice.findOne({ paymentReferenceCode: submission.gatewayPaymentId });
    if (byPaymentIntent) {
      return byPaymentIntent;
    }
  }

  const orderId = normalizeDocumentId(submission.orderId);
  if (orderId) {
    const byOrder = await Invoice.findOne({ orderId });
    if (byOrder) {
      return byOrder;
    }
  }

  return null;
}

async function resolveInvoiceRenderContext(invoice) {
  if (!invoice) {
    return { customer: null, subscription: null, order: null, planName: "Managed Service" };
  }

  const [customer, subscription, order] = await Promise.all([
    User.findById(invoice.userId),
    invoice.subscriptionId ? Subscription.findById(invoice.subscriptionId).populate("productPlanId") : null,
    invoice.orderId ? Order.findById(invoice.orderId).populate("productPlanId") : null,
  ]);

  return {
    customer,
    subscription,
    order,
    planName:
      subscription?.productPlanId?.name ||
      order?.productPlanId?.name ||
      invoice.lineItems?.[0]?.label ||
      "Managed Service",
  };
}

async function updateInvoiceForDispute({ invoice, dispute, eventType, chargeId, paymentIntentId }) {
  if (!invoice) {
    return null;
  }

  const invoiceStatus = getInvoiceStatusForStripeDispute(dispute.status);
  const snapshot = buildDisputeSnapshot({ dispute, eventType, chargeId, paymentIntentId });

  invoice.status = invoiceStatus;
  invoice.metadata = {
    ...(invoice.metadata || {}),
    stripeDispute: snapshot,
  };
  invoice.stripeDisputeId = dispute.id;
  invoice.stripeDisputeStatus = dispute.status || "";
  invoice.stripeDisputeReason = dispute.reason || "";
  invoice.stripeDisputeAmount = snapshot.amount;
  invoice.stripeDisputeCurrency = snapshot.currency;
  invoice.stripeDisputeEventType = eventType;
  invoice.disputeResolvedAt = getStripeDisputeOutcome(dispute.status) === "open" ? null : new Date();

  const { customer, planName } = await resolveInvoiceRenderContext(invoice);
  if (customer) {
    const pdfData = await generateInvoicePdf({
      invoice,
      customer,
      planName,
      supportEmail: env.supportEmail,
    });
    invoice.pdfPath = pdfData.pdfPath;
    invoice.pdfUrl = pdfData.pdfUrl;
    invoice.pdfStorageKey = pdfData.pdfStorageKey;
    invoice.pdfStorageProvider = pdfData.pdfStorageProvider;
  }

  await invoice.save();
  return invoice;
}

async function updateSubscriptionForDispute({ subscription, dispute, eventType }) {
  if (!subscription || isSubscriptionTerminal(subscription)) {
    return null;
  }

  const outcome = getStripeDisputeOutcome(dispute.status);
  const existingMetadata = subscription.metadata || {};
  const existingDispute = existingMetadata.stripeDispute || {};
  const previousStatus =
    existingDispute.previousStatus ||
    existingMetadata.stripeDisputePreviousStatus ||
    subscription.status;

  const stripeDispute = {
    ...existingDispute,
    id: dispute.id,
    status: dispute.status || "",
    reason: dispute.reason || "",
    eventType,
    previousStatus,
    updatedAt: new Date().toISOString(),
  };

  if (outcome === "open" || outcome === "lost") {
    subscription.status = "suspended";
    subscription.metadata = {
      ...existingMetadata,
      stripeDispute,
      stripeDisputeId: dispute.id,
      stripeDisputeStatus: dispute.status || "",
      stripeDisputePreviousStatus: previousStatus,
      billingNote:
        outcome === "lost"
          ? "A Stripe card dispute was lost and the payment was charged back. Service remains suspended pending billing review."
          : "A Stripe card dispute is open for this payment. Service is suspended while the dispute is reviewed.",
    };
    await subscription.save();
    return subscription;
  }

  const shouldRestore =
    subscription.status === "suspended" &&
    existingMetadata.stripeDisputeId === dispute.id &&
    previousStatus &&
    previousStatus !== "suspended";

  if (shouldRestore) {
    subscription.status = previousStatus;
  }

  subscription.metadata = {
    ...existingMetadata,
    stripeDispute: {
      ...stripeDispute,
      resolvedAt: new Date().toISOString(),
    },
    stripeDisputeId: dispute.id,
    stripeDisputeStatus: dispute.status || "",
    billingNote: shouldRestore ? "" : existingMetadata.billingNote || "",
  };
  await subscription.save();
  return subscription;
}

async function applyWalletTopupDisputeAdjustment({ submission, customer, dispute }) {
  if (!submission || submission.submissionType !== "wallet_topup" || !customer) {
    return submission?.metadata || {};
  }

  const outcome = getStripeDisputeOutcome(dispute.status);
  const metadata = submission.metadata || {};
  const adjustment = metadata.stripeDisputeWalletAdjustment || {};
  const amount = stripeAmountToMajorUnit(dispute.amount || Math.round(Number(submission.amount || 0) * 100));

  if ((outcome === "open" || outcome === "lost") && !adjustment.debitedAt) {
    customer.accountBalance = Number(customer.accountBalance || 0) - amount;
    await customer.save();

    return {
      ...metadata,
      stripeDisputeWalletAdjustment: {
        disputeId: dispute.id,
        debitAmount: amount,
        debitedAt: new Date().toISOString(),
        restoredAt: "",
      },
    };
  }

  if (outcome === "resolved" && adjustment.debitedAt && !adjustment.restoredAt) {
    const restoreAmount = Number(adjustment.debitAmount || amount || 0);
    customer.accountBalance = Number(customer.accountBalance || 0) + restoreAmount;
    await customer.save();

    return {
      ...metadata,
      stripeDisputeWalletAdjustment: {
        ...adjustment,
        restoredAt: new Date().toISOString(),
      },
    };
  }

  return metadata;
}

export async function handleStripeDisputeEvent({ dispute, eventType }) {
  const chargeId = normalizeStripeId(dispute?.charge);
  let paymentIntentId = normalizeStripeId(dispute?.payment_intent);

  if (!paymentIntentId && chargeId) {
    const charge = await retrieveCharge(chargeId);
    paymentIntentId = normalizeStripeId(charge?.payment_intent);
  }

  return withTransaction(async () => {
    const submission = await findDisputedSubmission({
      disputeId: dispute.id,
      paymentIntentId,
      chargeId,
    });

    if (!submission) {
      console.warn(`Stripe dispute ${dispute.id} could not be matched to a local payment submission.`);
      return { handled: false };
    }

    const [invoice, customer, subscription] = await Promise.all([
      findInvoiceForSubmission(submission),
      User.findById(submission.userId),
      normalizeDocumentId(submission.subscriptionId) ? Subscription.findById(normalizeDocumentId(submission.subscriptionId)) : null,
    ]);

    const snapshot = buildDisputeSnapshot({ dispute, eventType, chargeId, paymentIntentId });
    const metadataAfterWalletAdjustment = await applyWalletTopupDisputeAdjustment({
      submission,
      customer,
      dispute,
    });

    submission.status = getPaymentStatusForStripeDispute(dispute.status);
    submission.adminRemarks = buildAdminRemarks({ dispute, eventType });
    submission.gatewayPaymentId = submission.gatewayPaymentId || paymentIntentId;
    submission.gatewayChargeId = submission.gatewayChargeId || chargeId;
    submission.stripeDisputeId = dispute.id;
    submission.stripeDisputeStatus = dispute.status || "";
    submission.stripeDisputeReason = dispute.reason || "";
    submission.stripeDisputeAmount = snapshot.amount;
    submission.stripeDisputeCurrency = snapshot.currency;
    submission.stripeDisputeCaseType = snapshot.caseType;
    submission.stripeDisputeEventType = eventType;
    submission.stripeDisputeDueBy = toDateFromUnix(dispute?.evidence_details?.due_by);
    submission.disputedAt = submission.disputedAt || new Date();
    submission.disputeResolvedAt = getStripeDisputeOutcome(dispute.status) === "open" ? null : new Date();
    submission.metadata = {
      ...metadataAfterWalletAdjustment,
      stripeDispute: snapshot,
    };
    await submission.save();

    const updatedInvoice = await updateInvoiceForDispute({
      invoice,
      dispute,
      eventType,
      chargeId,
      paymentIntentId,
    });

    const updatedSubscription = await updateSubscriptionForDispute({
      subscription,
      dispute,
      eventType,
    });

    await recordActivity({
      actorId: customer?._id || submission.userId,
      actorRole: "system",
      action: `stripe.dispute.${getStripeDisputeOutcome(dispute.status)}`,
      targetType: "payment_submission",
      targetId: String(submission._id),
      metadata: {
        disputeId: dispute.id,
        disputeStatus: dispute.status || "",
        disputeReason: dispute.reason || "",
        eventType,
        paymentIntentId,
        chargeId,
        invoiceId: updatedInvoice?._id ? String(updatedInvoice._id) : "",
        subscriptionId: updatedSubscription?._id ? String(updatedSubscription._id) : "",
      },
    });

    return {
      handled: true,
      submission,
      invoice: updatedInvoice,
      subscription: updatedSubscription,
    };
  });
}
