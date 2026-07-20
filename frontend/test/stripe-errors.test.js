import assert from "node:assert/strict";
import test from "node:test";
import { createStripePaymentError, getStripePaymentErrorMessage, shouldPreventSameCardRetry } from "../lib/payments/stripe-errors.js";

test("blocked payments with do-not-retry advice stop repeated attempts", () => {
  assert.match(
    getStripePaymentErrorMessage({ decline_code: "generic_decline", advice_code: "do_not_try_again" }),
    /Do not retry this card/,
  );
});

test("incorrect card data gets a specific correction path", () => {
  assert.match(getStripePaymentErrorMessage({ code: "incorrect_cvc" }), /CVC/);
  assert.match(getStripePaymentErrorMessage({ decline_code: "incorrect_zip" }), /billing postal code/);
});

test("temporary issuer failures recommend one delayed retry", () => {
  assert.match(getStripePaymentErrorMessage({ decline_code: "issuer_not_available" }), /Wait a few minutes/);
});

test("suspected fraud stays generic to the customer", () => {
  const message = getStripePaymentErrorMessage({ decline_code: "fraudulent" });

  assert.doesNotMatch(message, /fraud/i);
  assert.match(message, /contact support/);
});

test("do-not-retry and Radar-style declines require different card details", () => {
  assert.equal(shouldPreventSameCardRetry({ advice_code: "do_not_try_again" }), true);
  assert.equal(shouldPreventSameCardRetry({ decline_code: "generic_decline" }), true);
  assert.equal(shouldPreventSameCardRetry({ decline_code: "incorrect_cvc" }), false);

  const error = createStripePaymentError({ decline_code: "generic_decline" });
  assert.equal(error.preventSameCardRetry, true);
});
