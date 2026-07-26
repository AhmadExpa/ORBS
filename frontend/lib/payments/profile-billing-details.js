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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(billingDetails.email)) {
    issues.push("email address");
  }
  if (!/^\+[1-9]\d{7,14}$/u.test(String(billingDetails.phone || "").trim())) {
    issues.push("phone number (in international format, e.g. +14155552671)");
  }
  if (!billingDetails.line1.trim()) {
    issues.push("billing street address");
  }
  if (!billingDetails.city.trim()) {
    issues.push("billing city");
  }
  if (!billingDetails.postalCode.trim()) {
    issues.push("billing postal code");
  }
  if (!/^[A-Z]{2}$/u.test(String(billingDetails.country || "").trim().toUpperCase())) {
    issues.push("billing country");
  }

  return issues;
}

export function isProfileBillingDetailsReady(user) {
  return getProfileBillingDetailsIssues(user).length === 0;
}

export function getNormalizedProfileBillingDetails(user) {
  return normalizePaymentBillingDetails(buildBillingDetailsFromProfile(user));
}
