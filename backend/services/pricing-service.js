import { calculatePlanPrice } from "../lib/shared/index.js";

export function buildOrderLineItems(plan, addons, billingCycle) {
  const baseAmount = calculatePlanPrice(plan, billingCycle);
  const addonItems = addons.map((addon) => ({
    label: addon.name,
    amount: billingCycle === "yearly" ? addon.yearlyPrice : addon.monthlyPrice,
    type: "addon",
  }));

  return [
    {
      label: plan.name,
      amount: baseAmount,
      type: "plan",
    },
    ...addonItems,
  ];
}

export function calculateOrderTotal(lineItems) {
  return Number(lineItems.reduce((total, item) => total + Number(item.amount || 0), 0).toFixed(2));
}
