import { z } from "zod";
import { ContactSubmission } from "../db/models/index.js";
import { verifyTurnstileToken } from "./turnstile-service.js";

export const CONTACT_SUBMISSION_DEPARTMENTS = ["general", "sales", "support", "billing", "security"];
export const CONTACT_SUBMISSION_STATUSES = ["new", "reviewing", "responded", "closed"];
export const CONTACT_FORM_TURNSTILE_ACTION = "contact_form";

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  company: z.string().trim().max(160).optional().default(""),
  phone: z.string().trim().max(80).optional().default(""),
  department: z.enum(CONTACT_SUBMISSION_DEPARTMENTS).optional().default("general"),
  serviceInterest: z.string().trim().max(120).optional().default(""),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(10).max(4000),
  turnstileToken: z.string().trim().min(1),
});

export const contactSubmissionUpdateSchema = z
  .object({
    status: z.enum(CONTACT_SUBMISSION_STATUSES).optional(),
    adminNotes: z.string().trim().max(4000).optional(),
  })
  .refine((payload) => payload.status !== undefined || payload.adminNotes !== undefined, {
    message: "A status or admin note update is required.",
  });

export function normalizeContactSubmissionPayload(payload) {
  const parsed = contactSubmissionSchema.parse(payload);

  return {
    ...parsed,
    email: parsed.email.toLowerCase(),
  };
}

export function buildContactSubmissionDocument({ payload, turnstile, requestMeta = {} }) {
  const { turnstileToken, ...submission } = normalizeContactSubmissionPayload(payload);

  return {
    ...submission,
    ipAddress: requestMeta.ipAddress || "",
    userAgent: requestMeta.userAgent || "",
    turnstileVerifiedAt: turnstile?.verifiedAt || null,
    turnstileHostname: turnstile?.hostname || "",
    turnstileAction: turnstile?.action || "",
    metadata: {
      source: "contact_page",
    },
  };
}

export async function createContactSubmission({ payload, requestMeta = {} }) {
  const normalized = normalizeContactSubmissionPayload(payload);
  const turnstile = await verifyTurnstileToken({
    token: normalized.turnstileToken,
    remoteIp: requestMeta.ipAddress,
    expectedAction: CONTACT_FORM_TURNSTILE_ACTION,
  });

  return ContactSubmission.create(
    buildContactSubmissionDocument({
      payload: normalized,
      turnstile,
      requestMeta,
    }),
  );
}
