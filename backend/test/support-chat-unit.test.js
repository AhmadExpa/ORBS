import assert from "node:assert/strict";
import test from "node:test";
import {
  classifySupportRequest,
  createSupportTicketNumber,
  createSupportTicketSubject,
  getCustomerSupportPin,
  hashSupportVerificationCode,
  isCustomerSupportPinValid,
  isSupportVerificationCodeValid,
} from "../services/support-chat-service.js";

test("customer support PINs are stable, six digits, and account-specific", () => {
  const firstUser = { _id: "user-one", clerkId: "clerk-one" };
  const secondUser = { _id: "user-two", clerkId: "clerk-two" };
  const firstPin = getCustomerSupportPin(firstUser);

  assert.match(firstPin, /^\d{6}$/u);
  assert.equal(getCustomerSupportPin(firstUser), firstPin);
  assert.notEqual(getCustomerSupportPin(secondUser), firstPin);
  assert.equal(isCustomerSupportPinValid(firstUser, firstPin), true);
  assert.equal(isCustomerSupportPinValid(firstUser, "12345"), false);
});

test("visitor email verification codes are tied to the ticket and email", () => {
  const expectedHash = hashSupportVerificationCode({
    ticketNumber: "EO-20260725-ABC123",
    email: "visitor@example.com",
    code: "482901",
  });

  assert.equal(
    isSupportVerificationCodeValid({
      ticketNumber: "EO-20260725-ABC123",
      email: "visitor@example.com",
      code: "482901",
      expectedHash,
    }),
    true,
  );
  assert.equal(
    isSupportVerificationCodeValid({
      ticketNumber: "EO-20260725-ABC123",
      email: "other@example.com",
      code: "482901",
      expectedHash,
    }),
    false,
  );
});

test("support tickets receive readable references and concise subjects", () => {
  assert.equal(
    createSupportTicketNumber(new Date("2026-07-25T12:00:00.000Z"), "abc123"),
    "EO-20260725-ABC123",
  );
  assert.equal(createSupportTicketSubject("  VPS   cannot reach the network  "), "VPS cannot reach the network");
  assert.equal(createSupportTicketSubject("x".repeat(120)).length, 90);
});

test("support requests are routed locally without an external model", () => {
  assert.deepEqual(
    classifySupportRequest("Our production server is down and unreachable."),
    { category: "hosting", priority: "critical" },
  );
  assert.deepEqual(
    classifySupportRequest("Please provide a quotation for a new order."),
    { category: "sales", priority: "medium" },
  );
  assert.deepEqual(
    classifySupportRequest("I need help with an invoice payment."),
    { category: "billing", priority: "medium" },
  );
});
