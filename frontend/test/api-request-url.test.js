import assert from "node:assert/strict";
import test from "node:test";
import { resolveApiBaseUrl } from "../lib/api/request-url.js";

test("production browser requests use the same-origin API proxy", () => {
  assert.equal(
    resolveApiBaseUrl("https://api.elevenorbits.com/api/v1", "https://www.elevenorbits.com"),
    "/api/v1",
  );
  assert.equal(
    resolveApiBaseUrl("https://api.elevenorbits.com/api/v1", "https://elevenorbits.com"),
    "/api/v1",
  );
});

test("local development keeps its configured API server", () => {
  assert.equal(resolveApiBaseUrl("http://localhost:4000/api/v1", "http://localhost:3000"), "http://localhost:4000/api/v1");
});

