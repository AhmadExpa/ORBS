import assert from "node:assert/strict";
import test from "node:test";
import { classifyEmailDeliveryError } from "../services/email-service.js";

test("email delivery errors distinguish authentication, TLS, connection, and recipient failures", () => {
  assert.equal(classifyEmailDeliveryError({ code: "EAUTH", message: "535 Incorrect authentication data" }), "SMTP_AUTH_FAILED");
  assert.equal(classifyEmailDeliveryError({ code: "ESOCKET", message: "Hostname/IP does not match certificate" }), "SMTP_TLS_FAILED");
  assert.equal(classifyEmailDeliveryError({ code: "ETIMEDOUT", message: "Connection timed out" }), "SMTP_CONNECTION_FAILED");
  assert.equal(classifyEmailDeliveryError({ code: "EENVELOPE", message: "No recipients defined" }), "RECIPIENT_REJECTED");
  assert.equal(classifyEmailDeliveryError({ code: "EUNKNOWN", message: "Unexpected response" }), "SMTP_SEND_FAILED");
});
