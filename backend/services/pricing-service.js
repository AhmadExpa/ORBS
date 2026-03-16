import { calculatePlanPrice, calculateStoragePrice, getAddonPrice } from "../lib/shared/index.js";

export function buildOrderLineItems(plan, addons, billingCycle, configuration = {}) {
  const baseAmount = calculatePlanPrice(plan, billingCycle);
  const fixedAddonItems = addons.map((addon) => ({
    label: addon.name,
    amount: getAddonPrice(addon, billingCycle),
    type: "addon",
  }));
  const configurationItems = [];

  if (configuration.regionAddon) {
    configurationItems.push({
      label: `Region: ${configuration.regionAddon.name}`,
      amount: getAddonPrice(configuration.regionAddon, billingCycle),
      type: "region",
    });
  }

  if (configuration.imageAddon) {
    configurationItems.push({
      label: `Image: ${configuration.imageAddon.name}`,
      amount: getAddonPrice(configuration.imageAddon, billingCycle),
      type: "image",
    });
  }

  if (configuration.storageAddon && configuration.storageQuantity) {
    const storageAmount = calculateStoragePrice(configuration.storageAddon, billingCycle, configuration.storageQuantity);
    configurationItems.push({
      label: `Storage: ${configuration.storageQuantity} ${configuration.storageAddon.unitLabel || "GB"} ${configuration.storageAddon.name}`,
      amount: storageAmount,
      type: "storage",
    });
  }

  return [
    {
      label: plan.name,
      amount: baseAmount,
      type: "plan",
    },
    ...configurationItems,
    ...fixedAddonItems,
  ];
}

export function calculateOrderTotal(lineItems) {
  return Number(lineItems.reduce((total, item) => total + Number(item.amount || 0), 0).toFixed(2));
}
