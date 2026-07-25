import assert from "node:assert/strict";
import test from "node:test";
import { env } from "../config/env.js";
import {
  getAiAdvisorReply,
  redactAiAdvisorText,
  selectRelevantAdvisorCatalog,
} from "../services/ai-advisor-service.js";
import {
  getAiAdvisorPeriod,
  getAiAdvisorResetAt,
  getAiAdvisorUsage,
  refundAiAdvisorMessage,
  reserveAiAdvisorMessage,
} from "../services/ai-advisor-usage-service.js";

test("AI Advisor monthly periods and resets use UTC calendar months", () => {
  const date = new Date("2026-07-31T23:59:59.000Z");
  assert.equal(getAiAdvisorPeriod(date), "2026-07");
  assert.equal(getAiAdvisorResetAt(date).toISOString(), "2026-08-01T00:00:00.000Z");
});

test("AI Advisor redacts secrets before sending customer text to a model", () => {
  const redacted = redactAiAdvisorText(
    "Email owner@example.com password:Unsafe123 support PIN 482901 key sk_test_12345678901234567890",
  );

  assert.doesNotMatch(redacted, /owner@example\.com/u);
  assert.doesNotMatch(redacted, /Unsafe123/u);
  assert.doesNotMatch(redacted, /482901/u);
  assert.doesNotMatch(redacted, /sk_test_/u);
});

test("AI Advisor sends only the catalog entries relevant to the customer question", () => {
  const catalog = {
    plans: [
      { slug: "managed-vps", name: "Managed VPS", description: "Linux application hosting" },
      { slug: "object-storage", name: "Object Storage", description: "S3 backups and datasets" },
      { slug: "workflow", name: "Workflow Automation", description: "n8n integrations" },
    ],
    addons: [],
  };
  const relevant = selectRelevantAdvisorCatalog(catalog, "I need S3 object storage for backups.");
  assert.equal(relevant.plans[0].slug, "object-storage");
});

test("AI Advisor usage reports and reserves one customer message atomically", async () => {
  const date = new Date("2026-07-25T12:00:00.000Z");
  const usage = await getAiAdvisorUsage("customer-one", {
    date,
    limit: 200,
    queryFn: async () => ({ rows: [{ data: { messagesUsed: 41 } }] }),
  });
  assert.deepEqual(usage, {
    period: "2026-07",
    limit: 200,
    used: 41,
    remaining: 159,
    resetsAt: "2026-08-01T00:00:00.000Z",
  });

  let capturedSql = "";
  const reserved = await reserveAiAdvisorMessage("customer-one", {
    date,
    limit: 200,
    queryFn: async (sql) => {
      capturedSql = sql;
      return { rows: [{ data: { messagesUsed: 42 } }] };
    },
  });
  assert.match(capturedSql, /ON CONFLICT \(collection, id\) DO UPDATE/u);
  assert.equal(reserved.used, 42);
  assert.equal(reserved.remaining, 158);
});

test("AI Advisor rejects a message after the monthly allowance is exhausted", async () => {
  await assert.rejects(
    reserveAiAdvisorMessage("customer-one", {
      date: new Date("2026-07-25T12:00:00.000Z"),
      limit: 200,
      queryFn: async () => ({ rows: [] }),
    }),
    (error) => error.statusCode === 429 && error.details?.code === "AI_ADVISOR_MONTHLY_LIMIT_REACHED",
  );
});

test("AI Advisor can refund a reserved message after a provider failure", async () => {
  let capturedParams = [];
  await refundAiAdvisorMessage("customer-one", {
    date: new Date("2026-07-25T12:00:00.000Z"),
    queryFn: async (sql, params) => {
      assert.match(sql, /GREATEST/u);
      capturedParams = params;
      return { rows: [] };
    },
  });
  assert.equal(capturedParams[0], "ai_advisor_usage");
  assert.equal(capturedParams[1], "customer-one:2026-07");
});

test("AI Advisor uses structured output and grounds recommendations in real catalog pricing", async () => {
  const originalKey = env.openRouterApiKey;
  const originalModel = env.openRouterModel;
  env.openRouterApiKey = "test-openrouter-key";
  env.openRouterModel = "test/advisor-model";
  let capturedRequest;

  const catalog = {
    plans: [{
      slug: "managed-saas-plan",
      name: "Managed SaaS Plan",
      description: "Managed application hosting and operations.",
      monthlyPrice: 125,
      yearlyPrice: 1350,
      priceLabel: "$125/mo",
      billingCycles: ["monthly", "yearly"],
      features: ["Monitoring", "Backups"],
      techStack: ["Node.js", "PostgreSQL"],
      serviceType: "managed_saas",
      isManaged: true,
      contactSalesOnly: false,
    }],
    addons: [],
  };

  try {
    const result = await getAiAdvisorReply(
      {
        question: "Help me structure a multi-tenant SaaS.",
        history: [],
        catalog,
      },
      {
        fetchImpl: async (url, options) => {
          capturedRequest = { url, options };
          return {
            ok: true,
            status: 200,
            async json() {
              return {
                model: "test/advisor-model",
                usage: { prompt_tokens: 120, completion_tokens: 80 },
                choices: [{
                  message: {
                    content: JSON.stringify({
                      answer: "Use a tenant-aware application layer with PostgreSQL row-level isolation.",
                      recommendedPlans: [{
                        slug: "managed-saas-plan",
                        reason: "It provides a managed operational base for the application.",
                      }, {
                        slug: "invented-plan",
                        reason: "This plan is not in the catalog and must be discarded.",
                      }],
                      nextSteps: ["Confirm expected tenant count and workload."],
                      shouldContactTeam: true,
                    }),
                  },
                }],
              };
            },
          };
        },
      },
    );

    const body = JSON.parse(capturedRequest.options.body);
    assert.equal(capturedRequest.url, "https://openrouter.ai/api/v1/chat/completions");
    assert.equal(capturedRequest.options.headers.Authorization, "Bearer test-openrouter-key");
    assert.equal(body.response_format.type, "json_schema");
    assert.equal(body.provider.require_parameters, true);
    assert.equal(body.provider.data_collection, "deny");
    assert.equal(body.provider.zdr, true);
    assert.match(body.messages[0].content, /managed-saas-plan/u);
    assert.equal(result.recommendations.length, 1);
    assert.equal(result.recommendations[0].priceLabel, "$125/mo");
    assert.equal(result.recommendations[0].slug, "managed-saas-plan");
    assert.equal(result.usage.promptTokens, 120);
  } finally {
    env.openRouterApiKey = originalKey;
    env.openRouterModel = originalModel;
  }
});
