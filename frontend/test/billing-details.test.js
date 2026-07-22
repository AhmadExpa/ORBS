import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyPaymentBillingDetails,
  getPaymentBillingDetailsValidationError,
  normalizePaymentBillingDetails,
  normalizePaymentPhoneNumber,
  toStripeBillingDetails,
} from "../lib/payments/billing-details.js";

const validDetails = {
  name: "  Card Holder  ",
  email: "  CARD@EXAMPLE.COM ",
  phone: "+1 813 555 0199",
  line1: "123 Billing Street",
  line2: "Suite 5",
  city: "Tampa",
  state: "FL",
  postalCode: "33601",
  country: "us",
};

test("payment billing details are normalized without account-profile defaults", () => {
  assert.deepEqual(createEmptyPaymentBillingDetails(), {
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  assert.deepEqual(normalizePaymentBillingDetails(validDetails), {
    name: "Card Holder",
    email: "card@example.com",
    phone: "+18135550199",
    line1: "123 Billing Street",
    line2: "Suite 5",
    city: "Tampa",
    state: "FL",
    postalCode: "33601",
    country: "US",
  });
});

test("payment billing details require identity, contact, and address fields", () => {
  assert.match(getPaymentBillingDetailsValidationError(createEmptyPaymentBillingDetails()), /full name/);
  assert.equal(getPaymentBillingDetailsValidationError(validDetails), "");
});

test("payment phone numbers are normalized to E.164", () => {
  assert.equal(normalizePaymentPhoneNumber("+1 (813) 555-0199"), "+18135550199");
  assert.equal(normalizePaymentPhoneNumber("0044 7700 900123"), "+447700900123");
  assert.equal(normalizePaymentPhoneNumber("8135550199"), "");
  assert.match(
    getPaymentBillingDetailsValidationError({ ...validDetails, phone: "8135550199" }),
    /international format/,
  );
});

test("Stripe billing details use Stripe address field names", () => {
  const details = toStripeBillingDetails(validDetails);

  assert.equal(details.email, "card@example.com");
  assert.equal(details.address.postal_code, "33601");
  assert.equal(details.address.country, "US");
});
