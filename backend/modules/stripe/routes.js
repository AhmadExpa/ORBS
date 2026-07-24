import express from "express";
import { env } from "../../config/env.js";
import { Invoice, Order, PaymentSubmission, Subscription, User } from "../../db/models/index.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import {
  constructWebhookEvent,
  createCheckoutLineItem,
  createPaymentCheckoutSession,
  createPaymentIntent,
  createSavedCardPaymentIntent,
  createSetupCheckoutSession,
  createSetupIntent,
  getUserSavedPaymentMethods,
  isStripeConfigured,
  listRecentCustomerPaymentIntents,
  normalizePaymentBillingDetails,
  removeUserPaymentMethod,
  removeUserDefaultPaymentMethod,
  resolveCustomerCardVerificationMode,
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
import { processSubscriptionRenewals } from "../../services/billing-cycle-service.js";
import { generateInvoicePdf } from "../../services/invoice-service.js";
import { withTransaction } from "../../db/postgres-model.js";
import { sendInvoiceNotification, sendWalletTopupNotification } from "../../services/email-service.js";
import { requireApprovedContract } from "../../services/contract-service.js";
import { buildCountryConsistencyChecks, getPaymentNetworkSignal } from "../../services/payment-preflight-service.js";

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

function assertStripePaymentAmount({ expectedAmount, amountReceived, currency }) {
  const expectedMinorUnits = Math.round(Number(expectedAmount || 0) * 100);
  const receivedMinorUnits = Math.round(Number(amountReceived || 0));

  if (String(currency || "").toLowerCase() !== String(env.stripeCurrency || "").toLowerCase()) {
    throw new HttpError(400, "The Stripe payment currency does not match the configured billing currency.");
  }

  if (!expectedMinorUnits || expectedMinorUnits !== receivedMinorUnits) {
    throw new HttpError(400, "The completed Stripe payment amount does not match the expected amount.");
  }
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

async function finalizeStripeOrderPayment({ paymentIntentId, checkoutSessionId = "", chargeId = "", metadata, user, paymentMethodId, customerId, amountReceived, currency }) {
  const result = await withTransaction(async () => {
    assertGatewayResourceBelongsToUser({ metadata, user });
    await requireApprovedContract(user.clerkId);

    const { order, subscription, invoice } = await findOrderPaymentContext({
      orderId: metadata?.orderId,
      userId: user._id,
    });
    assertStripePaymentAmount({
      expectedAmount: order.totalAmount,
      amountReceived,
      currency,
    });

    const existingSubmission = await findExistingGatewaySubmission({
      paymentIntentId,
      checkoutSessionId,
      chargeId,
    });
    if (existingSubmission) {
      return { submission: existingSubmission, shouldNotify: false };
    }

    if (["cancelled", "rejected"].includes(order.status)) {
      throw new HttpError(400, "Cancelled or rejected orders cannot be paid.");
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

    const paymentReceivedAt = new Date();
    order.status = "pending_verification";
    order.metadata = {
      ...order.metadata,
      advancePayment: true,
      advancePaymentStatus: "pending_review",
      paymentReceivedAt: paymentReceivedAt.toISOString(),
      paymentMethodType: "stripe_card",
      cardVerificationMode: metadata?.cardVerificationMode || "three_d_secure",
    };
    await order.save();

    if (subscription) {
      subscription.status = "pending_verification";
      subscription.metadata = {
        ...subscription.metadata,
        billingAmount: order.totalAmount,
        advancePayment: true,
        advancePaymentStatus: "pending_review",
        paymentReceivedAt: paymentReceivedAt.toISOString(),
        cardVerificationMode: metadata?.cardVerificationMode || "three_d_secure",
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
      adminRemarks: "Advance payment received. The service request is pending legitimacy and provisioning review.",
      gateway: "stripe",
      gatewayPaymentId: paymentIntentId,
      gatewayCheckoutSessionId: checkoutSessionId,
      gatewayChargeId: chargeId,
      metadata: {
        cardVerificationMode: metadata?.cardVerificationMode || "three_d_secure",
        threeDSecurePolicy: metadata?.threeDSecurePolicy || "challenge",
      },
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
        cardVerificationMode: metadata?.cardVerificationMode || "three_d_secure",
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

async function finalizeStripeWalletTopup({ paymentIntentId, checkoutSessionId = "", chargeId = "", metadata, user, paymentMethodId, customerId, amountReceived, currency }) {
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
    assertStripePaymentAmount({
      expectedAmount: amount,
      amountReceived,
      currency,
    });

    const creditedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { accountBalance: amount } },
      { new: true },
    );
    user.accountBalance = creditedUser.accountBalance;
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
      metadata: {
        cardVerificationMode: metadata?.cardVerificationMode || "three_d_secure",
        threeDSecurePolicy: metadata?.threeDSecurePolicy || "challenge",
      },
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
        cardVerificationMode: metadata?.cardVerificationMode || "three_d_secure",
      },
    });

    return {
      submission,
      amount,
      reference: paymentIntentId || checkoutSessionId,
      customer: creditedUser,
      shouldNotify: true,
    };
  });

  if (result.shouldNotify) {
    await sendWalletTopupNotification({
      customer: result.customer || user,
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
      amountReceived: session.amount_total,
      currency: session.currency,
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
      amountReceived: session.amount_total,
      currency: session.currency,
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
      amountReceived: paymentIntent.amount_received,
      currency: paymentIntent.currency,
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
      amountReceived: paymentIntent.amount_received,
      currency: paymentIntent.currency,
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

async function reconcileRecentStripePayments({ user }) {
  if (!user.stripeCustomerId) {
    return { examined: 0, reconciled: 0, settledPaymentIntentIds: [], failures: [] };
  }

  const createdAfter = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
  const paymentIntents = await listRecentCustomerPaymentIntents({
    customerId: user.stripeCustomerId,
    createdAfter,
  });
  const candidates = paymentIntents.filter((paymentIntent) =>
    paymentIntent.status === "succeeded" &&
    String(paymentIntent.metadata?.userId || "") === String(user._id) &&
    ["wallet_topup", "order_payment"].includes(paymentIntent.metadata?.type),
  );
  const settledPaymentIntentIds = [];
  const failures = [];
  let reconciled = 0;

  for (const paymentIntent of candidates) {
    const existingSubmission = await findExistingGatewaySubmission({
      paymentIntentId: paymentIntent.id,
      chargeId: normalizeChargeId(paymentIntent.latest_charge),
    });

    try {
      await finalizePaymentIntent({ paymentIntent, user });
      settledPaymentIntentIds.push(paymentIntent.id);
      if (!existingSubmission) {
        reconciled += 1;
      }
    } catch (error) {
      failures.push({
        paymentIntentId: paymentIntent.id,
        message: error?.message || "Payment reconciliation failed.",
      });
    }
  }

  return {
    examined: candidates.length,
    reconciled,
    settledPaymentIntentIds,
    failures,
  };
}

stripeRouter.post(
  "/preflight",
  requireCustomer,
  rateLimit({
    name: "payment-preflight",
    windowMs: 5 * 60 * 1000,
    max: 30,
    keyFn: (req) => req.auth?.clerkId || req.ip,
  }),
  asyncHandler(async (req, res) => {
    const user = req.auth.user;
    const paymentType = String(req.body.type || "").trim();
    if (!["order_payment", "wallet_topup"].includes(paymentType)) {
      throw new HttpError(400, "Choose a supported payment type for the pre-charge check.");
    }

    const checks = [
      {
        id: "session",
        label: "Secure customer session",
        status: "passed",
        detail: "The payment request is attached to your authenticated customer account.",
      },
      {
        id: "account",
        label: "Account status",
        status: user.accountStatus === "active" ? "passed" : "failed",
        detail: user.accountStatus === "active"
          ? "The account is active and eligible to initiate a payment."
          : "The account is not currently eligible to initiate a payment.",
      },
      {
        id: "profile",
        label: "Customer profile",
        status: user.name && user.email ? "passed" : "failed",
        detail: user.name && user.email
          ? "The customer name and account email are present."
          : "Complete the customer name and account email before payment.",
      },
    ];

    try {
      await requireApprovedContract(req.auth.clerkId);
      checks.push({
        id: "agreement",
        label: "Managed Service Agreement",
        status: "passed",
        detail: "The signed agreement is approved for billing.",
      });
    } catch (error) {
      checks.push({
        id: "agreement",
        label: "Managed Service Agreement",
        status: "failed",
        detail: error.status && error.status < 500
          ? error.message
          : "The agreement could not be verified for billing.",
      });
    }

    let normalizedBillingDetails = null;
    try {
      normalizedBillingDetails = normalizePaymentBillingDetails(req.body.billingDetails);
      checks.push({
        id: "billing",
        label: "Billing identity",
        status: "passed",
        detail: "The cardholder contact and billing-address fields are complete.",
      });
    } catch (error) {
      checks.push({
        id: "billing",
        label: "Billing identity",
        status: "failed",
        detail: error.message || "Complete the cardholder billing details.",
      });
    }

    try {
      const verification = resolveCustomerCardVerificationMode(req.body.cardVerificationMode);
      checks.push({
        id: "verification-mode",
        label: "Card verification mode",
        status: "passed",
        detail: verification.cardVerificationMode === "three_d_secure"
          ? "This charge will request 3D Secure authentication whenever supported."
          : "Stripe will use standard processing and request authentication when required.",
      });
    } catch (error) {
      checks.push({
        id: "verification-mode",
        label: "Card verification mode",
        status: "failed",
        detail: error.message,
      });
    }

    if (paymentType === "order_payment") {
      try {
        const { order, invoice } = await findOrderPaymentContext({
          orderId: req.body.orderId,
          userId: user._id,
        });
        const payable =
          !["cancelled", "rejected", "approved"].includes(order.status) &&
          invoice?.status !== "paid" &&
          Number(order.totalAmount || 0) > 0;
        checks.push({
          id: "payable",
          label: "Order and invoice",
          status: payable ? "passed" : "failed",
          detail: payable
            ? `The order invoice is payable for ${Number(order.totalAmount).toFixed(2)} ${String(invoice?.currency || env.stripeCurrency).toUpperCase()}.`
            : "This order is not currently eligible for another card charge.",
        });
      } catch (error) {
        checks.push({
          id: "payable",
          label: "Order and invoice",
          status: "failed",
          detail: error.status && error.status < 500
            ? error.message
            : "The linked order and invoice could not be verified.",
        });
      }
    } else {
      const amount = Number(req.body.amount || 0);
      checks.push({
        id: "payable",
        label: "Wallet top-up amount",
        status: Number.isFinite(amount) && amount > 0 ? "passed" : "failed",
        detail: Number.isFinite(amount) && amount > 0
          ? `The ${amount.toFixed(2)} ${env.stripeCurrency.toUpperCase()} top-up amount is valid.`
          : "Enter a positive wallet top-up amount.",
      });
    }

    const paymentMethodId = String(req.body.paymentMethodId || "").trim();
    if (paymentMethodId) {
      const savedCard = getUserSavedPaymentMethods(user)
        .find((card) => String(card.id) === paymentMethodId);
      const expiryMonth = Number(savedCard?.expMonth || 0);
      const expiryYear = Number(savedCard?.expYear || 0);
      const now = new Date();
      const expiryKnown = expiryMonth >= 1 && expiryMonth <= 12 && expiryYear > 0;
      const cardExpired = expiryKnown && (
        expiryYear < now.getFullYear() ||
        (expiryYear === now.getFullYear() && expiryMonth < now.getMonth() + 1)
      );
      checks.push({
        id: "saved-card",
        label: "Saved card",
        status: !savedCard ? "failed" : cardExpired ? "failed" : expiryKnown ? "passed" : "warning",
        detail: !savedCard
          ? "The selected saved card could not be verified for this account."
          : cardExpired
            ? "The selected saved card appears to be expired. Choose another card."
            : expiryKnown
              ? `The selected card ending in ${savedCard.last4 || "••••"} belongs to this account and its stored expiry date is current.`
              : "The selected saved card belongs to this account, but its expiry date is unavailable for preflight.",
      });
    }

    const network = getPaymentNetworkSignal(req);
    checks.push({
      id: "network",
      label: "Network signal",
      status: network.detected ? "passed" : "info",
      detail: network.detected
        ? `A network address was detected (${network.maskedIp || "masked"}). The full address is not displayed.`
        : "A network address could not be displayed. This does not predict issuer approval.",
    });
    checks.push({
      id: "transport",
      label: "Secure transport",
      status: network.secureTransport ? "passed" : "warning",
      detail: network.secureTransport
        ? "The payment preflight arrived over a secure or trusted local transport."
        : "A secure transport signal was not detected. Refresh the HTTPS portal before paying.",
    });
    checks.push(...buildCountryConsistencyChecks({
      billingCountry: normalizedBillingDetails?.address?.country,
      accountCountry: user.billingAddress?.country,
      networkCountry: network.country,
    }));
    checks.push({
      id: "processor",
      label: "Payment processor",
      status: isStripeConfigured() ? "passed" : "failed",
      detail: isStripeConfigured()
        ? "Stripe is configured and ready to create the payment request."
        : "Card processing is not configured right now.",
    });
    checks.push({
      id: "issuer",
      label: "Issuer decision",
      status: "info",
      detail: "A bank approval or decline cannot be known until authorization. These checks only reduce preventable setup errors.",
    });

    const failedCount = checks.filter((check) => check.status === "failed").length;
    const warningCount = checks.filter((check) => check.status === "warning").length;

    res.json({
      checkedAt: new Date().toISOString(),
      canProceed: failedCount === 0,
      riskLevel: failedCount > 0 ? "blocked" : warningCount > 0 ? "caution" : "clear",
      headline: failedCount > 0
        ? "Resolve the failed checks before charging the card."
        : warningCount > 0
          ? "The payment can continue, but review the warnings first."
          : "All available pre-charge checks passed.",
      checks,
      network: {
        maskedIp: network.maskedIp,
        country: network.country,
      },
      disclaimer: "This readiness check cannot guarantee approval or predict an issuer decline.",
    });
  }),
);

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
        billingDetails: req.body.billingDetails,
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
      const verification = resolveCustomerCardVerificationMode(req.body.cardVerificationMode);

      const intent = await createPaymentIntent({
        user,
        amount,
        description: "ElevenOrbits wallet top-up",
        billingDetails: req.body.billingDetails,
        saveForFutureUse: false,
        requestThreeDSecure: verification.requestThreeDSecure,
        metadata: {
          type: "wallet_topup",
          userId: user._id,
          amount: amount.toFixed(2),
          cardVerificationMode: verification.cardVerificationMode,
          threeDSecurePolicy: verification.requestThreeDSecure,
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

      if (["cancelled", "rejected"].includes(order.status)) {
        throw new HttpError(400, "Cancelled or rejected orders cannot be paid.");
      }

      if (order.status === "approved" || invoice?.status === "paid") {
        throw new HttpError(400, "This order has already been paid.");
      }
      const verification = resolveCustomerCardVerificationMode(req.body.cardVerificationMode);

      const intent = await createPaymentIntent({
        user,
        amount: order.totalAmount,
        description: invoice?.invoiceNumber || order.productPlanId?.name || "Managed service payment",
        billingDetails: req.body.billingDetails,
        requestThreeDSecure: verification.requestThreeDSecure,
        metadata: {
          type: "order_payment",
          userId: user._id,
          orderId: order._id,
          subscriptionId: subscription?._id,
          cardVerificationMode: verification.cardVerificationMode,
          threeDSecurePolicy: verification.requestThreeDSecure,
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
      const verification = resolveCustomerCardVerificationMode(req.body.cardVerificationMode);

      const session = await createPaymentCheckoutSession({
        user,
        successUrl: successUrl("/portal/payments", "wallet_topup"),
        cancelUrl: cancelUrl("/portal/payments", "wallet_topup"),
        saveForFutureUse: false,
        requestThreeDSecure: verification.requestThreeDSecure,
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
          cardVerificationMode: verification.cardVerificationMode,
          threeDSecurePolicy: verification.requestThreeDSecure,
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

      if (["cancelled", "rejected"].includes(order.status)) {
        throw new HttpError(400, "Cancelled or rejected orders cannot be paid.");
      }

      if (order.status === "approved" || invoice?.status === "paid") {
        throw new HttpError(400, "This order has already been paid.");
      }
      const verification = resolveCustomerCardVerificationMode(req.body.cardVerificationMode);

      const session = await createPaymentCheckoutSession({
        user,
        successUrl: successUrl(`/portal/checkout/${order._id}`, "order_payment"),
        cancelUrl: cancelUrl(`/portal/checkout/${order._id}`, "order_payment"),
        requestThreeDSecure: verification.requestThreeDSecure,
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
          cardVerificationMode: verification.cardVerificationMode,
          threeDSecurePolicy: verification.requestThreeDSecure,
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

stripeRouter.post(
  "/reconcile",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.user._id);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    await requireApprovedContract(req.auth.clerkId);
    const result = await reconcileRecentStripePayments({ user });
    res.json({ success: true, ...result });
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
    const verification = resolveCustomerCardVerificationMode(req.body.cardVerificationMode);

    const paymentIntent = await createSavedCardPaymentIntent({
      user,
      paymentMethodId: req.params.id,
      amount,
      description: "ElevenOrbits wallet top-up from saved card",
      billingDetails: req.body.billingDetails,
      requestThreeDSecure: verification.requestThreeDSecure,
      metadata: {
        type: "wallet_topup",
        userId: user._id,
        amount: amount.toFixed(2),
        preserveSavedCard: "true",
        cardVerificationMode: verification.cardVerificationMode,
        threeDSecurePolicy: verification.requestThreeDSecure,
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
