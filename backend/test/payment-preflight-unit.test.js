import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCountryConsistencyChecks,
  getPaymentNetworkSignal,
  maskPaymentIp,
  normalizePaymentCountry,
} from "../services/payment-preflight-service.js";

test("payment preflight masks network addresses before returning them", () => {
  assert.equal(maskPaymentIp("203.0.113.24"), "203.0.x.x");
  assert.equal(maskPaymentIp("::ffff:192.0.2.44"), "192.0.x.x");
  assert.equal(maskPaymentIp("2001:db8:abcd::1"), "2001:db8::/masked");
});

test("payment preflight treats country mismatches as warnings, not predictions", () => {
  const checks = buildCountryConsistencyChecks({
    billingCountry: "US",
    accountCountry: "US",
    networkCountry: "PK",
  });

  assert.equal(checks.find((check) => check.id === "account-country")?.status, "passed");
  assert.equal(checks.find((check) => check.id === "network-country")?.status, "warning");
  assert.equal(normalizePaymentCountry("t1"), "");
});

test("payment preflight prioritizes proxy network signals and never returns a full IP", () => {
  const signal = getPaymentNetworkSignal({
    headers: {
      "cf-connecting-ip": "198.51.100.72",
      "x-forwarded-for": "203.0.113.9",
      "cf-ipcountry": "gb",
      "x-forwarded-proto": "https",
    },
    ip: "127.0.0.1",
    protocol: "http",
  });

  assert.equal(signal.detected, true);
  assert.equal(signal.maskedIp, "198.51.x.x");
  assert.equal(signal.country, "GB");
  assert.equal(signal.secureTransport, true);
});
