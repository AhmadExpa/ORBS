import express from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { verifyTurnstileToken } from "../../services/turnstile-service.js";
import {
  createContractDownloadUrl,
  getCurrentContractSummary,
  getCustomerContract,
  startCustomerContract,
  syncContractWithDocumenso,
} from "../../services/contract-service.js";

export const contractsRouter = express.Router();

const startContractSchema = z
  .object({
    customerType: z.enum(["INDIVIDUAL", "BUSINESS"]),
    businessName: z.string().trim().max(160).optional(),
    country: z.string().trim().max(80).optional(),
    phone: z.string().trim().max(40).optional(),
    turnstileToken: z.string().trim().min(1),
  })
  .superRefine((payload, ctx) => {
    if (payload.customerType === "BUSINESS" && !payload.businessName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessName"],
        message: "Business name is required when signing for a business.",
      });
    }
  });

contractsRouter.get(
  "/current",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const summary = await getCurrentContractSummary(req.auth.clerkId);
    res.json(summary);
  }),
);

contractsRouter.post(
  "/start",
  requireCustomer,
  rateLimit({
    name: "contract-start",
    windowMs: 10 * 60 * 1000,
    max: env.contractStartRateLimitMax,
    keyFn: (req) => req.auth?.clerkId || req.ip,
  }),
  asyncHandler(async (req, res) => {
    const payload = startContractSchema.parse(req.body);
    const turnstile = await verifyTurnstileToken({
      token: payload.turnstileToken,
      remoteIp: req.ip,
      expectedAction: env.turnstileExpectedAction,
    });

    const result = await startCustomerContract({
      auth: req.auth,
      payload,
      turnstile,
    });

    res.status(201).json(result);
  }),
);

contractsRouter.post(
  "/:id/sync",
  requireCustomer,
  rateLimit({
    name: "contract-sync",
    windowMs: 5 * 60 * 1000,
    max: env.contractSyncRateLimitMax,
    keyFn: (req) => req.auth?.clerkId || req.ip,
  }),
  asyncHandler(async (req, res) => {
    const contract = await syncContractWithDocumenso({
      contractId: req.params.id,
      auth: req.auth,
    });
    res.json({ contract });
  }),
);

contractsRouter.get(
  "/:id",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const contract = await getCustomerContract({
      contractId: req.params.id,
      auth: req.auth,
    });
    res.json({ contract });
  }),
);

contractsRouter.get(
  "/:id/download",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const result = await createContractDownloadUrl({
      contractId: req.params.id,
      auth: req.auth,
    });
    res.json(result);
  }),
);

contractsRouter.get(
  "/:id/audit-download",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const result = await createContractDownloadUrl({
      contractId: req.params.id,
      auth: req.auth,
      audit: true,
    });
    res.json(result);
  }),
);
