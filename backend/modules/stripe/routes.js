import express from "express";
import { env } from "../../config/env.js";
import { Invoice, Order, PaymentSubmission, Subscription, User } from "../../db/models/index.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import {
  constructWebhookEvent,
  createCheckoutLineItem,
  createPaymentCheckoutSession,
  createPaymentIntent,
  createSetupCheckoutSession,
  createSetupIntent,
  retrieveCheckoutSession,
  updateUserDefaultPaymentMethod,
} from "../../services/stripe-service.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { recordActivity } from "../../services/activity-log-service.js";
import { addBillingPeriod, processSubscriptionRenewals } from "../../services/billing-cycle-service.js";
import { generateInvoicePdf } from "../../services/invoice-service.js";

export const stripeRouter = express.Router();
export const stripeWebhookRouter = express.Router();

function successUrl(path, type) {
  return `${env.appUrl}${path}?stripe=success&type=${type}`;
}

function cancelUrl(path, type) {
  return `${env.appUrl}${path}?stripe=cancel&type=${type}`;
}

function normalizeCustomerId(customer) {
  return typeof customer === "string" ? customer : customer?.id || "";
}

function normalizePaymentMethodId(paymentMethod) {
  return typeof paymentMethod === "string" ? paymentMethod : paymentMethod?.id || "";
}

async function findExistingGatewaySubmission({ paymentIntentId, checkoutSessionId }) {
  const filters = [];

  if (paymentIntentId) {
    filters.push({ gatewayPaymentId: paymentIntentId });
  }

  if (checkoutSessionId) {
    filters.push({ gatewayCheckoutSessionId: checkoutSessionId });
  }

  if (!filters.length) {
    return null;
  }

  return PaymentSubmission.findOne(filters.length === 1 ? filters[0] : { $or: filters });
}

async function findOrderPaymentContext({ orderId, userId }) {
  const order = await Order.findOne({ _id: orderId, userId }).populate("productPlanId");
  if (!order) {
    throw new HttpError(404, "Order not found.");
  }

  const [subscription, invoice] = await Promise.all([
    Subscription.findOne({ orderId: order._id, userId }).populate("productPlanId"),
    Invoice.findOne({ orderId: order._id }),
  ]);

  return { order, subscription, invoice };
}

async function finalizeStripeOrderPayment({ paymentIntentId, checkoutSessionId = "", metadata, user, paymentMethodId, customerId }) {
  const { order, subscription, invoice } = await findOrderPaymentContext({
    orderId: metadata?.orderId,
    userId: user._id,
  });

  const existingSubmission = await findExistingGatewaySubmission({
    paymentIntentId,
    checkoutSessionId,
  });
  if (existingSubmission) {
    return existingSubmission;
  }

  if (paymentMethodId && customerId) {
    await updateUserDefaultPaymentMethod({
      user,
      customerId,
      paymentMethodId,
    });
  }

  order.status = "approved";
  await order.save();

  if (subscription) {
    subscription.status = "active";
    subscription.startDate = new Date();
    subscription.renewalDate = addBillingPeriod(new Date(), subscription.billingCycle);
    subscription.metadata = {
      ...subscription.metadata,
      billingAmount: order.totalAmount,
      lastStripePaymentIntentId: paymentIntentId,
      ...(checkoutSessionId ? { lastStripeCheckoutSessionId: checkoutSessionId } : {}),
    };
    await subscription.save();
  }

  if (invoice) {
    invoice.status = "paid";
    invoice.paidAt = new Date();
    invoice.paymentMethodType = "stripe_card";
    invoice.paymentReferenceCode = paymentIntentId;
    const pdfData = await generateInvoicePdf({
      invoice,
      customer: user,
      planName: subscription?.productPlanId?.name || order.productPlanId?.name || "Managed Service",
      supportEmail: env.supportEmail,
    });
    invoice.pdfPath = pdfData.pdfPath;
    invoice.pdfUrl = pdfData.pdfUrl;
    await invoice.save();
  }

  const submission = await PaymentSubmission.create({
    userId: user._id,
    orderId: order._id,
    subscriptionId: subscription?._id,
    submissionType: "order_payment",
    amount: order.totalAmount,
    invoiceCode: paymentIntentId || checkoutSessionId,
    paymentMethodType: "stripe_card",
    status: "approved",
    adminRemarks: "Stripe payment completed automatically.",
    gateway: "stripe",
    gatewayPaymentId: paymentIntentId,
    gatewayCheckoutSessionId: checkoutSessionId,
    submittedAt: new Date(),
    reviewedAt: new Date(),
  });

  await recordActivity({
    actorId: user._id,
    actorRole: "customer",
    action: "payment.completed_via_stripe",
    targetType: "payment_submission",
    targetId: String(submission._id),
    metadata: {
      orderId: String(order._id),
      amount: order.totalAmount,
    },
  });

  return submission;
}

async function finalizeStripeWalletTopup({ paymentIntentId, checkoutSessionId = "", metadata, user, paymentMethodId, customerId }) {
  const existingSubmission = await findExistingGatewaySubmission({
    paymentIntentId,
    checkoutSessionId,
  });
  if (existingSubmission) {
    return existingSubmission;
  }

  if (paymentMethodId && customerId) {
    await updateUserDefaultPaymentMethod({
      user,
      customerId,
      paymentMethodId,
    });
  }

  const amount = Number(metadata?.amount || 0);
  user.accountBalance = Number(user.accountBalance || 0) + amount;
  await user.save();
  await processSubscriptionRenewals({ userIds: [user._id] });

  const submission = await PaymentSubmission.create({
    userId: user._id,
    submissionType: "wallet_topup",
    amount,
    invoiceCode: paymentIntentId || checkoutSessionId,
    paymentMethodType: "stripe_card",
    status: "approved",
    adminRemarks: "Stripe wallet top-up completed automatically.",
    gateway: "stripe",
    gatewayPaymentId: paymentIntentId,
    gatewayCheckoutSessionId: checkoutSessionId,
    submittedAt: new Date(),
    reviewedAt: new Date(),
  });

  await recordActivity({
    actorId: user._id,
    actorRole: "customer",
    action: "wallet.topup_completed_via_stripe",
    targetType: "payment_submission",
    targetId: String(submission._id),
    metadata: {
      amount,
    },
  });

  return submission;
}

async function finalizeStripeCardSetup({ user, paymentMethodId, setupIntentId, customerId }) {
  if (!paymentMethodId || !customerId) {
    return null;
  }

  await updateUserDefaultPaymentMethod({
    user,
    customerId,
    paymentMethodId,
  });

  await recordActivity({
    actorId: user._id,
    actorRole: "customer",
    action: "stripe.card_saved",
    targetType: "user",
    targetId: String(user._id),
    metadata: {
      setupIntentId,
    },
  });

  await processSubscriptionRenewals({ userIds: [user._id] });

  return {
    paymentMethodId,
    setupIntentId,
  };
}

stripeRouter.post(
  "/intents",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.user._id);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    if (req.body.type === "card_setup") {
      const intent = await createSetupIntent({
        user,
        metadata: {
          type: "card_setup",
          userId: user._id,
        },
      });

      res.json({ clientSecret: intent.client_secret, intentId: intent.id });
      return;
    }

    if (req.body.type === "wallet_topup") {
      const amount = Number(req.body.amount || 0);
      if (!amount || amount <= 0) {
        throw new HttpError(400, "A valid top-up amount is required.");
      }

      const intent = await createPaymentIntent({
        user,
        amount,
        description: "ElevenOrbits wallet top-up",
        metadata: {
          type: "wallet_topup",
          userId: user._id,
          amount: amount.toFixed(2),
        },
      });

      res.json({ clientSecret: intent.client_secret, intentId: intent.id });
      return;
    }

    if (req.body.type === "order_payment") {
      const { order, subscription, invoice } = await findOrderPaymentContext({
        orderId: req.body.orderId,
        userId: user._id,
      });

      if (order.status === "approved" || invoice?.status === "paid") {
        throw new HttpError(400, "This order has already been paid.");
      }

      const intent = await createPaymentIntent({
        user,
        amount: order.totalAmount,
        description: invoice?.invoiceNumber || order.productPlanId?.name || "Managed service payment",
        metadata: {
          type: "order_payment",
          userId: user._id,
          orderId: order._id,
          subscriptionId: subscription?._id,
        },
      });

      res.json({ clientSecret: intent.client_secret, intentId: intent.id });
      return;
    }

    throw new HttpError(400, "Unsupported payment intent type.");
  }),
);

stripeRouter.post(
  "/checkout-sessions",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.user._id);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    if (req.body.type === "card_setup") {
      const session = await createSetupCheckoutSession({
        user,
        successUrl: successUrl("/portal/payments", "card_setup"),
        cancelUrl: cancelUrl("/portal/payments", "card_setup"),
      });

      res.json({ url: session.url, sessionId: session.id });
      return;
    }

    if (req.body.type === "wallet_topup") {
      const amount = Number(req.body.amount || 0);
      if (!amount || amount <= 0) {
        throw new HttpError(400, "A valid top-up amount is required.");
      }

      const session = await createPaymentCheckoutSession({
        user,
        successUrl: successUrl("/portal/payments", "wallet_topup"),
        cancelUrl: cancelUrl("/portal/payments", "wallet_topup"),
        lineItems: [
          createCheckoutLineItem({
            name: "ElevenOrbits Wallet Top-up",
            description: "Instant wallet funding through Stripe.",
            amount,
          }),
        ],
        metadata: {
          type: "wallet_topup",
          userId: user._id,
          amount: amount.toFixed(2),
        },
      });

      res.json({ url: session.url, sessionId: session.id });
      return;
    }

    if (req.body.type === "order_payment") {
      const { order, subscription, invoice } = await findOrderPaymentContext({
        orderId: req.body.orderId,
        userId: user._id,
      });

      if (order.status === "approved" || invoice?.status === "paid") {
        throw new HttpError(400, "This order has already been paid.");
      }

      const session = await createPaymentCheckoutSession({
        user,
        successUrl: successUrl(`/portal/checkout/${order._id}`, "order_payment"),
        cancelUrl: cancelUrl(`/portal/checkout/${order._id}`, "order_payment"),
        lineItems: [
          createCheckoutLineItem({
            name: invoice?.invoiceNumber || order.productPlanId?.name || "Managed Service",
            description: order.productPlanId?.description || "Managed service payment",
            amount: order.totalAmount,
          }),
        ],
        metadata: {
          type: "order_payment",
          userId: user._id,
          orderId: order._id,
          subscriptionId: subscription?._id,
        },
      });

      res.json({ url: session.url, sessionId: session.id });
      return;
    }

    throw new HttpError(400, "Unsupported Stripe checkout session type.");
  }),
);

stripeWebhookRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      throw new HttpError(400, "Stripe signature is required.");
    }

    const event = await constructWebhookEvent(req.body, signature);

    if (event.type === "checkout.session.completed") {
      const session = await retrieveCheckoutSession(event.data.object.id);
      const metadataType = session.metadata?.type;
      const user = await User.findById(session.metadata?.userId);

      if (user) {
        const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
        const paymentMethodId = normalizePaymentMethodId(session.payment_intent?.payment_method);
        const setupIntentId =
          typeof session.setup_intent === "string" ? session.setup_intent : session.setup_intent?.id;
        const setupPaymentMethodId = normalizePaymentMethodId(session.setup_intent?.payment_method);
        const customerId = normalizeCustomerId(session.customer);

        if (metadataType === "wallet_topup" && session.payment_status === "paid") {
          await finalizeStripeWalletTopup({
            paymentIntentId,
            checkoutSessionId: session.id,
            metadata: session.metadata,
            user,
            paymentMethodId,
            customerId,
          });
        }

        if (metadataType === "order_payment" && session.payment_status === "paid") {
          await finalizeStripeOrderPayment({
            paymentIntentId,
            checkoutSessionId: session.id,
            metadata: session.metadata,
            user,
            paymentMethodId,
            customerId,
          });
        }

        if (metadataType === "card_setup" && setupPaymentMethodId) {
          await finalizeStripeCardSetup({
            user,
            paymentMethodId: setupPaymentMethodId,
            setupIntentId,
            customerId,
          });
        }
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const metadataType = paymentIntent.metadata?.type;
      const user = await User.findById(paymentIntent.metadata?.userId);

      if (user) {
        const paymentMethodId = normalizePaymentMethodId(paymentIntent.payment_method);
        const customerId = normalizeCustomerId(paymentIntent.customer);

        if (metadataType === "wallet_topup") {
          await finalizeStripeWalletTopup({
            paymentIntentId: paymentIntent.id,
            metadata: paymentIntent.metadata,
            user,
            paymentMethodId,
            customerId,
          });
        }

        if (metadataType === "order_payment") {
          await finalizeStripeOrderPayment({
            paymentIntentId: paymentIntent.id,
            metadata: paymentIntent.metadata,
            user,
            paymentMethodId,
            customerId,
          });
        }
      }
    }

    if (event.type === "setup_intent.succeeded") {
      const setupIntent = event.data.object;
      const user = await User.findById(setupIntent.metadata?.userId);

      if (user) {
        await finalizeStripeCardSetup({
          user,
          paymentMethodId: normalizePaymentMethodId(setupIntent.payment_method),
          setupIntentId: setupIntent.id,
          customerId: normalizeCustomerId(setupIntent.customer),
        });
      }
    }

    res.json({ received: true });
  }),
);
