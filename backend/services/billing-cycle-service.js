import { env } from "../config/env.js";
import { Invoice, PaymentSubmission, Subscription, User } from "../db/models/index.js";
import { generateInvoicePdf, nextInvoiceNumber } from "./invoice-service.js";
import { createOffSessionCharge, isStripeConfigured } from "./stripe-service.js";
import { sendInvoiceNotification, sendWalletAutoTopupNotification } from "./email-service.js";
import { requireApprovedContract } from "./contract-service.js";
import { recordActivity } from "./activity-log-service.js";
import { HttpError } from "../utils/http-error.js";

function addBillingPeriod(date, billingCycle) {
  const nextDate = new Date(date);

  if (billingCycle === "yearly") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    return nextDate;
  }

  if (billingCycle === "six_month") {
    nextDate.setMonth(nextDate.getMonth() + 6);
    return nextDate;
  }

  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
}

function buildRenewalBillingCode(date) {
  return `renewal_${date.toISOString().slice(0, 10)}`;
}

function normalizeStripeId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.id || "";
}

function daysInUtcMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function buildUtcMonthlyDate(year, monthIndex, dayOfMonth) {
  const clampedDay = Math.min(dayOfMonth, daysInUtcMonth(year, monthIndex));
  return new Date(Date.UTC(year, monthIndex, clampedDay, 0, 0, 0, 0));
}

function normalizeDate(value, fallback = new Date()) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export function normalizeWalletAutoTopupAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 1) {
    throw new HttpError(400, "Enter a monthly wallet top-up amount of at least $1.00.");
  }

  if (amount > 100000) {
    throw new HttpError(400, "Monthly wallet auto top-up cannot exceed $100,000.00.");
  }

  return Number(amount.toFixed(2));
}

export function normalizeWalletAutoTopupDayOfMonth(value) {
  const dayOfMonth = Math.trunc(Number(value));

  if (!Number.isFinite(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    throw new HttpError(400, "Choose a monthly wallet auto top-up date from 1 to 31.");
  }

  return dayOfMonth;
}

export function calculateNextWalletAutoTopupRun({ dayOfMonth, fromDate = new Date() } = {}) {
  const normalizedDay = normalizeWalletAutoTopupDayOfMonth(dayOfMonth);
  const baseDate = normalizeDate(fromDate);
  const currentMonthRun = buildUtcMonthlyDate(
    baseDate.getUTCFullYear(),
    baseDate.getUTCMonth(),
    normalizedDay,
  );

  if (currentMonthRun > baseDate) {
    return currentMonthRun;
  }

  return buildUtcMonthlyDate(
    baseDate.getUTCMonth() === 11 ? baseDate.getUTCFullYear() + 1 : baseDate.getUTCFullYear(),
    (baseDate.getUTCMonth() + 1) % 12,
    normalizedDay,
  );
}

function buildWalletAutoTopupCode(user, scheduledRunAt) {
  return `wallet_auto_topup_${String(user._id)}_${scheduledRunAt.toISOString().slice(0, 10)}`;
}

function describeWalletAutoTopupError(error) {
  const message = String(error?.message || "").trim();
  return message || "Stripe could not approve the saved-card charge.";
}

export function getWalletAutoTopupSettings(user) {
  return {
    enabled: Boolean(user?.walletAutoTopupEnabled),
    amount: Number(user?.walletAutoTopupAmount || 0),
    dayOfMonth: Number(user?.walletAutoTopupDayOfMonth || 1),
    nextRunAt: user?.walletAutoTopupNextRunAt ? new Date(user.walletAutoTopupNextRunAt).toISOString() : null,
    lastRunAt: user?.walletAutoTopupLastRunAt ? new Date(user.walletAutoTopupLastRunAt).toISOString() : null,
    lastStatus: user?.walletAutoTopupLastStatus || "",
    lastMessage: user?.walletAutoTopupLastMessage || "",
    lastPaymentIntentId: user?.walletAutoTopupLastPaymentIntentId || "",
  };
}

export async function updateWalletAutoTopupSettings({ user, enabled, amount, dayOfMonth }) {
  const shouldEnable = Boolean(enabled);

  if (!shouldEnable) {
    user.walletAutoTopupEnabled = false;
    user.walletAutoTopupNextRunAt = null;
    user.walletAutoTopupLastStatus = "disabled";
    user.walletAutoTopupLastMessage = "Monthly wallet auto top-up is disabled.";
    await user.save();
    return getWalletAutoTopupSettings(user);
  }

  if (!isStripeConfigured()) {
    throw new HttpError(503, "Stripe is not configured yet.");
  }

  if (!user.stripeCustomerId || !user.defaultPaymentMethodId) {
    throw new HttpError(400, "Save a primary card before enabling monthly wallet auto top-up.");
  }

  const normalizedAmount = normalizeWalletAutoTopupAmount(amount);
  const normalizedDay = normalizeWalletAutoTopupDayOfMonth(dayOfMonth);
  const nextRunAt = calculateNextWalletAutoTopupRun({ dayOfMonth: normalizedDay });

  user.walletAutoTopupEnabled = true;
  user.walletAutoTopupAmount = normalizedAmount;
  user.walletAutoTopupDayOfMonth = normalizedDay;
  user.walletAutoTopupNextRunAt = nextRunAt;
  user.walletAutoTopupLastStatus = user.walletAutoTopupLastStatus || "scheduled";
  user.walletAutoTopupLastMessage = `Monthly wallet auto top-up is scheduled for ${nextRunAt.toISOString().slice(0, 10)}.`;
  await user.save();

  return getWalletAutoTopupSettings(user);
}

const renewalSweepIntervalMs = 5 * 60 * 1000;
let renewalSweepTimer = null;
let renewalSweepInFlight = false;
const subscriptionRenewalLocks = new Set();
const walletAutoTopupLocks = new Set();

async function ensureRenewalInvoice({ subscription, user, amount, dueDate, planName, status, paymentMethodType = "wallet_balance" }) {
  const paymentReferenceCode = buildRenewalBillingCode(dueDate);
  const existingInvoice = await Invoice.findOne({
    subscriptionId: subscription._id,
    paymentReferenceCode,
  });
  const wasCreated = !existingInvoice;
  const previousStatus = existingInvoice?.status || "";

  const baseInvoice = {
    userId: user._id,
    subscriptionId: subscription._id,
    orderId: subscription.orderId,
    amount,
    currency: env.stripeCurrency.toUpperCase(),
    billingCycle: subscription.billingCycle,
    status,
    paymentMethodType,
    paymentReferenceCode,
    lineItems: [
      {
        label: `${planName} renewal`,
        amount,
      },
    ],
  };

  const invoice = existingInvoice
    ? Object.assign(existingInvoice, {
        ...baseInvoice,
        paidAt: status === "paid" ? new Date() : undefined,
      })
    : await Invoice.create({
        ...baseInvoice,
        invoiceNumber: await nextInvoiceNumber(Invoice),
        issuedAt: dueDate,
        paidAt: status === "paid" ? new Date() : undefined,
      });

  const pdfData = await generateInvoicePdf({
    invoice,
    customer: user,
    planName,
    supportEmail: env.supportEmail,
  });

  invoice.pdfPath = pdfData.pdfPath;
  invoice.pdfUrl = pdfData.pdfUrl;
  invoice.pdfStorageKey = pdfData.pdfStorageKey;
  invoice.pdfStorageProvider = pdfData.pdfStorageProvider;
  await invoice.save();

  if (wasCreated || previousStatus !== status) {
    await sendInvoiceNotification({
      customer: user,
      invoice,
      planName,
      eventType: status === "paid" ? "renewal_paid" : "renewal_pending",
    });
  }

  return invoice;
}

async function recordWalletAutoTopupFailure({ user, amount, scheduledRunAt, nextRunAt, invoiceCode, error }) {
  const message = describeWalletAutoTopupError(error);
  const paymentIntentId = normalizeStripeId(error?.payment_intent || error?.raw?.payment_intent || error?.paymentIntent);
  const existingSubmission = await PaymentSubmission.findOne({
    userId: user._id,
    submissionType: "wallet_auto_topup",
    invoiceCode,
  });

  const submission = existingSubmission || await PaymentSubmission.create({
    userId: user._id,
    submissionType: "wallet_auto_topup",
    invoiceCode,
  });
  submission.amount = amount;
  submission.paymentMethodType = "stripe_card";
  submission.status = "failed";
  submission.adminRemarks = `Monthly wallet auto top-up failed: ${message}`;
  submission.gateway = "stripe";
  submission.gatewayPaymentId = paymentIntentId;
  submission.metadata = {
    scheduledRunAt: scheduledRunAt.toISOString(),
    nextRunAt: nextRunAt.toISOString(),
    failureMessage: message,
  };
  submission.submittedAt = submission.submittedAt || new Date();
  submission.reviewedAt = new Date();
  await submission.save();

  user.walletAutoTopupNextRunAt = nextRunAt;
  user.walletAutoTopupLastRunAt = new Date();
  user.walletAutoTopupLastStatus = "failed";
  user.walletAutoTopupLastMessage = message;
  user.walletAutoTopupLastPaymentIntentId = paymentIntentId;
  await user.save();

  await recordActivity({
    actorId: user._id,
    actorRole: "system",
    action: "wallet.auto_topup_failed",
    targetType: "user",
    targetId: String(user._id),
    metadata: {
      amount,
      invoiceCode,
      scheduledRunAt: scheduledRunAt.toISOString(),
      nextRunAt: nextRunAt.toISOString(),
      paymentIntentId,
      failureMessage: message,
    },
  });

  await sendWalletAutoTopupNotification({
    customer: user,
    amount,
    reference: paymentIntentId || invoiceCode,
    scheduledFor: scheduledRunAt,
    nextRunAt,
    status: "failed",
    errorMessage: message,
  });
}

async function processWalletAutoTopupForUser(user) {
  const lockKey = String(user._id);
  if (walletAutoTopupLocks.has(lockKey)) {
    return "skipped";
  }

  walletAutoTopupLocks.add(lockKey);

  try {
    const amount = normalizeWalletAutoTopupAmount(user.walletAutoTopupAmount);
    const dayOfMonth = normalizeWalletAutoTopupDayOfMonth(user.walletAutoTopupDayOfMonth || 1);
    const scheduledRunAt = normalizeDate(user.walletAutoTopupNextRunAt, new Date());
    const nextRunAt = calculateNextWalletAutoTopupRun({ dayOfMonth });
    const invoiceCode = buildWalletAutoTopupCode(user, scheduledRunAt);
    const existingSubmission = await PaymentSubmission.findOne({
      userId: user._id,
      submissionType: "wallet_auto_topup",
      invoiceCode,
    });

    if (existingSubmission?.status === "approved") {
      user.walletAutoTopupNextRunAt = nextRunAt;
      await user.save();
      return "skipped";
    }

    let paymentIntent;
    try {
      await requireApprovedContract(user.clerkId);

      if (!isStripeConfigured()) {
        throw new HttpError(503, "Stripe is not configured yet.");
      }

      if (!user.stripeCustomerId || !user.defaultPaymentMethodId) {
        throw new HttpError(400, "No primary saved card is available for monthly wallet auto top-up.");
      }

      paymentIntent = await createOffSessionCharge({
        user,
        amount,
        description: "ElevenOrbits monthly wallet auto top-up",
        requireAutoCardBillingEnabled: false,
        metadata: {
          type: "wallet_auto_topup",
          userId: String(user._id),
          amount: amount.toFixed(2),
          scheduledRunAt: scheduledRunAt.toISOString(),
          dayOfMonth,
        },
      });

      if (paymentIntent.status !== "succeeded") {
        throw new HttpError(402, `Stripe returned ${paymentIntent.status || "an incomplete status"} for this automatic wallet top-up.`);
      }
    } catch (error) {
      await recordWalletAutoTopupFailure({
        user,
        amount,
        scheduledRunAt,
        nextRunAt,
        invoiceCode,
        error,
      });
      return "failed";
    }

    const creditedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { accountBalance: amount } },
      { new: true },
    );

    user.accountBalance = creditedUser.accountBalance;
    user.walletAutoTopupNextRunAt = nextRunAt;
    user.walletAutoTopupLastRunAt = new Date();
    user.walletAutoTopupLastStatus = "approved";
    user.walletAutoTopupLastMessage = "Monthly wallet auto top-up completed successfully.";
    user.walletAutoTopupLastPaymentIntentId = paymentIntent.id;
    await user.save();

    const submission = existingSubmission || await PaymentSubmission.create({
      userId: user._id,
      submissionType: "wallet_auto_topup",
      invoiceCode,
    });
    submission.amount = amount;
    submission.paymentMethodType = "stripe_card";
    submission.status = "approved";
    submission.adminRemarks = "Monthly wallet auto top-up completed successfully.";
    submission.gateway = "stripe";
    submission.gatewayPaymentId = paymentIntent.id;
    submission.gatewayChargeId = normalizeStripeId(paymentIntent.latest_charge);
    submission.metadata = {
      scheduledRunAt: scheduledRunAt.toISOString(),
      nextRunAt: nextRunAt.toISOString(),
      dayOfMonth,
    };
    submission.submittedAt = submission.submittedAt || new Date();
    submission.reviewedAt = new Date();
    await submission.save();

    try {
      await recordActivity({
        actorId: user._id,
        actorRole: "system",
        action: "wallet.auto_topup_completed_via_stripe",
        targetType: "payment_submission",
        targetId: String(submission._id),
        metadata: {
          amount,
          invoiceCode,
          scheduledRunAt: scheduledRunAt.toISOString(),
          nextRunAt: nextRunAt.toISOString(),
          paymentIntentId: paymentIntent.id,
        },
      });
    } catch (error) {
      console.error("Monthly wallet auto top-up activity logging failed", error);
    }

    await sendWalletAutoTopupNotification({
      customer: creditedUser || user,
      amount,
      reference: paymentIntent.id,
      scheduledFor: scheduledRunAt,
      nextRunAt,
      status: "approved",
    });

    return "succeeded";
  } finally {
    walletAutoTopupLocks.delete(lockKey);
  }
}

export async function processWalletAutoTopups({ userIds, limit = 100 } = {}) {
  const filter = {
    walletAutoTopupEnabled: true,
    walletAutoTopupNextRunAt: { $lte: new Date() },
  };

  if (userIds?.length) {
    filter._id = { $in: userIds };
  }

  let query = User.find(filter).sort({ walletAutoTopupNextRunAt: 1 });
  if (limit > 0) {
    query = query.limit(limit);
  }

  const users = await query;
  const summary = {
    processed: users.length,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  };

  for (const user of users) {
    const result = await processWalletAutoTopupForUser(user);
    if (result === "succeeded") {
      summary.succeeded += 1;
    } else if (result === "failed") {
      summary.failed += 1;
    } else {
      summary.skipped += 1;
    }
  }

  return summary;
}

export async function processSubscriptionRenewals({ userIds } = {}) {
  await processWalletAutoTopups({ userIds });

  const filter = {
    renewalDate: { $lte: new Date() },
    status: { $in: ["active", "suspended"] },
  };

  if (userIds?.length) {
    filter.userId = { $in: userIds };
  }

  const subscriptions = await Subscription.find(filter).populate("productPlanId");

  for (const subscription of subscriptions) {
    const lockKey = String(subscription._id);
    if (subscriptionRenewalLocks.has(lockKey)) {
      continue;
    }

    subscriptionRenewalLocks.add(lockKey);

    try {
      const user = await User.findById(subscription.userId);
      const dueDate = subscription.renewalDate;
      const amount = Number(subscription.metadata?.billingAmount || 0);

      if (!user || !dueDate || amount <= 0) {
        continue;
      }

      const planName = subscription.productPlanId?.name || "Managed Service";
      try {
        await requireApprovedContract(user.clerkId);
      } catch (error) {
        if (error?.details?.code !== "CONTRACT_APPROVAL_REQUIRED") {
          throw error;
        }

        await ensureRenewalInvoice({
          subscription,
          user,
          amount,
          dueDate,
          planName,
          status: "pending",
          paymentMethodType: "pending_contract_approval",
        });

        subscription.status = "suspended";
        subscription.metadata = {
          ...subscription.metadata,
          billingNote: "Current Managed Service Agreement approval is required before renewal billing can continue.",
          contractStatus: error.details.contractStatus || "NOT_STARTED",
        };
        await subscription.save();
        continue;
      }

      const walletBalance = Number(user.accountBalance || 0);
      const walletAmount = Math.min(walletBalance, amount);
      const remainingAmount = Number((amount - walletAmount).toFixed(2));
      const hasFullWalletBalance = walletBalance >= amount;
      const canUseSavedCard =
        user.autoCardBillingEnabled !== false &&
        Boolean(user.stripeCustomerId) &&
        Boolean(user.defaultPaymentMethodId) &&
        isStripeConfigured();

      if (hasFullWalletBalance) {
        user.accountBalance = walletBalance - amount;
        await user.save();

        await ensureRenewalInvoice({
          subscription,
          user,
          amount,
          dueDate,
          planName,
          status: "paid",
          paymentMethodType: "wallet_balance",
        });

        subscription.status = "active";
        subscription.renewalDate = addBillingPeriod(dueDate, subscription.billingCycle);
        subscription.metadata = {
          ...subscription.metadata,
          lastAutoChargeAt: new Date(),
          lastAutoChargeAmount: amount,
          lastAutoChargeSource: "wallet_balance",
        };
        await subscription.save();
        continue;
      }

      if (remainingAmount > 0 && canUseSavedCard) {
        try {
          const paymentIntent = await createOffSessionCharge({
            user,
            amount: remainingAmount,
            description: `${planName} renewal`,
            metadata: {
              type: "renewal_charge",
              subscriptionId: String(subscription._id),
              userId: String(user._id),
              orderId: subscription.orderId ? String(subscription.orderId) : "",
              billingCycle: subscription.billingCycle,
            },
          });

          user.accountBalance = walletBalance - walletAmount;
          await user.save();

          await ensureRenewalInvoice({
            subscription,
            user,
            amount,
            dueDate,
            planName,
            status: "paid",
            paymentMethodType: walletAmount > 0 ? "wallet_balance + stripe_card" : "stripe_card",
          });

          const existingSubmission = await PaymentSubmission.findOne({ gatewayPaymentId: paymentIntent.id });
          if (!existingSubmission) {
            await PaymentSubmission.create({
              userId: user._id,
              orderId: subscription.orderId,
              subscriptionId: subscription._id,
              submissionType: "renewal_charge",
              amount,
              invoiceCode: buildRenewalBillingCode(dueDate),
              paymentMethodType: walletAmount > 0 ? "wallet_balance + stripe_card" : "stripe_card",
              status: "approved",
              adminRemarks:
                walletAmount > 0
                  ? `Automatic renewal collected using $${walletAmount.toFixed(2)} from wallet and $${remainingAmount.toFixed(2)} from saved card.`
                  : "Automatic renewal collected using the saved Stripe card.",
              gateway: "stripe",
              gatewayPaymentId: paymentIntent.id,
              gatewayChargeId: normalizeStripeId(paymentIntent.latest_charge),
              submittedAt: new Date(),
              reviewedAt: new Date(),
            });
          }

          subscription.status = "active";
          subscription.renewalDate = addBillingPeriod(dueDate, subscription.billingCycle);
          subscription.metadata = {
            ...subscription.metadata,
            lastAutoChargeAt: new Date(),
            lastAutoChargeAmount: amount,
            lastAutoChargeSource: walletAmount > 0 ? "wallet_balance + stripe_card" : "stripe_card",
            lastStripePaymentIntentId: paymentIntent.id,
            lastWalletChargeAmount: walletAmount,
          };
          await subscription.save();
          continue;
        } catch (error) {
          await ensureRenewalInvoice({
            subscription,
            user,
            amount,
            dueDate,
            planName,
            status: "pending",
            paymentMethodType: walletAmount > 0 ? "wallet_balance + stripe_card" : "stripe_card",
          });

          subscription.status = "suspended";
          subscription.metadata = {
            ...subscription.metadata,
            lastFailedAutoChargeAt: new Date(),
            lastFailedAutoChargeAmount: amount,
            billingNote:
              walletAmount > 0
                ? "Wallet balance is available, but the saved Stripe card charge failed."
                : "Saved Stripe card charge failed after the wallet balance check.",
            lastStripeChargeError: error.message,
          };
          await subscription.save();
          continue;
        }
      }

      await ensureRenewalInvoice({
        subscription,
        user,
        amount,
        dueDate,
        planName,
        status: "pending",
        paymentMethodType: walletAmount > 0 ? "wallet_balance + pending_card_payment" : "pending_confirmation",
      });

      subscription.status = "suspended";
      subscription.metadata = {
        ...subscription.metadata,
        lastFailedAutoChargeAt: new Date(),
        lastFailedAutoChargeAmount: amount,
        billingNote:
          walletAmount > 0
            ? "Wallet balance is partially available, but no saved Stripe card is on file for the remaining renewal amount."
            : "Insufficient wallet balance and no saved Stripe card on file for automatic renewal.",
      };
      await subscription.save();
    } finally {
      subscriptionRenewalLocks.delete(lockKey);
    }
  }
}

async function runRenewalSweep() {
  if (renewalSweepInFlight) {
    return;
  }

  renewalSweepInFlight = true;

  try {
    await processSubscriptionRenewals();
  } catch (error) {
    console.error("Automatic renewal sweep failed", error);
  } finally {
    renewalSweepInFlight = false;
  }
}

export function startBillingCycleScheduler(intervalMs = renewalSweepIntervalMs) {
  if (renewalSweepTimer) {
    return renewalSweepTimer;
  }

  void runRenewalSweep();
  renewalSweepTimer = setInterval(() => {
    void runRenewalSweep();
  }, intervalMs);

  if (typeof renewalSweepTimer.unref === "function") {
    renewalSweepTimer.unref();
  }

  return renewalSweepTimer;
}

export { addBillingPeriod };
