import { env } from "../config/env.js";
import { Invoice, Order, Subscription } from "../db/models/index.js";
import { generateInvoicePdf } from "./invoice-service.js";
import { HttpError } from "../utils/http-error.js";

function applyCustomerCancellationMetadata(metadata = {}, reason) {
  return {
    ...metadata,
    cancelledAt: new Date(),
    cancelledBy: "customer",
    cancellationReason: reason,
  };
}

async function voidPendingInvoice({ invoice, customer, planName }) {
  if (!invoice || !["pending", "rejected"].includes(invoice.status)) {
    return invoice;
  }

  invoice.status = "void";

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

  return invoice;
}

export async function cancelCustomerSubscription({
  subscriptionId,
  userId,
  customer,
  reason = "Customer requested cancellation.",
}) {
  const subscription = await Subscription.findOne({ _id: subscriptionId, userId }).populate("productPlanId");

  if (!subscription) {
    throw new HttpError(404, "Subscription not found.");
  }

  if (["cancelled", "expired", "rejected"].includes(subscription.status)) {
    throw new HttpError(400, "This subscription can no longer be cancelled.");
  }

  subscription.status = "cancelled";
  subscription.cancelAtPeriodEnd = false;
  subscription.metadata = applyCustomerCancellationMetadata(subscription.metadata, reason);
  await subscription.save();

  const order = subscription.orderId
    ? await Order.findOne({ _id: subscription.orderId, userId }).populate("productPlanId")
    : null;

  if (order && !["cancelled", "rejected"].includes(order.status)) {
    order.status = "cancelled";
    order.metadata = applyCustomerCancellationMetadata(order.metadata, reason);
    await order.save();
  }

  const invoice = await Invoice.findOne({ subscriptionId: subscription._id });
  await voidPendingInvoice({
    invoice,
    customer,
    planName: subscription.productPlanId?.name || order?.productPlanId?.name || "Managed Service",
  });

  return { subscription, order, invoice };
}

export async function cancelCustomerOrder({
  orderId,
  userId,
  customer,
  reason = "Customer requested cancellation after approval.",
}) {
  const order = await Order.findOne({ _id: orderId, userId }).populate("productPlanId");

  if (!order) {
    throw new HttpError(404, "Order not found.");
  }

  if (["cancelled", "deleted", "rejected"].includes(order.status)) {
    throw new HttpError(400, "This order can no longer be cancelled.");
  }

  const [subscription, invoice] = await Promise.all([
    Subscription.findOne({ orderId: order._id, userId }).populate("productPlanId"),
    Invoice.findOne({ orderId: order._id }),
  ]);

  const paidApprovedOrder = order.status === "approved" && invoice?.status === "paid";
  const cancellableUnpaidOrder =
    ["draft", "pending_verification", "trial_requested"].includes(order.status) &&
    ["pending", "rejected", "void"].includes(invoice?.status);

  if (!paidApprovedOrder && !cancellableUnpaidOrder) {
    throw new HttpError(400, "This order cannot be cancelled from the portal.");
  }

  order.status = "cancelled";
  order.metadata = applyCustomerCancellationMetadata(order.metadata, reason);
  await order.save();

  if (subscription && !["cancelled", "expired"].includes(subscription.status)) {
    subscription.status = "cancelled";
    subscription.cancelAtPeriodEnd = false;
    subscription.metadata = applyCustomerCancellationMetadata(subscription.metadata, reason);
    await subscription.save();
  }

  await voidPendingInvoice({
    invoice,
    customer,
    planName: subscription?.productPlanId?.name || order.productPlanId?.name || "Managed Service",
  });

  return { order, subscription, invoice };
}

export async function deleteCustomerSubscriptionFromPortal({
  subscriptionId,
  userId,
  reason = "Customer requested deletion from portal.",
}) {
  const subscription = await Subscription.findOne({ _id: subscriptionId, userId }).populate("productPlanId");

  if (!subscription) {
    throw new HttpError(404, "Subscription not found.");
  }

  if (subscription.customerDeletedAt) {
    throw new HttpError(400, "This service has already been removed from your portal.");
  }

  if (!["cancelled", "expired", "rejected"].includes(subscription.status)) {
    throw new HttpError(400, "Only cancelled, expired, or rejected services can be removed from your portal.");
  }

  subscription.customerDeletedAt = new Date();
  subscription.metadata = {
    ...(subscription.metadata || {}),
    deletedAt: subscription.customerDeletedAt.toISOString(),
    deletedBy: "customer",
    deleteReason: reason,
  };
  await subscription.save();

  return { subscription };
}
