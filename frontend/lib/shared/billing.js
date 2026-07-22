// Shared billing helpers for the customer portal.

const INACTIVE_STATUSES = ["cancelled", "expired", "rejected"];

export function isActiveSubscription(subscription) {
  return !INACTIVE_STATUSES.includes(subscription?.status);
}

/**
 * Monthly-equivalent recurring amount across active subscriptions:
 * monthly plans always count; yearly (and other) plans count only in the
 * month they renew, so the figure reflects what's billed this calendar month.
 */
export function getMonthlyRecurringAmount(subscriptions = []) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return subscriptions.filter(isActiveSubscription).reduce((sum, subscription) => {
    const amount = Number(subscription.metadata?.billingAmount || 0);
    if (amount <= 0) {
      return sum;
    }

    if (subscription.billingCycle === "monthly") {
      return sum + amount;
    }

    if (!subscription.renewalDate) {
      return sum;
    }

    const renewalDate = new Date(subscription.renewalDate);
    return renewalDate.getMonth() === currentMonth && renewalDate.getFullYear() === currentYear ? sum + amount : sum;
  }, 0);
}
