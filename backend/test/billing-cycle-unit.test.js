import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateNextWalletAutoTopupRun,
  normalizeWalletAutoTopupAmount,
  normalizeWalletAutoTopupDayOfMonth,
} from "../services/billing-cycle-service.js";

test("monthly wallet auto top-up schedules the next future UTC run date", () => {
  assert.equal(
    calculateNextWalletAutoTopupRun({
      dayOfMonth: 15,
      fromDate: new Date("2026-07-10T12:00:00.000Z"),
    }).toISOString(),
    "2026-07-15T00:00:00.000Z",
  );

  assert.equal(
    calculateNextWalletAutoTopupRun({
      dayOfMonth: 15,
      fromDate: new Date("2026-07-15T12:00:00.000Z"),
    }).toISOString(),
    "2026-08-15T00:00:00.000Z",
  );
});

test("monthly wallet auto top-up clamps month-end dates", () => {
  assert.equal(
    calculateNextWalletAutoTopupRun({
      dayOfMonth: 31,
      fromDate: new Date("2026-01-31T12:00:00.000Z"),
    }).toISOString(),
    "2026-02-28T00:00:00.000Z",
  );

  assert.equal(
    calculateNextWalletAutoTopupRun({
      dayOfMonth: 31,
      fromDate: new Date("2026-12-31T12:00:00.000Z"),
    }).toISOString(),
    "2027-01-31T00:00:00.000Z",
  );
});

test("monthly wallet auto top-up settings validate amount and billing date", () => {
  assert.equal(normalizeWalletAutoTopupAmount("25.129"), 25.13);
  assert.equal(normalizeWalletAutoTopupDayOfMonth("12"), 12);
  assert.throws(() => normalizeWalletAutoTopupAmount("0"), /at least/);
  assert.throws(() => normalizeWalletAutoTopupDayOfMonth("32"), /1 to 31/);
});
