import { env } from "../config/env.js";
import { Invoice, Subscription, User } from "../db/models/index.js";
import { generateInvoicePdf, nextInvoiceNumber } from "./invoice-service.js";

function addBillingPeriod(date, billingCycle) {
  const nextDate = new Date(date);

  if (billingCycle === "yearly") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    return nextDate;
  }

  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
}

function buildWalletBillingCode(date) {
  return `wallet_balance_${date.toISOString().slice(0, 10)}`;
}

const renewalSweepIntervalMs = 5 * 60 * 1000;
let renewalSweepTimer = null;
let renewalSweepInFlight = false;
const subscriptionRenewalLocks = new Set();

async function ensureRenewalInvoice({ subscription, user, amount, dueDate, planName, status }) {
  const paymentReferenceCode = buildWalletBillingCode(dueDate);
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
    paymentMethodType: "wallet_balance",
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
      const hasBalance = Number(user.accountBalance || 0) >= amount;

      if (hasBalance) {
        user.accountBalance = Number(user.accountBalance || 0) - amount;
        await user.save();

        await ensureRenewalInvoice({
          subscription,
          user,
          amount,
          dueDate,
          planName,
          status: "paid",
        });

        subscription.status = "active";
        subscription.renewalDate = addBillingPeriod(dueDate, subscription.billingCycle);
        subscription.metadata = {
          ...subscription.metadata,
          lastAutoChargeAt: new Date(),
          lastAutoChargeAmount: amount,
        };
        await subscription.save();
        continue;
      }

      await ensureRenewalInvoice({
        subscription,
        user,
        amount,
        dueDate,
        planName,
        status: "pending",
      });

      subscription.status = "suspended";
      subscription.metadata = {
        ...subscription.metadata,
        lastFailedAutoChargeAt: new Date(),
        lastFailedAutoChargeAmount: amount,
        billingNote: "Insufficient wallet balance for automatic renewal.",
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
