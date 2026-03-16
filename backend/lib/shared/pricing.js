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

export function getAddonPrice(addon, billingCycle) {
  if (!addon) {
    return 0;
  }

  const monthlyPrice = Number(addon.monthlyPrice || 0);
  const yearlyPrice = Number(addon.yearlyPrice || 0);

  if (billingCycle === "yearly") {
    return yearlyPrice > 0 ? yearlyPrice : Number((monthlyPrice * 12).toFixed(2));
  }

  return monthlyPrice;
}

export function getAddonUnitPrice(addon, billingCycle) {
  if (!addon) {
    return 0;
  }

  const monthlyPrice = Number(addon.pricePerUnitMonthly || 0);
  const yearlyPrice = Number(addon.pricePerUnitYearly || 0);

  if (billingCycle === "yearly") {
    return yearlyPrice > 0 ? yearlyPrice : Number((monthlyPrice * 12).toFixed(4));
  }

  return monthlyPrice;
}

export function getStorageMinimumQuantity(addon) {
  return Math.max(Number(addon?.includedQuantity || 0), Number(addon?.minQuantity || 0), 0);
}

export function calculateStoragePrice(addon, billingCycle, quantity) {
  if (!addon) {
    return 0;
  }

  const fixedPrice = getAddonPrice(addon, billingCycle);
  const minimumIncluded = Number(addon.includedQuantity || 0);
  const normalizedQuantity = Math.max(Number(quantity || 0), 0);
  const billableQuantity = Math.max(0, normalizedQuantity - minimumIncluded);

  return Number((fixedPrice + billableQuantity * getAddonUnitPrice(addon, billingCycle)).toFixed(2));
}

export function formatCurrency(amount, currency = "USD", options = {}) {
  const numericAmount = Number(amount || 0);
  const hasDecimals = Math.abs(numericAmount % 1) > 0.0001;
  const maximumFractionDigits = options.maximumFractionDigits ?? (hasDecimals ? 2 : 0);
  const minimumFractionDigits = options.minimumFractionDigits ?? (hasDecimals ? Math.min(2, maximumFractionDigits) : 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(numericAmount);
}
