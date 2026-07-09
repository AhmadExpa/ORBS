import crypto from "crypto";
import express from "express";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { extractDocumentFieldValues, getDocumensoWebhookSignature } from "../../services/documenso-service.js";
import { handleDocumensoWebhook } from "../../services/contract-service.js";

export const documensoWebhookRouter = express.Router();

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

function validWebhookSignature(rawBody, headers) {
  if (!env.documensoWebhookSecret) {
    return false;
  }

  const signature = getDocumensoWebhookSignature(headers);
  const directSecret = String(headers["x-documenso-secret"] || headers["documenso-secret"] || "").trim();
  const hmacHex = crypto.createHmac("sha256", env.documensoWebhookSecret).update(rawBody).digest("hex");
  const hmacBase64 = crypto.createHmac("sha256", env.documensoWebhookSecret).update(rawBody).digest("base64");

  return (
    timingSafeEqual(signature, hmacHex) ||
    timingSafeEqual(signature, hmacBase64) ||
    timingSafeEqual(signature, env.documensoWebhookSecret) ||
    timingSafeEqual(directSecret, env.documensoWebhookSecret)
  );
}

function extractWebhookFields(payload, rawBody) {
  const eventType = String(payload?.event || payload?.type || payload?.eventType || payload?.data?.event || payload?.data?.type || "");
  const eventId = String(
    payload?.id ||
      payload?.eventId ||
      payload?.event_id ||
      payload?.data?.id ||
      payload?.data?.eventId ||
      crypto.createHash("sha256").update(rawBody).digest("hex"),
  );
  const documentId = String(
    payload?.documentId ||
      payload?.document_id ||
      payload?.document?.id ||
      payload?.envelopeId ||
      payload?.envelope_id ||
      payload?.data?.documentId ||
      payload?.data?.document_id ||
      payload?.data?.document?.id ||
      payload?.data?.envelopeId ||
      payload?.data?.envelope_id ||
      payload?.data?.id ||
      "",
  );
  const status = String(
    payload?.status ||
      payload?.documentStatus ||
      payload?.document_status ||
      payload?.document?.status ||
      payload?.data?.status ||
      payload?.data?.document?.status ||
      "",
  );
  const completedAt = String(
    payload?.completedAt ||
      payload?.completed_at ||
      payload?.document?.completedAt ||
      payload?.document?.completed_at ||
      payload?.data?.completedAt ||
      payload?.data?.completed_at ||
      payload?.data?.document?.completedAt ||
      payload?.data?.document?.completed_at ||
      "",
  );

  return {
    eventId,
    eventType,
    documentId,
    status,
    completedAt: completedAt || null,
    fieldValues: extractDocumentFieldValues(payload),
  };
}

documensoWebhookRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    if (!validWebhookSignature(rawBody, req.headers)) {
      throw new HttpError(401, "Invalid Documenso webhook signature.");
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString("utf8") || "{}");
    } catch (error) {
      throw new HttpError(400, "Invalid Documenso webhook JSON payload.");
    }
    const fields = extractWebhookFields(payload, rawBody);
    const result = await handleDocumensoWebhook(fields);
    res.json({ received: true, ...result });
  }),
);
