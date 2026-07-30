import { createEmptyPaymentBillingDetails, normalizePaymentBillingDetails } from "./billing-details.js";

export function buildBillingDetailsFromProfile(user) {
  const billingAddress = user?.billingAddress || {};

  return {
    ...createEmptyPaymentBillingDetails(),
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    line1: billingAddress.line1 || "",
    line2: billingAddress.line2 || "",
    city: billingAddress.city || "",
    state: billingAddress.state || "",
    postalCode: billingAddress.postalCode || "",
    country: billingAddress.country || "",
  };
}

export function getProfileBillingDetailsIssues(user) {
  const billingDetails = buildBillingDetailsFromProfile(user);
  const issues = [];

  if (!billingDetails.name.trim() || billingDetails.name.trim().length < 2) {
    issues.push("full name");
  }
  if (!billingDetails.postalCode.trim()) {
    issues.push("postcode");
  }

  return issues;
}

export function isProfileBillingDetailsReady(user) {
  return getProfileBillingDetailsIssues(user).length === 0;
}

export function getNormalizedProfileBillingDetails(user) {
  return normalizePaymentBillingDetails(buildBillingDetailsFromProfile(user));
}
