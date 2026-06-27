import crypto from "crypto";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const tokenTtlMs = 5 * 60 * 1000;
const usedTokenHashes = new Map();

function tokenHash(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function pruneUsedTokens(now = Date.now()) {
  for (const [hash, timestamp] of usedTokenHashes.entries()) {
    if (now - timestamp > tokenTtlMs) {
      usedTokenHashes.delete(hash);
    }
  }
}

function assertHostname(hostname) {
  const normalized = String(hostname || "").toLowerCase();
  if (!normalized || !env.turnstileAllowedHostnames.includes(normalized)) {
    throw new HttpError(400, "Turnstile verification failed.", {
      code: "TURNSTILE_HOSTNAME_INVALID",
    });
  }
}

function assertAction(action, expectedAction) {
  if (!expectedAction) {
    return;
  }

  if (String(action || "") !== expectedAction) {
    throw new HttpError(400, "Turnstile verification failed.", {
      code: "TURNSTILE_ACTION_INVALID",
    });
  }
}

function assertFreshChallenge(challengeTs) {
  if (!challengeTs) {
    throw new HttpError(400, "Turnstile verification failed.", {
      code: "TURNSTILE_TIMESTAMP_MISSING",
    });
  }

  const issuedAt = new Date(challengeTs).getTime();
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > tokenTtlMs) {
    throw new HttpError(400, "Turnstile verification failed.", {
      code: "TURNSTILE_TOKEN_EXPIRED",
    });
  }
}

export function resetTurnstileReplayCacheForTests() {
  usedTokenHashes.clear();
}

export async function verifyTurnstileToken({ token, remoteIp, expectedAction = env.turnstileExpectedAction }) {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) {
    throw new HttpError(400, "Turnstile verification token is required.", {
      code: "TURNSTILE_TOKEN_REQUIRED",
    });
  }

  if (!env.turnstileSecretKey) {
    throw new HttpError(500, "Turnstile is not configured.");
  }

  pruneUsedTokens();
  const hash = tokenHash(normalizedToken);
  if (usedTokenHashes.has(hash)) {
    throw new HttpError(400, "Turnstile verification failed.", {
      code: "TURNSTILE_TOKEN_REUSED",
    });
  }

  const form = new URLSearchParams();
  form.set("secret", env.turnstileSecretKey);
  form.set("response", normalizedToken);
  if (remoteIp) {
    form.set("remoteip", remoteIp);
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    body: form,
  });

  const result = await response.json().catch(() => null);
  usedTokenHashes.set(hash, Date.now());

  if (!response.ok || !result?.success) {
    throw new HttpError(400, "Turnstile verification failed.", {
      code: "TURNSTILE_VERIFICATION_FAILED",
    });
  }

  assertHostname(result.hostname);
  if (expectedAction) {
    assertAction(result.action, expectedAction);
  }
  assertFreshChallenge(result.challenge_ts);

  return {
    verifiedAt: new Date(),
    hostname: result.hostname,
    action: result.action || "",
  };
}
