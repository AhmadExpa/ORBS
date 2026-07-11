import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContactSubmissionDocument,
  contactSubmissionUpdateSchema,
  normalizeContactSubmissionPayload,
} from "../services/contact-submission-service.js";

test("contact submission payload is trimmed and normalized", () => {
  const payload = normalizeContactSubmissionPayload({
    name: "  Ada Lovelace  ",
    email: "  ADA@Example.COM ",
    department: "sales",
    serviceInterest: "  AI Services ",
    subject: "  Private AI help ",
    message: "  We need help planning a private AI deployment. ",
    turnstileToken: "token_1",
  });

  assert.equal(payload.name, "Ada Lovelace");
  assert.equal(payload.email, "ada@example.com");
  assert.equal(payload.serviceInterest, "AI Services");
  assert.equal(payload.company, "");
  assert.equal(payload.phone, "");
});

test("contact submission validation rejects incomplete payloads", () => {
  assert.throws(
    () =>
      normalizeContactSubmissionPayload({
        name: "A",
        email: "not-an-email",
        subject: "Hi",
        message: "Too short",
        turnstileToken: "",
      }),
    /String must contain/,
  );
});

test("contact submission document excludes Turnstile token and stores verification metadata", () => {
  const document = buildContactSubmissionDocument({
    payload: {
      name: "Grace Hopper",
      email: "grace@example.com",
      company: "Compiler Co",
      department: "security",
      serviceInterest: "Cybersecurity",
      subject: "Security review",
      message: "We need help reviewing the production hosting baseline.",
      turnstileToken: "sensitive-token",
    },
    turnstile: {
      verifiedAt: new Date("2026-01-01T00:00:00.000Z"),
      hostname: "elevenorbits.com",
      action: "contact_form",
    },
    requestMeta: {
      ipAddress: "203.0.113.5",
      userAgent: "node-test",
    },
  });

  assert.equal(document.turnstileToken, undefined);
  assert.equal(document.turnstileHostname, "elevenorbits.com");
  assert.equal(document.turnstileAction, "contact_form");
  assert.equal(document.ipAddress, "203.0.113.5");
  assert.deepEqual(document.metadata, { source: "contact_page" });
});

test("contact submission status update schema accepts known workflow states", () => {
  assert.equal(contactSubmissionUpdateSchema.parse({ status: "responded" }).status, "responded");
  assert.throws(() => contactSubmissionUpdateSchema.parse({ status: "ignored" }), /Invalid enum value/);
  assert.throws(() => contactSubmissionUpdateSchema.parse({}), /status or admin note/);
});
