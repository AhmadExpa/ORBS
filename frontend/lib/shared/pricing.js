export const billingCycleOrder = ["monthly", "six_month", "yearly", "contact_sales"];

export const billingCycleLabels = {
  monthly: "Monthly Contract",
  six_month: "6 Month Contract",
  yearly: "Yearly Contract",
  contact_sales: "Contact Sales",
};

const defaultTermDiscounts = {
  six_month: 5,
  yearly: 10,
};

function roundMoney(value, decimals = 2) {
  return Number(Number(value || 0).toFixed(decimals));
}

export function getBillingCycleLabel(billingCycle) {
  return billingCycleLabels[billingCycle] || String(billingCycle || "monthly").replace(/_/g, " ");
}

export function getBillingCycleMonths(billingCycle) {
  if (billingCycle === "yearly") {
    return 12;
  }

  if (billingCycle === "six_month") {
    return 6;
  }

  return 1;
}

export function getBillingCycleDiscountPercent(plan, billingCycle) {
  if (billingCycle === "yearly") {
    return Math.max(Number(plan?.yearlyDiscountPercent || 0), defaultTermDiscounts.yearly);
  }

  if (billingCycle === "six_month") {
    const yearlyDiscount = Number(plan?.yearlyDiscountPercent || 0);
    return yearlyDiscount > 0 ? roundMoney(yearlyDiscount / 2, 1) : defaultTermDiscounts.six_month;
  }

  return 0;
}

function getTermAmount(monthlyPrice, billingCycle, discountPercent = 0, decimals = 2) {
  const months = getBillingCycleMonths(billingCycle);
  const amount = Number(monthlyPrice || 0) * months * (1 - Number(discountPercent || 0) / 100);
  return roundMoney(amount, decimals);
}

export function getAvailableBillingCycles(plan) {
  if (!plan) {
    return [];
  }

  const configuredCycles = new Set(Array.isArray(plan.billingCycles) ? plan.billingCycles : ["monthly"]);

  if (plan.contactSalesOnly || configuredCycles.has("contact_sales")) {
    return ["contact_sales"];
  }

  if (configuredCycles.has("monthly")) {
    configuredCycles.add("six_month");
    configuredCycles.add("yearly");
  }

  return billingCycleOrder.filter((cycle) => configuredCycles.has(cycle));
}

export function calculatePlanPrice(plan, billingCycle) {
  if (!plan) {
    return 0;
  }

  if (billingCycle === "six_month") {
    return getTermAmount(plan.monthlyPrice, billingCycle, getBillingCycleDiscountPercent(plan, billingCycle));
  }

  if (billingCycle === "yearly") {
    const discountedAmount = getTermAmount(plan.monthlyPrice, billingCycle, getBillingCycleDiscountPercent(plan, billingCycle));
    return plan.yearlyPrice > 0 ? Math.min(Number(plan.yearlyPrice), discountedAmount) : discountedAmount;
  }

  return Number(plan.monthlyPrice || 0);
}

export function getAddonPrice(addon, billingCycle) {
  if (!addon) {
    return 0;
  }

  const monthlyPrice = Number(addon.monthlyPrice || 0);
  const yearlyPrice = Number(addon.yearlyPrice || 0);

  if (billingCycle === "six_month") {
    return getTermAmount(monthlyPrice, billingCycle, defaultTermDiscounts.six_month);
  }

  if (billingCycle === "yearly") {
    const discountedAmount = getTermAmount(monthlyPrice, billingCycle, defaultTermDiscounts.yearly);
    return yearlyPrice > 0 ? Math.min(yearlyPrice, discountedAmount) : discountedAmount;
  }

  return monthlyPrice;
}

export function getAddonUnitPrice(addon, billingCycle) {
  if (!addon) {
    return 0;
  }

  const monthlyPrice = Number(addon.pricePerUnitMonthly || 0);
  const yearlyPrice = Number(addon.pricePerUnitYearly || 0);

  if (billingCycle === "six_month") {
    return getTermAmount(monthlyPrice, billingCycle, defaultTermDiscounts.six_month, 4);
  }

  if (billingCycle === "yearly") {
    const discountedAmount = getTermAmount(monthlyPrice, billingCycle, defaultTermDiscounts.yearly, 4);
    return yearlyPrice > 0 ? Math.min(yearlyPrice, discountedAmount) : discountedAmount;
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
