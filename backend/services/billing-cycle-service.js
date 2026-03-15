import { env } from "../config/env.js";
import { Invoice, PaymentSubmission, Subscription, User } from "../db/models/index.js";
import { generateInvoicePdf, nextInvoiceNumber } from "./invoice-service.js";
import { createOffSessionCharge, isStripeConfigured } from "./stripe-service.js";

function addBillingPeriod(date, billingCycle) {
  const nextDate = new Date(date);

  if (billingCycle === "yearly") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    return nextDate;
  }

  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
}

function buildRenewalBillingCode(date) {
  return `renewal_${date.toISOString().slice(0, 10)}`;
}

const renewalSweepIntervalMs = 5 * 60 * 1000;
let renewalSweepTimer = null;
let renewalSweepInFlight = false;
const subscriptionRenewalLocks = new Set();

async function ensureRenewalInvoice({ subscription, user, amount, dueDate, planName, status, paymentMethodType = "wallet_balance" }) {
  const paymentReferenceCode = buildRenewalBillingCode(dueDate);
  const existingInvoice = await Invoice.findOne({
    subscriptionId: subscription._id,
    paymentReferenceCode,
  });

  const baseInvoice = {
    userId: user._id,
    subscriptionId: subscription._id,
    orderId: subscription.orderId,
    amount,
    currency: "USD",
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
  await invoice.save();

  return invoice;
}

export async function processSubscriptionRenewals({ userIds } = {}) {
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
      const walletBalance = Number(user.accountBalance || 0);
      const walletAmount = Math.min(walletBalance, amount);
      const remainingAmount = Number((amount - walletAmount).toFixed(2));
      const hasFullWalletBalance = walletBalance >= amount;

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

      if (remainingAmount > 0 && user.stripeCustomerId && user.defaultPaymentMethodId && isStripeConfigured()) {
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
        paymentMethodType: walletAmount > 0 ? "wallet_balance + manual_followup" : "pending_confirmation",
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
