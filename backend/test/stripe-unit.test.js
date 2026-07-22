import assert from "node:assert/strict";
import test from "node:test";
import {
  buildUserInitiatedCardPaymentIntentParams,
  CUSTOMER_PRESENT_THREE_D_SECURE_MODE,
  normalizePaymentBillingDetails,
  normalizePaymentPhoneNumber,
  WALLET_TOPUP_THREE_D_SECURE_MODE,
} from "../services/stripe-service.js";

test("customer-initiated wallet top-ups stay on-session and request an active 3DS challenge", () => {
  const params = buildUserInitiatedCardPaymentIntentParams({
    customerId: "cus_test",
    paymentMethodId: "pm_test",
    amount: 19.87,
    description: "Wallet top-up",
    metadata: { type: "wallet_topup", preserveSavedCard: true },
    requestThreeDSecure: WALLET_TOPUP_THREE_D_SECURE_MODE,
  });

  assert.equal(params.amount, 1987);
  assert.equal(params.customer, "cus_test");
  assert.equal(params.payment_method, "pm_test");
  assert.equal(WALLET_TOPUP_THREE_D_SECURE_MODE, "challenge");
  assert.equal(params.payment_method_options.card.request_three_d_secure, "challenge");
  assert.equal(params.confirm, undefined);
  assert.equal(params.off_session, undefined);
  assert.equal(params.setup_future_usage, undefined);
  assert.equal(params.metadata.preserveSavedCard, "true");
});

test("new-card payments can save the card for later off-session renewals", () => {
  const params = buildUserInitiatedCardPaymentIntentParams({
    customerId: "cus_test",
    amount: 100,
    description: "Wallet top-up",
    metadata: { type: "wallet_topup" },
    saveForFutureUse: true,
    requestThreeDSecure: CUSTOMER_PRESENT_THREE_D_SECURE_MODE,
    receiptEmail: "cardholder@example.com",
  });

  assert.equal(params.setup_future_usage, "off_session");
  assert.equal(params.payment_method, undefined);
  assert.equal(params.payment_method_options.card.request_three_d_secure, "challenge");
  assert.equal(params.receipt_email, "cardholder@example.com");
});

test("one-time customer-present payments default to 3DS and do not request future usage", () => {
  const params = buildUserInitiatedCardPaymentIntentParams({
    customerId: "cus_test",
    amount: 25,
    description: "Wallet top-up",
    metadata: { type: "wallet_topup" },
  });

  assert.equal(params.setup_future_usage, undefined);
  assert.equal(params.payment_method_options.card.request_three_d_secure, "challenge");
});

test("provided billing details are validated and mapped to Stripe fields", () => {
  const details = normalizePaymentBillingDetails({
    name: " Card Holder ",
    email: " CARD@EXAMPLE.COM ",
    phone: "+1 813 555 0199",
    line1: "123 Billing Street",
    line2: "Suite 5",
    city: "Tampa",
    state: "FL",
    postalCode: "33601",
    country: "us",
  });

  assert.equal(details.name, "Card Holder");
  assert.equal(details.email, "card@example.com");
  assert.equal(details.phone, "+18135550199");
  assert.equal(details.address.postal_code, "33601");
  assert.equal(details.address.country, "US");
  assert.throws(() => normalizePaymentBillingDetails({}), /full name/);
});

test("payment phone numbers use E.164 before Stripe receives them", () => {
  assert.equal(normalizePaymentPhoneNumber("+1 (813) 555-0199"), "+18135550199");
  assert.equal(normalizePaymentPhoneNumber("0044 7700 900123"), "+447700900123");
  assert.equal(normalizePaymentPhoneNumber("08135550199"), "");
});
