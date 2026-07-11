import assert from "node:assert/strict";
import test from "node:test";
import { validateServiceIntakeAnswers } from "../lib/shared/service-intake.js";

test("VoIP service intake accepts required call-center essentials", () => {
  const result = validateServiceIntakeAnswers("vicidial", {
    callGoals: ["inbound", "outbound", "rvm"],
    currentSetup: "existing_vicidial",
    agentCount: 25,
    primaryRegion: "US Eastern",
    sipCarrierStatus: "have_carrier",
    didNumbers: "Existing DIDs in 813 and 727.",
  });

  assert.equal(result.ok, true);
  assert.equal(result.configuration.categorySlug, "vicidial");
  assert.equal(result.configuration.answers.agentCount, 25);
  assert.equal(result.configuration.summary.some((item) => item.label === "Call direction and workload"), true);
  assert.equal(result.configuration.summary.some((item) => item.value.includes("RVM")), true);
});

test("service intake reports missing required essentials", () => {
  const result = validateServiceIntakeAnswers("object-storage", {
    bucketUseCase: "app_storage",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.estimatedGb, "Estimated monthly capacity is required.");
  assert.equal(result.errors.accessStyle, "Access style is required.");
});

test("service intake rejects unknown answer keys", () => {
  const result = validateServiceIntakeAnswers("cdn", {
    originDomain: "origin.example.com",
    targetDomain: "cdn.example.com",
    contentType: "website_assets",
    cachingGoal: "Cache static assets aggressively.",
    secretExtra: "unexpected",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.secretExtra, "This field is not valid for the selected service.");
});
