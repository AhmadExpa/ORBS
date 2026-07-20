import assert from "node:assert/strict";
import test from "node:test";
import { env } from "../config/env.js";
import { assertPdfBuffer, calculateSha256, createPresignedContractDownloadUrl } from "../services/contract-storage-service.js";
import { normalizeSubmittedDocumentReference } from "../services/contract-service.js";
import {
  extractDocumentFieldValues,
  mapDocumensoFieldValuesToContractDetails,
  normalizeDocumensoStatus,
} from "../services/documenso-service.js";
import { resetTurnstileReplayCacheForTests, verifyTurnstileToken } from "../services/turnstile-service.js";

const originalFetch = globalThis.fetch;
const originalEnv = {
  turnstileSecretKey: env.turnstileSecretKey,
  turnstileAllowedHostnames: env.turnstileAllowedHostnames,
  turnstileExpectedAction: env.turnstileExpectedAction,
  r2Bucket: env.r2Bucket,
  r2Endpoint: env.r2Endpoint,
  r2AccessKeyId: env.r2AccessKeyId,
  r2SecretAccessKey: env.r2SecretAccessKey,
  documensoApiUrl: env.documensoApiUrl,
};

function mockTurnstileResponse(payload, ok = true) {
  globalThis.fetch = async () => ({
    ok,
    async json() {
      return payload;
    },
  });
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  Object.assign(env, originalEnv);
  resetTurnstileReplayCacheForTests();
});

test("manual Documenso references accept only the configured HTTPS host", () => {
  env.documensoApiUrl = "https://app.documenso.com/api/v2";

  const reference = normalizeSubmittedDocumentReference({
    documentId: "envelope_valid-123",
    documentUrl: "https://app.documenso.com/documents/envelope_valid-123#review",
  });

  assert.equal(reference.documentId, "envelope_valid-123");
  assert.equal(reference.documentUrl, "https://app.documenso.com/documents/envelope_valid-123");
  assert.throws(
    () => normalizeSubmittedDocumentReference({ documentId: "envelope_valid-123", documentUrl: "https://evil.example/document" }),
    /must use https:\/\/app\.documenso\.com/,
  );
  assert.throws(
    () => normalizeSubmittedDocumentReference({ documentId: "invalid id", documentUrl: "https://app.documenso.com/document" }),
    /valid Documenso document ID/,
  );
});

test("Turnstile success validates hostname, action, and freshness", async () => {
  env.turnstileSecretKey = "test_secret";
  env.turnstileAllowedHostnames = ["elevenorbits.com"];
  env.turnstileExpectedAction = "contract_start";
  mockTurnstileResponse({
    success: true,
    hostname: "elevenorbits.com",
    action: "contract_start",
    challenge_ts: new Date().toISOString(),
  });

  const result = await verifyTurnstileToken({ token: "token_1" });
  assert.equal(result.hostname, "elevenorbits.com");
});

test("Turnstile failure is rejected", async () => {
  env.turnstileSecretKey = "test_secret";
  env.turnstileAllowedHostnames = ["elevenorbits.com"];
  mockTurnstileResponse({
    success: false,
    "error-codes": ["invalid-input-response"],
  });

  await assert.rejects(() => verifyTurnstileToken({ token: "token_2" }), /Turnstile verification failed/);
});

test("Wrong Turnstile hostname is rejected", async () => {
  env.turnstileSecretKey = "test_secret";
  env.turnstileAllowedHostnames = ["elevenorbits.com"];
  mockTurnstileResponse({
    success: true,
    hostname: "evil.example",
    action: "contract_start",
    challenge_ts: new Date().toISOString(),
  });

  await assert.rejects(() => verifyTurnstileToken({ token: "token_3" }), /Turnstile verification failed/);
});

test("Turnstile token reuse is rejected", async () => {
  env.turnstileSecretKey = "test_secret";
  env.turnstileAllowedHostnames = ["elevenorbits.com"];
  mockTurnstileResponse({
    success: true,
    hostname: "elevenorbits.com",
    action: "contract_start",
    challenge_ts: new Date().toISOString(),
  });

  await verifyTurnstileToken({ token: "token_4" });
  await assert.rejects(() => verifyTurnstileToken({ token: "token_4" }), /Turnstile verification failed/);
});

test("Turnstile accepts a per-request expected action override", async () => {
  env.turnstileSecretKey = "test_secret";
  env.turnstileAllowedHostnames = ["elevenorbits.com"];
  env.turnstileExpectedAction = "contract_start";
  mockTurnstileResponse({
    success: true,
    hostname: "elevenorbits.com",
    action: "contact_form",
    challenge_ts: new Date().toISOString(),
  });

  const result = await verifyTurnstileToken({ token: "token_5", expectedAction: "contact_form" });
  assert.equal(result.action, "contact_form");
});

test("SHA-256 generation is deterministic", () => {
  assert.equal(
    calculateSha256(Buffer.from("elevenorbits")),
    "74cec71aca3d43bc01948afdd7a4c402d67fbdd75191a171bf6d4b1ca7505105",
  );
});

test("PDF validation accepts PDF buffers and rejects non-PDF buffers", () => {
  assert.doesNotThrow(() => assertPdfBuffer(Buffer.from("%PDF-1.7\n")));
  assert.throws(() => assertPdfBuffer(Buffer.from("not a pdf")), /not a valid PDF/);
});

test("Documenso status normalization maps completed, rejected, cancelled, and expired states", () => {
  assert.equal(normalizeDocumensoStatus("completed"), "COMPLETED");
  assert.equal(normalizeDocumensoStatus("declined"), "REJECTED");
  assert.equal(normalizeDocumensoStatus("voided"), "CANCELLED");
  assert.equal(normalizeDocumensoStatus("expired"), "EXPIRED");
});

test("Documenso completed field extraction keeps signer-entered values", () => {
  const fields = extractDocumentFieldValues({
    data: {
      fields: [
        {
          id: 1,
          type: "TEXT",
          customText: "Acme Cloud Ltd",
          fieldMeta: {
            label: "Business Name",
          },
        },
        {
          id: 2,
          type: "SIGNATURE",
          customText: "signature-data",
          fieldMeta: {
            label: "Signature",
          },
        },
        {
          id: 3,
          type: "CHECKBOX",
          fieldMeta: {
            label: "Agreements",
            values: [
              { value: "MSA", checked: true },
              { value: "Privacy", checked: false },
            ],
          },
        },
      ],
    },
  });

  assert.deepEqual(fields, [
    {
      id: "1",
      label: "Business Name",
      type: "TEXT",
      value: "Acme Cloud Ltd",
    },
    {
      id: "3",
      label: "Agreements",
      type: "CHECKBOX",
      value: "MSA",
    },
  ]);
});

test("Documenso completed field extraction handles capitalized document fields and fieldMeta values", () => {
  const fields = extractDocumentFieldValues({
    data: {
      document: {
        Field: [
          {
            id: 10,
            type: "TEXT",
            fieldMeta: {
              label: "Company Name",
              text: "Orbit Support LLC",
            },
          },
          {
            id: 11,
            type: "DROPDOWN",
            fieldMeta: {
              label: "Country",
              defaultValue: "United States",
              values: [{ value: "United States" }, { value: "Canada" }],
            },
          },
        ],
        Recipient: [
          {
            id: 20,
            Field: [
              {
                id: 12,
                type: "RADIO",
                fieldMeta: {
                  label: "Signing as",
                  value: "Business",
                  values: [{ value: "Individual" }, { value: "Business" }],
                },
              },
            ],
          },
        ],
      },
    },
  });

  assert.deepEqual(fields, [
    {
      id: "10",
      label: "Company Name",
      type: "TEXT",
      value: "Orbit Support LLC",
    },
    {
      id: "11",
      label: "Country",
      type: "DROPDOWN",
      value: "United States",
    },
    {
      id: "12",
      label: "Signing as",
      type: "RADIO",
      value: "Business",
    },
  ]);
});

test("Documenso completed field extraction captures single checked acknowledgements", () => {
  const fields = extractDocumentFieldValues({
    data: {
      document: {
        Field: [
          {
            id: 21,
            type: "CHECKBOX",
            fieldMeta: {
              label: "Required acknowledgement",
              checked: true,
            },
          },
        ],
      },
    },
  });

  assert.deepEqual(fields, [
    {
      id: "21",
      label: "Required acknowledgement",
      type: "CHECKBOX",
      value: "Checked",
    },
  ]);
});

test("Documenso completed field labels map to contract details", () => {
  const details = mapDocumensoFieldValuesToContractDetails([
    { label: "Signing as", value: "Business" },
    { label: "Business Name", value: "Acme Cloud Ltd" },
    { label: "Job Title", value: "Director" },
    { label: "Registration Type", value: "Tax ID" },
    { label: "Business Registration", value: "PK-12345" },
    { label: "Incorporation Country", value: "Pakistan" },
    { label: "Phone Number", value: "+92 300 0000000" },
  ]);

  assert.deepEqual(details, {
    customerType: "BUSINESS",
    businessName: "Acme Cloud Ltd",
    businessRole: "Director",
    businessRegistrationType: "Tax ID",
    businessRegistrationNumber: "PK-12345",
    incorporationCountry: "Pakistan",
    phone: "+92 300 0000000",
  });
});

test("Presigned contract download URLs expire in five minutes", async () => {
  env.r2Bucket = "elevenorbits";
  env.r2Endpoint = "https://example.r2.cloudflarestorage.com";
  env.r2AccessKeyId = "test_access_key";
  env.r2SecretAccessKey = "test_secret_key";

  const url = await createPresignedContractDownloadUrl({
    key: "contracts/user_123/contract_123/signed-agreement-v1.0.pdf",
    fileName: "contract.pdf",
    expiresIn: 300,
  });

  assert.match(url, /X-Amz-Expires=300/);
});
