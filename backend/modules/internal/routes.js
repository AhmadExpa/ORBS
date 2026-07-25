import express from "express";
import { env } from "../../config/env.js";
import { processWalletAutoTopups } from "../../services/billing-cycle-service.js";
import { syncPendingContracts } from "../../services/contract-service.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";

export const internalRouter = express.Router();

function requireInternalSecret(req, res, next) {
  const provided = String(req.headers["x-internal-cron-secret"] || req.headers.authorization?.replace(/^Bearer\s+/iu, "") || "");
  if (!env.internalCronSecret || provided !== env.internalCronSecret) {
    next(new HttpError(401, "Internal route authentication required."));
    return;
  }

  next();
}

internalRouter.post(
  "/wallet-auto-topups/run-due",
  requireInternalSecret,
  asyncHandler(async (req, res) => {
    const result = await processWalletAutoTopups({
      limit: Number(req.body?.limit || 100),
    });
    res.json({
      success: true,
      ...result,
    });
  }),
);

internalRouter.post(
  "/contracts/sync-pending",
  requireInternalSecret,
  asyncHandler(async (req, res) => {
    const results = await syncPendingContracts({
      limit: Number(req.body?.limit || 25),
    });
    res.json({
      success: true,
      processed: results.length,
      results,
    });
  }),
);
