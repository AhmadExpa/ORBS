import assert from "node:assert/strict";
import test from "node:test";
import { validateServiceIntakeAnswers } from "../lib/shared/service-intake.js";

test("VoIP service intake accepts required call-center essentials", () => {
  const result = validateServiceIntakeAnswers("vicidial", {
    callGoals: ["inbound", "outbound", "rvm"],
    currentSetup: "existing_vicidial",
    agentCountRange: "twenty_one_to_50",
    primaryRegion: "north_america",
    sipCarrierStatus: "have_carrier",
    didNumbers: ["have_numbers", "caller_id_rules"],
  });

  assert.equal(result.ok, true);
  assert.equal(result.configuration.categorySlug, "vicidial");
  assert.equal(result.configuration.answers.agentCountRange, "twenty_one_to_50");
  assert.equal(result.configuration.summary.some((item) => item.label === "Call direction and workload"), true);
  assert.equal(result.configuration.summary.some((item) => item.value.includes("RVM")), true);
});

test("service intake reports missing required essentials", () => {
  const result = validateServiceIntakeAnswers("object-storage", {
    bucketUseCase: "app_storage",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.accessStyle, "Access style is required.");
});

test("service intake rejects unknown answer keys", () => {
  const result = validateServiceIntakeAnswers("cdn", {
    originDomain: "origin.example.com",
    targetDomain: "cdn.example.com",
    contentType: "website_assets",
    cachingGoal: "static_assets",
    secretExtra: "unexpected",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.secretExtra, "This field is not valid for the selected service.");
});
