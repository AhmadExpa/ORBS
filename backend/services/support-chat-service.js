import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { SupportTicket } from "../db/models/index.js";
import { HttpError } from "../utils/http-error.js";

const SUPPORT_PIN_SESSION_PURPOSE = "support_pin_verified";
const SUPPORT_PIN_SESSION_TTL = "15m";

function normalizedCustomerIdentity(user) {
  return `${String(user?._id || "").trim()}:${String(user?.clerkId || "").trim()}`;
}

function hmac(value) {
  return crypto
    .createHmac("sha256", env.supportPinSecret)
    .update(String(value))
    .digest();
}

function safeBufferEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function getCustomerSupportPin(user) {
  const identity = normalizedCustomerIdentity(user);
  if (identity === ":") {
    throw new HttpError(400, "Customer identity is required to create a support PIN.");
  }

  const value = hmac(`support-pin:v1:${identity}`).readUInt32BE(0) % 1_000_000;
  return String(value).padStart(6, "0");
}

export function isCustomerSupportPinValid(user, value) {
  const candidate = String(value || "").trim();
  if (!/^\d{6}$/u.test(candidate)) {
    return false;
  }

  return safeBufferEqual(candidate, getCustomerSupportPin(user));
}

export function createSupportPinSession(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      clerkId: String(user.clerkId || ""),
      purpose: SUPPORT_PIN_SESSION_PURPOSE,
    },
    env.supportPinSecret,
    { expiresIn: SUPPORT_PIN_SESSION_TTL },
  );
}

export function verifySupportPinSession(token, user) {
  let payload;
  try {
    payload = jwt.verify(String(token || ""), env.supportPinSecret);
  } catch {
    throw new HttpError(401, "Your support verification expired. Enter your Support PIN again.");
  }

  if (
    payload?.purpose !== SUPPORT_PIN_SESSION_PURPOSE ||
    String(payload?.sub || "") !== String(user?._id || "") ||
    String(payload?.clerkId || "") !== String(user?.clerkId || "")
  ) {
    throw new HttpError(401, "Your support verification is invalid. Enter your Support PIN again.");
  }

  return payload;
}

export function createSupportVerificationCode() {
  return String(crypto.randomInt(100_000, 1_000_000));
}

export function hashSupportVerificationCode({ ticketNumber, email, code }) {
  return hmac(
    `support-email:v1:${String(ticketNumber || "").trim().toUpperCase()}:${String(email || "").trim().toLowerCase()}:${String(code || "").trim()}`,
  ).toString("hex");
}

export function isSupportVerificationCodeValid({ ticketNumber, email, code, expectedHash }) {
  if (!/^\d{6}$/u.test(String(code || "").trim()) || !expectedHash) {
    return false;
  }

  return safeBufferEqual(
    hashSupportVerificationCode({ ticketNumber, email, code }),
    expectedHash,
  );
}

export function createSupportTicketNumber(date = new Date(), entropy = crypto.randomBytes(3).toString("hex")) {
  const day = date.toISOString().slice(0, 10).replace(/-/gu, "");
  const suffix = String(entropy || "").replace(/[^a-z0-9]/giu, "").slice(0, 6).toUpperCase().padEnd(6, "0");
  return `EO-${day}-${suffix}`;
}

export async function reserveSupportTicketNumber() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const ticketNumber = createSupportTicketNumber();
    const existing = await SupportTicket.findOne({ ticketNumber });
    if (!existing) {
      return ticketNumber;
    }
  }

  throw new HttpError(503, "A support ticket number could not be reserved. Please try again.");
}

export function createSupportTicketSubject(value) {
  const normalized = String(value || "").replace(/\s+/gu, " ").trim();
  if (!normalized) {
    return "Website support request";
  }

  return normalized.length > 90 ? `${normalized.slice(0, 87).trimEnd()}...` : normalized;
}

export function buildCustomerSupportRequester(user) {
  return {
    customerId: String(user?._id || ""),
    clerkId: String(user?.clerkId || ""),
    name: String(user?.name || "").trim(),
    email: String(user?.email || "").trim().toLowerCase(),
    phone: String(user?.phone || "").trim(),
    company: String(user?.company || "").trim(),
    accountStatus: String(user?.accountStatus || "active"),
    address: String(user?.address || "").trim(),
    billingCountry: String(user?.billingAddress?.country || "").trim().toUpperCase(),
  };
}
