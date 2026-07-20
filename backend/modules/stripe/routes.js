import express from "express";
import { env } from "../../config/env.js";
import { Invoice, Order, PaymentSubmission, Subscription, User } from "../../db/models/index.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import {
  constructWebhookEvent,
  createCheckoutLineItem,
  createPaymentCheckoutSession,
  createPaymentIntent,
  createSavedCardPaymentIntent,
  createSetupCheckoutSession,
  createSetupIntent,
  getUserSavedPaymentMethods,
  removeUserPaymentMethod,
  removeUserDefaultPaymentMethod,
  setUserPrimaryPaymentMethod,
  retrieveCheckoutSession,
  retrievePaymentIntent,
  retrieveSetupIntent,
  updateUserCardAutoBilling,
  updateUserDefaultPaymentMethod,
} from "../../services/stripe-service.js";
import { handleStripeDisputeEvent } from "../../services/stripe-dispute-service.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { recordActivity } from "../../services/activity-log-service.js";
import { addBillingPeriod, processSubscriptionRenewals } from "../../services/billing-cycle-service.js";
import { generateInvoicePdf } from "../../services/invoice-service.js";
import { withTransaction } from "../../db/postgres-model.js";
import { sendInvoiceNotification, sendWalletTopupNotification } from "../../services/email-service.js";
import { requireApprovedContract } from "../../services/contract-service.js";

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

function normalizeChargeId(charge) {
  return typeof charge === "string" ? charge : charge?.id || "";
}

async function findExistingGatewaySubmission({ paymentIntentId, checkoutSessionId, chargeId }) {
  const filters = [];

  if (paymentIntentId) {
    filters.push({ gatewayPaymentId: paymentIntentId });
  }

  if (checkoutSessionId) {
    filters.push({ gatewayCheckoutSessionId: checkoutSessionId });
  }

  if (chargeId) {
    filters.push({ gatewayChargeId: chargeId });
  }

  if (!filters.length) {
    return null;
  }

  return PaymentSubmission.findOne(filters.length === 1 ? filters[0] : { $or: filters });
}

function assertGatewayResourceBelongsToUser({ metadata, user }) {
  if (!metadata?.userId || String(metadata.userId) !== String(user._id)) {
    throw new HttpError(403, "This Stripe payment does not belong to the authenticated customer.");
  }
}

async function rejectPendingOrderSubmissions(orderId, reason) {
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
      submission.adminRemarks = reason;
      submission.reviewedAt = new Date();
      await submission.save();
    }),
  );
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

async function finalizeStripeOrderPayment({ paymentIntentId, checkoutSessionId = "", chargeId = "", metadata, user, paymentMethodId, customerId }) {
  const result = await withTransaction(async () => {
    assertGatewayResourceBelongsToUser({ metadata, user });
    await requireApprovedContract(user.clerkId);

    const { order, subscription, invoice } = await findOrderPaymentContext({
      orderId: metadata?.orderId,
      userId: user._id,
    });

    const existingSubmission = await findExistingGatewaySubmission({
      paymentIntentId,
      checkoutSessionId,
      chargeId,
    });
    if (existingSubmission) {
      return { submission: existingSubmission, shouldNotify: false };
    }

    if (order.status === "cancelled") {
      throw new HttpError(400, "Cancelled orders cannot be paid.");
    }

    if (order.status === "approved" || invoice?.status === "paid") {
      throw new HttpError(400, "This order has already been paid.");
    }

    if (metadata?.preserveSavedCard !== "true" && paymentMethodId && customerId) {
      await updateUserDefaultPaymentMethod({
        user,
        customerId,
        paymentMethodId,
      });
    }

    await rejectPendingOrderSubmissions(
      order._id,
      "Superseded by a completed Stripe card payment.",
    );

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
      invoice.pdfStorageKey = pdfData.pdfStorageKey;
      invoice.pdfStorageProvider = pdfData.pdfStorageProvider;
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
      gatewayChargeId: chargeId,
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

    return {
      submission,
      order,
      subscription,
      invoice,
      shouldNotify: true,
    };
  });

  if (result.shouldNotify && result.invoice) {
    await sendInvoiceNotification({
      customer: user,
      invoice: result.invoice,
      planName: result.subscription?.productPlanId?.name || result.order?.productPlanId?.name || "Managed Service",
      eventType: "invoice_paid",
    });
  }

  return result.submission;
}

async function finalizeStripeWalletTopup({ paymentIntentId, checkoutSessionId = "", chargeId = "", metadata, user, paymentMethodId, customerId }) {
  const result = await withTransaction(async () => {
    assertGatewayResourceBelongsToUser({ metadata, user });
    await requireApprovedContract(user.clerkId);

    const existingSubmission = await findExistingGatewaySubmission({
      paymentIntentId,
      checkoutSessionId,
      chargeId,
    });
    if (existingSubmission) {
      return { submission: existingSubmission, amount: existingSubmission.amount, shouldNotify: false };
    }

    if (metadata?.preserveSavedCard !== "true" && paymentMethodId && customerId) {
      await updateUserDefaultPaymentMethod({
        user,
        customerId,
        paymentMethodId,
      });
    }

    const amount = Number(metadata?.amount || 0);
    if (!amount || amount <= 0) {
      throw new HttpError(400, "Stripe wallet top-up metadata is missing a valid amount.");
    }

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
      gatewayChargeId: chargeId,
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

    return {
      submission,
      amount,
      reference: paymentIntentId || checkoutSessionId,
      shouldNotify: true,
    };
  });

  if (result.shouldNotify) {
    await sendWalletTopupNotification({
      customer: user,
      amount: result.amount,
      reference: result.reference,
    });
  }

  return result.submission;
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

async function finalizeCheckoutSession({ session, user }) {
  const metadataType = session.metadata?.type;
  assertGatewayResourceBelongsToUser({ metadata: session.metadata, user });

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const paymentMethodId = normalizePaymentMethodId(session.payment_intent?.payment_method);
  const chargeId = normalizeChargeId(session.payment_intent?.latest_charge);
  const setupIntentId = typeof session.setup_intent === "string" ? session.setup_intent : session.setup_intent?.id;
  const setupPaymentMethodId = normalizePaymentMethodId(session.setup_intent?.payment_method);
  const customerId = normalizeCustomerId(session.customer);

  if (metadataType === "wallet_topup") {
    if (session.payment_status !== "paid") {
      throw new HttpError(400, "The Stripe wallet top-up is not paid yet.");
    }

    const submission = await finalizeStripeWalletTopup({
      paymentIntentId,
      checkoutSessionId: session.id,
      chargeId,
      metadata: session.metadata,
      user,
      paymentMethodId,
      customerId,
    });

    return { type: metadataType, submission };
  }

  if (metadataType === "order_payment") {
    if (session.payment_status !== "paid") {
      throw new HttpError(400, "The Stripe order payment is not paid yet.");
    }

    const submission = await finalizeStripeOrderPayment({
      paymentIntentId,
      checkoutSessionId: session.id,
      chargeId,
      metadata: session.metadata,
      user,
      paymentMethodId,
      customerId,
    });

    return { type: metadataType, submission };
  }

  if (metadataType === "card_setup") {
    const card = await finalizeStripeCardSetup({
      user,
      paymentMethodId: setupPaymentMethodId,
      setupIntentId,
      customerId,
    });

    return { type: metadataType, card };
  }

  throw new HttpError(400, "Unsupported Stripe checkout session type.");
}

async function finalizePaymentIntent({ paymentIntent, user }) {
  const metadataType = paymentIntent.metadata?.type;
  assertGatewayResourceBelongsToUser({ metadata: paymentIntent.metadata, user });

  if (paymentIntent.status !== "succeeded") {
    throw new HttpError(400, "The Stripe payment is not completed yet.");
  }

  const paymentMethodId = normalizePaymentMethodId(paymentIntent.payment_method);
  const customerId = normalizeCustomerId(paymentIntent.customer);
  const chargeId = normalizeChargeId(paymentIntent.latest_charge);

  if (metadataType === "wallet_topup") {
    const submission = await finalizeStripeWalletTopup({
      paymentIntentId: paymentIntent.id,
      chargeId,
      metadata: paymentIntent.metadata,
      user,
      paymentMethodId,
      customerId,
    });

    return { type: metadataType, submission };
  }

  if (metadataType === "order_payment") {
    const submission = await finalizeStripeOrderPayment({
      paymentIntentId: paymentIntent.id,
      chargeId,
      metadata: paymentIntent.metadata,
      user,
      paymentMethodId,
      customerId,
    });

    return { type: metadataType, submission };
  }

  throw new HttpError(400, "Unsupported Stripe payment intent type.");
}

async function finalizeSetupIntent({ setupIntent, user }) {
  const metadataType = setupIntent.metadata?.type;
  assertGatewayResourceBelongsToUser({ metadata: setupIntent.metadata, user });

  if (setupIntent.status !== "succeeded") {
    throw new HttpError(400, "The Stripe card setup is not completed yet.");
  }

  if (metadataType !== "card_setup") {
    throw new HttpError(400, "Unsupported Stripe setup intent type.");
  }

  const card = await finalizeStripeCardSetup({
    user,
    paymentMethodId: normalizePaymentMethodId(setupIntent.payment_method),
    setupIntentId: setupIntent.id,
    customerId: normalizeCustomerId(setupIntent.customer),
  });

  return { type: metadataType, card };
}

stripeRouter.post(
  "/intents",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.user._id);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    await requireApprovedContract(req.auth.clerkId);

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
        saveForFutureUse: false,
        requestThreeDSecure: "automatic",
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

    await requireApprovedContract(req.auth.clerkId);

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
        saveForFutureUse: false,
        requestThreeDSecure: "automatic",
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

stripeRouter.post(
  "/finalize",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.user._id);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    await requireApprovedContract(req.auth.clerkId);

    const checkoutSessionId = String(req.body.checkoutSessionId || "").trim();
    const paymentIntentId = String(req.body.paymentIntentId || "").trim();
    const setupIntentId = String(req.body.setupIntentId || "").trim();

    if (checkoutSessionId) {
      const session = await retrieveCheckoutSession(checkoutSessionId);
      const result = await finalizeCheckoutSession({ session, user });
      res.json({ success: true, ...result });
      return;
    }

    if (paymentIntentId) {
      const paymentIntent = await retrievePaymentIntent(paymentIntentId);
      const result = await finalizePaymentIntent({ paymentIntent, user });
      res.json({ success: true, ...result });
      return;
    }

    if (setupIntentId) {
      const setupIntent = await retrieveSetupIntent(setupIntentId);
      const result = await finalizeSetupIntent({ setupIntent, user });
      res.json({ success: true, ...result });
      return;
    }

    throw new HttpError(400, "A Stripe checkout session, payment intent, or setup intent ID is required.");
  }),
);

stripeRouter.get(
  "/payment-methods",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.user._id);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    res.json({
      paymentMethods: getUserSavedPaymentMethods(user),
      defaultPaymentMethodId: user.defaultPaymentMethodId || "",
      autoCardBillingEnabled: user.autoCardBillingEnabled !== false,
    });
  }),
);

stripeRouter.post(
  "/payment-methods/:id/topup",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.user._id);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    await requireApprovedContract(req.auth.clerkId);

    const amount = Number(req.body.amount || 0);
    if (!amount || amount <= 0) {
      throw new HttpError(400, "A valid top-up amount is required.");
    }

    const paymentIntent = await createSavedCardPaymentIntent({
      user,
      paymentMethodId: req.params.id,
      amount,
      description: "ElevenOrbits wallet top-up from saved card",
      metadata: {
        type: "wallet_topup",
        userId: user._id,
        amount: amount.toFixed(2),
        preserveSavedCard: "true",
      },
    });

    res.json({
      type: "wallet_topup",
      clientSecret: paymentIntent.client_secret,
      intentId: paymentIntent.id,
    });
  }),
);

stripeRouter.patch(
  "/payment-methods/auto-billing",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.user._id);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    const enabled = Boolean(req.body.enabled);
    if (enabled && !user.defaultPaymentMethodId) {
      throw new HttpError(400, "Choose a primary saved card before enabling automatic card fallback.");
    }

    await updateUserCardAutoBilling({ user, enabled });

    await recordActivity({
      actorId: user._id,
      actorRole: "customer",
      action: enabled ? "stripe.card_auto_billing_enabled" : "stripe.card_auto_billing_disabled",
      targetType: "user",
      targetId: String(user._id),
      metadata: {
        defaultPaymentMethodId: user.defaultPaymentMethodId || "",
      },
    });

    res.json({
      success: true,
      autoCardBillingEnabled: user.autoCardBillingEnabled !== false,
      message: enabled
        ? "Saved-card fallback billing has been enabled."
        : "Saved-card fallback billing has been disabled. Wallet top-ups will remain available.",
    });
  }),
);

stripeRouter.patch(
  "/payment-methods/:id/primary",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.user._id);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    const paymentMethod = await setUserPrimaryPaymentMethod({
      user,
      paymentMethodId: req.params.id,
    });

    await recordActivity({
      actorId: user._id,
      actorRole: "customer",
      action: "stripe.primary_card_updated",
      targetType: "user",
      targetId: String(user._id),
      metadata: {
        paymentMethodId: paymentMethod.id,
      },
    });

    res.json({
      success: true,
      paymentMethod,
      paymentMethods: getUserSavedPaymentMethods(user),
      autoCardBillingEnabled: user.autoCardBillingEnabled !== false,
      message: "Primary renewal card has been updated.",
    });
  }),
);

stripeRouter.delete(
  "/payment-methods/:id",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.user._id);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    const removed = await removeUserPaymentMethod({
      user,
      paymentMethodId: req.params.id,
    });

    await recordActivity({
      actorId: user._id,
      actorRole: "customer",
      action: "stripe.card_removed",
      targetType: "user",
      targetId: String(user._id),
      metadata: {
        paymentMethodId: removed?.paymentMethodId || "",
      },
    });

    await processSubscriptionRenewals({ userIds: [user._id] });

    res.json({
      success: true,
      paymentMethods: getUserSavedPaymentMethods(user),
      autoCardBillingEnabled: user.autoCardBillingEnabled !== false,
      message: "The saved card has been removed.",
    });
  }),
);

stripeRouter.delete(
  "/payment-method",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.user._id);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    if (!user.defaultPaymentMethodId) {
      throw new HttpError(400, "No saved Stripe card is on file.");
    }

    const removed = await removeUserDefaultPaymentMethod({ user });

    await recordActivity({
      actorId: user._id,
      actorRole: "customer",
      action: "stripe.card_removed",
      targetType: "user",
      targetId: String(user._id),
      metadata: {
        paymentMethodId: removed?.paymentMethodId || "",
      },
    });

    await processSubscriptionRenewals({ userIds: [user._id] });

    res.json({
      success: true,
      message: "Your saved card has been removed.",
    });
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
      const user = await User.findById(session.metadata?.userId);

      if (user) {
        await finalizeCheckoutSession({ session, user });
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const metadataType = paymentIntent.metadata?.type;
      const user = await User.findById(paymentIntent.metadata?.userId);

      if (user && ["wallet_topup", "order_payment"].includes(metadataType)) {
        await finalizePaymentIntent({ paymentIntent, user });
      }
    }

    if (event.type === "setup_intent.succeeded") {
      const setupIntent = event.data.object;
      const user = await User.findById(setupIntent.metadata?.userId);

      if (user && setupIntent.metadata?.type === "card_setup") {
        await finalizeSetupIntent({ setupIntent, user });
      }
    }

    if (event.type.startsWith("charge.dispute.")) {
      await handleStripeDisputeEvent({
        dispute: event.data.object,
        eventType: event.type,
      });
    }

    res.json({ received: true });
  }),
);
