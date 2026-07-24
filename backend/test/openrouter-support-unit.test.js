import assert from "node:assert/strict";
import test from "node:test";
import { env } from "../config/env.js";
import {
  getSupportAssistantInsight,
  redactSensitiveSupportText,
} from "../services/openrouter-support-service.js";

test("support assistant redacts credentials and verification values before model use", () => {
  const redacted = redactSensitiveSupportText(
    "Email me at person@example.com password:SuperSecret123 support PIN 482901 key sk_test_12345678901234567890 IP 203.0.113.20",
  );

  assert.doesNotMatch(redacted, /person@example\.com/u);
  assert.doesNotMatch(redacted, /SuperSecret123/u);
  assert.doesNotMatch(redacted, /482901/u);
  assert.doesNotMatch(redacted, /sk_test_/u);
  assert.doesNotMatch(redacted, /203\.0\.113\.20/u);
  assert.match(redacted, /\[email redacted\]/u);
});

test("support assistant sends a structured server-side OpenRouter request", async () => {
  const originalKey = env.openRouterApiKey;
  const originalModel = env.openRouterModel;
  env.openRouterApiKey = "test-openrouter-key";
  env.openRouterModel = "test/support-model";
  let capturedRequest = null;

  try {
    const result = await getSupportAssistantInsight(
      {
        stage: "ticket",
        requesterType: "visitor",
        initialQuery: "Need a server quotation",
        question: "Please quote a managed VPS for a production application.",
      },
      {
        fetchImpl: async (url, options) => {
          capturedRequest = { url, options };
          return {
            ok: true,
            status: 200,
            async json() {
              return {
                model: "test/support-model",
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        customerReply: "I understand that you need a managed VPS quotation.",
                        summary: "Visitor requested pricing for a production managed VPS.",
                        subject: "Managed VPS quotation request",
                        category: "sales",
                        priority: "medium",
                        clarifyingQuestion: "What CPU, memory, storage, and region do you need?",
                        agentNotes: "Prepare a managed VPS quotation after confirming capacity.",
                        possibleQuotationRequest: true,
                        requiresUrgentReview: false,
                      }),
                    },
                  },
                ],
              };
            },
          };
        },
      },
    );

    const requestBody = JSON.parse(capturedRequest.options.body);
    assert.equal(capturedRequest.url, "https://openrouter.ai/api/v1/chat/completions");
    assert.equal(capturedRequest.options.headers.Authorization, "Bearer test-openrouter-key");
    assert.equal(requestBody.model, "test/support-model");
    assert.equal(requestBody.response_format.type, "json_schema");
    assert.equal(requestBody.provider.require_parameters, true);
    assert.equal(result.available, true);
    assert.equal(result.category, "sales");
    assert.equal(result.possibleQuotationRequest, true);
  } finally {
    env.openRouterApiKey = originalKey;
    env.openRouterModel = originalModel;
  }
});

test("support assistant falls back safely when OpenRouter is unavailable", async () => {
  const originalKey = env.openRouterApiKey;
  env.openRouterApiKey = "";

  try {
    const result = await getSupportAssistantInsight({
      stage: "ticket",
      requesterType: "customer",
      question: "Our production server is down and unreachable.",
    });

    assert.equal(result.available, false);
    assert.equal(result.model, "deterministic-fallback");
    assert.equal(result.category, "hosting");
    assert.equal(result.priority, "critical");
  } finally {
    env.openRouterApiKey = originalKey;
  }
});
