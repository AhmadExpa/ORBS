import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPaymentIntentCaptured,
  buildUserInitiatedCardPaymentIntentParams,
  CARD_VERIFICATION_MODE_3DS,
  CARD_VERIFICATION_MODE_STANDARD,
  CUSTOMER_PRESENT_CAPTURE_METHOD,
  CUSTOMER_PRESENT_THREE_D_SECURE_MODE,
  getPaymentIntentCardAuthentication,
  getSetupIntentCardAuthentication,
  normalizePaymentBillingDetails,
  normalizePaymentPhoneNumber,
  resolveCustomerCardVerificationMode,
  resolvePortalCardVerificationMode,
  STANDARD_THREE_D_SECURE_MODE,
  WALLET_TOPUP_THREE_D_SECURE_MODE,
} from "../services/stripe-service.js";

test("customer-initiated wallet top-ups use adaptive 3DS and immediate capture", () => {
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
  assert.equal(WALLET_TOPUP_THREE_D_SECURE_MODE, "automatic");
  assert.equal(params.payment_method_options.card.request_three_d_secure, "automatic");
  assert.equal(params.capture_method, CUSTOMER_PRESENT_CAPTURE_METHOD);
  assert.equal(params.capture_method, "automatic");
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

test("one-time customer-present payments default to adaptive authentication", () => {
  const params = buildUserInitiatedCardPaymentIntentParams({
    customerId: "cus_test",
    amount: 25,
    description: "Wallet top-up",
    metadata: { type: "wallet_topup" },
  });

  assert.equal(params.setup_future_usage, undefined);
  assert.equal(params.payment_method_options.card.request_three_d_secure, "automatic");
});

test("customers can choose standard processing or request 3D Secure", () => {
  assert.deepEqual(resolveCustomerCardVerificationMode(), {
    cardVerificationMode: CARD_VERIFICATION_MODE_STANDARD,
    requestThreeDSecure: STANDARD_THREE_D_SECURE_MODE,
  });
  assert.deepEqual(resolveCustomerCardVerificationMode(CARD_VERIFICATION_MODE_STANDARD), {
    cardVerificationMode: CARD_VERIFICATION_MODE_STANDARD,
    requestThreeDSecure: STANDARD_THREE_D_SECURE_MODE,
  });
  assert.deepEqual(resolveCustomerCardVerificationMode(CARD_VERIFICATION_MODE_3DS), {
    cardVerificationMode: CARD_VERIFICATION_MODE_3DS,
    requestThreeDSecure: CUSTOMER_PRESENT_THREE_D_SECURE_MODE,
  });
  assert.throws(
    () => resolveCustomerCardVerificationMode("disable_security"),
    /standard card processing or 3D Secure verification/,
  );
});

test("portal card payments use adaptive authentication for non-3DS compatibility", () => {
  assert.deepEqual(resolvePortalCardVerificationMode(), {
    cardVerificationMode: CARD_VERIFICATION_MODE_STANDARD,
    requestThreeDSecure: STANDARD_THREE_D_SECURE_MODE,
  });
});

test("standard customer-present payments do not request future card setup", () => {
  const params = buildUserInitiatedCardPaymentIntentParams({
    customerId: "cus_test",
    amount: 100,
    description: "Order payment",
    metadata: { type: "order_payment", cardVerificationMode: CARD_VERIFICATION_MODE_STANDARD },
    saveForFutureUse: false,
    requestThreeDSecure: STANDARD_THREE_D_SECURE_MODE,
  });

  assert.equal(params.setup_future_usage, undefined);
  assert.equal(params.payment_method_options.card.request_three_d_secure, "automatic");
});

test("provided billing details are validated and mapped to Stripe fields", () => {
  const details = normalizePaymentBillingDetails({
    name: " Card Holder ",
    email: " CARD@EXAMPLE.COM ",
    phone: "+1 813 555 0199",
    postalCode: "33601",
  });

  assert.equal(details.name, "Card Holder");
  assert.equal(details.email, "card@example.com");
  assert.equal(details.phone, "+18135550199");
  assert.equal(details.address.postal_code, "33601");
  assert.deepEqual(details.address, { postal_code: "33601" });
  assert.deepEqual(normalizePaymentBillingDetails({}), {});
});

test("complete billing addresses are preserved for Stripe verification", () => {
  const details = normalizePaymentBillingDetails({
    name: "Card Holder",
    line1: "123 Main Street",
    line2: "Suite 5",
    city: "Tampa",
    state: "FL",
    postalCode: "33601",
    country: "us",
  });

  assert.deepEqual(details.address, {
    line1: "123 Main Street",
    line2: "Suite 5",
    city: "Tampa",
    state: "FL",
    postal_code: "33601",
    country: "US",
  });
});

test("actual 3DS outcomes are read from expanded Stripe resources", () => {
  const paymentAuthentication = getPaymentIntentCardAuthentication({
    latest_charge: {
      payment_method_details: {
        card: {
          three_d_secure: {
            result: "authenticated",
            authentication_flow: "challenge",
            version: "2.2.0",
            liability_shift: "possible",
          },
        },
      },
    },
  });
  const setupAuthentication = getSetupIntentCardAuthentication({
    latest_attempt: {
      payment_method_details: {
        card: {
          three_d_secure: {
            result: "authenticated",
            authentication_flow: "frictionless",
          },
        },
      },
    },
  });

  assert.deepEqual(paymentAuthentication, {
    attempted: true,
    authenticated: true,
    result: "authenticated",
    authenticationFlow: "challenge",
    version: "2.2.0",
    liabilityShift: "possible",
  });
  assert.equal(setupAuthentication.authenticated, true);
  assert.equal(setupAuthentication.authenticationFlow, "frictionless");
  assert.equal(getPaymentIntentCardAuthentication({ latest_charge: "ch_unexpanded" }).authenticated, false);
});

test("fulfillment accepts only succeeded payments with a paid, captured charge", () => {
  assert.doesNotThrow(() => assertPaymentIntentCaptured({
    status: "succeeded",
    latest_charge: { paid: true, captured: true },
  }));
  assert.throws(
    () => assertPaymentIntentCaptured({ status: "requires_capture", latest_charge: { paid: true, captured: false } }),
    /not completed yet/,
  );
  assert.throws(
    () => assertPaymentIntentCaptured({ status: "succeeded", latest_charge: { paid: true, captured: false } }),
    /not been captured successfully/,
  );
  assert.throws(
    () => assertPaymentIntentCaptured({ status: "succeeded", latest_charge: "ch_unexpanded" }),
    /could not be verified/,
  );
});

test("payment phone numbers use E.164 before Stripe receives them", () => {
  assert.equal(normalizePaymentPhoneNumber("+1 (813) 555-0199"), "+18135550199");
  assert.equal(normalizePaymentPhoneNumber("0044 7700 900123"), "+447700900123");
  assert.equal(normalizePaymentPhoneNumber("08135550199"), "");
});

test("payment email and phone are optional", () => {
  const details = normalizePaymentBillingDetails({
    name: "Card Holder",
    postalCode: "33601",
  });

  assert.deepEqual(details, {
    name: "Card Holder",
    address: { postal_code: "33601" },
  });
});
