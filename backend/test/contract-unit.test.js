import assert from "node:assert/strict";
import test from "node:test";
import { env } from "../config/env.js";
import { assertPdfBuffer, calculateSha256, createPresignedContractDownloadUrl } from "../services/contract-storage-service.js";
import { normalizeDocumensoStatus } from "../services/documenso-service.js";
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
