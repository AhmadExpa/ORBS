import express from "express";
import { rateLimit } from "../../middleware/rate-limit.js";
import { createContactSubmission } from "../../services/contact-submission-service.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const contactSubmissionsRouter = express.Router();

function getClientIp(req) {
  const cfConnectingIp = String(req.headers["cf-connecting-ip"] || "").trim();
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",")[0]?.trim();
  return forwardedFor || req.ip || "";
}

const contactSubmissionRateLimit = rateLimit({
  name: "contact-submissions",
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyFn: getClientIp,
});

contactSubmissionsRouter.post(
  "/",
  contactSubmissionRateLimit,
  asyncHandler(async (req, res) => {
    const submission = await createContactSubmission({
      payload: req.body,
      requestMeta: {
        ipAddress: getClientIp(req),
        userAgent: String(req.headers["user-agent"] || "").slice(0, 500),
      },
    });

    res.status(201).json({
      submission: {
        id: String(submission._id),
        status: submission.status,
      },
    });
  }),
);
