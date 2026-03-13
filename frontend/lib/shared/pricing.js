export function calculatePlanPrice(plan, billingCycle) {
  if (!plan) {
    return 0;
  }

  if (billingCycle === "yearly") {
    if (plan.yearlyPrice > 0) {
      return plan.yearlyPrice;
    }

    return Number((plan.monthlyPrice * 12 * (1 - plan.yearlyDiscountPercent / 100)).toFixed(2));
  }

  return plan.monthlyPrice;
}

export function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
