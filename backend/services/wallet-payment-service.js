import { env } from "../config/env.js";
import { Invoice, Order, PaymentSubmission, Subscription, User } from "../db/models/index.js";
import { HttpError } from "../utils/http-error.js";
import { recordActivity } from "./activity-log-service.js";
import { addBillingPeriod } from "./billing-cycle-service.js";
import { generateInvoicePdf } from "./invoice-service.js";
import { withTransaction } from "../db/postgres-model.js";

function isRenewalInvoice(invoice) {
  return String(invoice?.paymentReferenceCode || "").startsWith("renewal_");
}

function buildWalletPaymentReference(invoice) {
  return `wallet_balance_${invoice.invoiceNumber}_${Date.now()}`;
}

function resolvePlanName({ subscription, order }) {
  return subscription?.productPlanId?.name || order?.productPlanId?.name || "Managed Service";
}

async function regenerateInvoicePdf({ invoice, customer, planName }) {
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
  await invoice.save();
}

async function rejectSupersededOrderSubmissions(orderId) {
  if (!orderId) {
    return;
  }

  const pendingSubmissions = await PaymentSubmission.find({
    orderId,
    submissionType: "order_payment",
    status: "pending_verification",
  });

  await Promise.all(
    pendingSubmissions.map(async (submission) => {
      submission.status = "rejected";
      submission.adminRemarks = "Superseded by a completed wallet balance payment.";
      submission.reviewedAt = new Date();
      await submission.save();
    }),
  );
}

async function finalizeOrderInvoicePayment({
  invoice,
  order,
  subscription,
  customer,
  paymentReferenceCode,
}) {
  if (!order) {
    throw new HttpError(404, "The linked order could not be found.");
  }

  if (order.status === "cancelled") {
    throw new HttpError(400, "Cancelled orders cannot be paid.");
  }

  if (order.status === "approved") {
    throw new HttpError(400, "This order has already been paid.");
  }

  await rejectSupersededOrderSubmissions(order._id);

  order.status = "approved";
  await order.save();

  if (subscription && !["cancelled", "expired"].includes(subscription.status)) {
    subscription.status = "active";
    subscription.startDate = new Date();
    subscription.renewalDate = addBillingPeriod(new Date(), subscription.billingCycle);
    subscription.metadata = {
      ...subscription.metadata,
      billingAmount: order.totalAmount,
      lastManualPaymentAt: new Date(),
      lastManualPaymentSource: "wallet_balance",
    };
    await subscription.save();
  }

  invoice.status = "paid";
  invoice.paidAt = new Date();
  invoice.paymentMethodType = "wallet_balance";
  invoice.paymentReferenceCode = paymentReferenceCode;
  await regenerateInvoicePdf({
    invoice,
    customer,
    planName: resolvePlanName({ subscription, order }),
  });

  const submission = await PaymentSubmission.create({
    userId: customer._id,
    orderId: order._id,
    subscriptionId: subscription?._id,
    submissionType: "order_payment",
    amount: invoice.amount,
    invoiceCode: paymentReferenceCode,
    paymentMethodType: "wallet_balance",
    status: "approved",
    adminRemarks: "Customer paid the invoice using wallet balance.",
    gateway: "wallet",
    submittedAt: new Date(),
    reviewedAt: new Date(),
  });

  await recordActivity({
    actorId: customer._id,
    actorRole: "customer",
    action: "payment.completed_via_wallet",
    targetType: "payment_submission",
    targetId: String(submission._id),
    metadata: {
      invoiceId: String(invoice._id),
      orderId: String(order._id),
      amount: invoice.amount,
    },
  });

  return { order, subscription, invoice, submission };
}

async function finalizeRenewalInvoicePayment({
  invoice,
  order,
  subscription,
  customer,
  paymentReferenceCode,
}) {
  if (!subscription) {
    throw new HttpError(404, "The linked subscription could not be found.");
  }

  if (["cancelled", "expired"].includes(subscription.status)) {
    throw new HttpError(400, "This subscription can no longer be renewed.");
  }

  const renewalBaseDate = subscription.renewalDate || invoice.issuedAt || new Date();

  subscription.status = "active";
  subscription.renewalDate = addBillingPeriod(new Date(renewalBaseDate), subscription.billingCycle);
  subscription.metadata = {
    ...subscription.metadata,
    billingAmount: Number(subscription.metadata?.billingAmount || invoice.amount || 0),
    lastManualPaymentAt: new Date(),
    lastManualPaymentAmount: Number(invoice.amount || 0),
    lastManualPaymentSource: "wallet_balance",
    billingNote: "",
    lastStripeChargeError: "",
  };
  await subscription.save();

  invoice.status = "paid";
  invoice.paidAt = new Date();
  invoice.paymentMethodType = "wallet_balance";
  invoice.paymentReferenceCode = paymentReferenceCode;
  await regenerateInvoicePdf({
    invoice,
    customer,
    planName: resolvePlanName({ subscription, order }),
  });

  const submission = await PaymentSubmission.create({
    userId: customer._id,
    orderId: invoice.orderId || order?._id,
    subscriptionId: subscription._id,
    submissionType: "renewal_charge",
    amount: invoice.amount,
    invoiceCode: paymentReferenceCode,
    paymentMethodType: "wallet_balance",
    status: "approved",
    adminRemarks: "Customer paid the renewal invoice using wallet balance.",
    gateway: "wallet",
    submittedAt: new Date(),
    reviewedAt: new Date(),
  });

  await recordActivity({
    actorId: customer._id,
    actorRole: "customer",
    action: "renewal.completed_via_wallet",
    targetType: "payment_submission",
    targetId: String(submission._id),
    metadata: {
      invoiceId: String(invoice._id),
      subscriptionId: String(subscription._id),
      amount: invoice.amount,
    },
  });

  return { order, subscription, invoice, submission };
}

export async function payInvoiceWithWalletBalance({ invoiceId, userId }) {
  return withTransaction(async () => {
    const invoice = await Invoice.findOne({ _id: invoiceId, userId });
    if (!invoice) {
      throw new HttpError(404, "Invoice not found.");
    }

    if (!["pending", "rejected"].includes(invoice.status)) {
      throw new HttpError(400, "Only unpaid invoices can be settled from wallet balance.");
    }

    const amount = Number(invoice.amount || 0);
    if (amount <= 0) {
      throw new HttpError(400, "This invoice does not have a valid payable amount.");
    }

    const [customer, order, subscription] = await Promise.all([
      User.findById(userId),
      invoice.orderId ? Order.findById(invoice.orderId).populate("productPlanId") : Promise.resolve(null),
      invoice.subscriptionId ? Subscription.findById(invoice.subscriptionId).populate("productPlanId") : Promise.resolve(null),
    ]);

    if (!customer) {
      throw new HttpError(404, "User not found.");
    }

    const updatedCustomer = await User.findOneAndUpdate(
      { _id: userId, accountBalance: { $gte: amount } },
      { $inc: { accountBalance: -amount } },
      { new: true },
    );

    if (!updatedCustomer) {
      throw new HttpError(400, "Your wallet balance is not enough to pay this invoice.");
    }

    const paymentReferenceCode = buildWalletPaymentReference(invoice);

    const result = isRenewalInvoice(invoice)
      ? await finalizeRenewalInvoicePayment({
          invoice,
          order,
          subscription,
          customer: updatedCustomer,
          paymentReferenceCode,
        })
      : await finalizeOrderInvoicePayment({
          invoice,
          order,
          subscription,
          customer: updatedCustomer,
          paymentReferenceCode,
        });

    return {
      ...result,
      user: updatedCustomer,
    };
  });
}
