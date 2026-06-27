import express from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { asyncHandler } from "../../utils/async-handler.js";
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
    signingCapacity: z.string().trim().max(120).optional(),
    businessRole: z.string().trim().max(120).optional(),
    businessRegistrationType: z.string().trim().max(80).optional(),
    businessRegistrationNumber: z.string().trim().max(120).optional(),
    incorporationCountry: z.string().trim().max(80).optional(),
    country: z.string().trim().max(80).optional(),
    phone: z.string().trim().max(40).optional(),
  })
  .superRefine((payload, ctx) => {
    if (!payload.country) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["country"],
        message: "Country is required before starting the signing document.",
      });
    }
    if (!payload.signingCapacity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["signingCapacity"],
        message: "Signing capacity is required before starting the signing document.",
      });
    }
    if (payload.customerType === "BUSINESS" && !payload.businessName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessName"],
        message: "Business name is required when signing for a business.",
      });
    }
    if (payload.customerType === "BUSINESS" && !payload.businessRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessRole"],
        message: "Your business role is required when signing for a business.",
      });
    }
    if (payload.customerType === "BUSINESS" && !payload.businessRegistrationType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessRegistrationType"],
        message: "Business registration type is required when signing for a business.",
      });
    }
    if (payload.customerType === "BUSINESS" && !payload.businessRegistrationNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessRegistrationNumber"],
        message: "A business registration, EIN, or tax ID number is required when signing for a business.",
      });
    }
    if (payload.customerType === "BUSINESS" && !payload.incorporationCountry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["incorporationCountry"],
        message: "Incorporation country is required when signing for a business.",
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

    const result = await startCustomerContract({
      auth: req.auth,
      payload,
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
