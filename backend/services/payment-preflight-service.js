import { env } from "../config/env.js";

function firstHeaderValue(value) {
  return String(value || "").split(",")[0]?.trim();
}

export function normalizePaymentCountry(value) {
  const country = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/u.test(country) && !["XX", "T1"].includes(country) ? country : "";
}

export function maskPaymentIp(value) {
  const ip = String(value || "").trim().replace(/^::ffff:/u, "");
  if (!ip) {
    return "";
  }

  if (ip.includes(".")) {
    const parts = ip.split(".");
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.x.x` : "Detected";
  }

  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    return parts.length ? `${parts.slice(0, 2).join(":")}::/masked` : "Detected";
  }

  return "Detected";
}

export function getPaymentNetworkSignal(req) {
  const ipAddress =
    firstHeaderValue(req.headers["cf-connecting-ip"]) ||
    firstHeaderValue(req.headers["true-client-ip"]) ||
    firstHeaderValue(req.headers["x-real-ip"]) ||
    firstHeaderValue(req.headers["x-forwarded-for"]) ||
    String(req.ip || "").trim();
  const country =
    normalizePaymentCountry(req.headers["cf-ipcountry"]) ||
    normalizePaymentCountry(req.headers["x-vercel-ip-country"]);
  const forwardedProtocol = firstHeaderValue(req.headers["x-forwarded-proto"]).toLowerCase();
  const secureTransport =
    forwardedProtocol === "https" ||
    req.protocol === "https" ||
    env.nodeEnv !== "production";

  return {
    detected: Boolean(ipAddress),
    maskedIp: maskPaymentIp(ipAddress),
    country,
    secureTransport,
  };
}

export function buildCountryConsistencyChecks({ billingCountry, accountCountry, networkCountry }) {
  const normalizedBillingCountry = normalizePaymentCountry(billingCountry);
  const normalizedAccountCountry = normalizePaymentCountry(accountCountry);
  const normalizedNetworkCountry = normalizePaymentCountry(networkCountry);
  const checks = [];

  if (normalizedBillingCountry && normalizedAccountCountry) {
    const matches = normalizedBillingCountry === normalizedAccountCountry;
    checks.push({
      id: "account-country",
      label: "Account and billing country",
      status: matches ? "passed" : "warning",
      detail: matches
        ? `${normalizedBillingCountry} is consistent across the account and billing details.`
        : `Billing country ${normalizedBillingCountry} differs from account country ${normalizedAccountCountry}. Confirm this is intentional.`,
    });
  } else {
    checks.push({
      id: "account-country",
      label: "Account and billing country",
      status: "info",
      detail: "An account-country comparison is unavailable. This does not block payment.",
    });
  }

  if (normalizedBillingCountry && normalizedNetworkCountry) {
    const matches = normalizedBillingCountry === normalizedNetworkCountry;
    checks.push({
      id: "network-country",
      label: "Network and billing country",
      status: matches ? "passed" : "warning",
      detail: matches
        ? `${normalizedBillingCountry} is consistent with the available network country signal.`
        : `Billing country ${normalizedBillingCountry} differs from network country ${normalizedNetworkCountry}. Travel, VPNs, and corporate networks can cause this.`,
    });
  } else {
    checks.push({
      id: "network-country",
      label: "Network and billing country",
      status: "info",
      detail: "A reliable network-country comparison is unavailable. This does not block payment.",
    });
  }

  return checks;
}
