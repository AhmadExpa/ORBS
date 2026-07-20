import assert from "node:assert/strict";
import test from "node:test";
import {
  buildUserInitiatedCardPaymentIntentParams,
  DEFAULT_WALLET_TOPUP_THREE_D_SECURE_MODE,
  resolveWalletTopupThreeDSecureMode,
} from "../services/stripe-service.js";

test("customer-initiated wallet top-ups stay on-session and request an active 3DS challenge", () => {
  const params = buildUserInitiatedCardPaymentIntentParams({
    customerId: "cus_test",
    paymentMethodId: "pm_test",
    amount: 19.87,
    description: "Wallet top-up",
    metadata: { type: "wallet_topup", preserveSavedCard: true },
    requestThreeDSecure: DEFAULT_WALLET_TOPUP_THREE_D_SECURE_MODE,
  });

  assert.equal(params.amount, 1987);
  assert.equal(params.customer, "cus_test");
  assert.equal(params.payment_method, "pm_test");
  assert.equal(DEFAULT_WALLET_TOPUP_THREE_D_SECURE_MODE, "challenge");
  assert.equal(params.payment_method_options.card.request_three_d_secure, "challenge");
  assert.equal(params.confirm, undefined);
  assert.equal(params.off_session, undefined);
  assert.equal(params.setup_future_usage, undefined);
  assert.equal(params.metadata.preserveSavedCard, "true");
});

test("wallet top-ups support only the two customer-facing 3DS modes", () => {
  assert.equal(resolveWalletTopupThreeDSecureMode(), "challenge");
  assert.equal(resolveWalletTopupThreeDSecureMode("challenge"), "challenge");
  assert.equal(resolveWalletTopupThreeDSecureMode("automatic"), "automatic");
  assert.throws(() => resolveWalletTopupThreeDSecureMode("never"), /Choose either 3D Secure/);
});

test("new-card payments can save the card for later off-session renewals", () => {
  const params = buildUserInitiatedCardPaymentIntentParams({
    customerId: "cus_test",
    amount: 100,
    description: "Wallet top-up",
    metadata: { type: "wallet_topup" },
    saveForFutureUse: true,
    requestThreeDSecure: "automatic",
  });

  assert.equal(params.setup_future_usage, "off_session");
  assert.equal(params.payment_method, undefined);
  assert.equal(params.payment_method_options.card.request_three_d_secure, "automatic");
});

test("one-time top-ups do not request future card usage", () => {
  const params = buildUserInitiatedCardPaymentIntentParams({
    customerId: "cus_test",
    amount: 25,
    description: "Wallet top-up",
    metadata: { type: "wallet_topup" },
  });

  assert.equal(params.setup_future_usage, undefined);
  assert.equal(params.payment_method_options.card.request_three_d_secure, "automatic");
});
