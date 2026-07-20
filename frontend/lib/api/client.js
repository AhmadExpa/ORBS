"use client";

import { siteConfig } from "../constants/site";
import { clearDelegateSessionToken, getDelegateSessionToken } from "../auth/delegate-client-session";
import { clearStaffSessionToken, getStaffSessionToken } from "../auth/staff-client-session";
import { resolveApiBaseUrl } from "./request-url";

let pendingRequestCount = 0;
const apiActivityListeners = new Set();

function emitApiActivity() {
  apiActivityListeners.forEach((listener) => listener(pendingRequestCount));
}

export function subscribeToApiActivity(listener) {
  apiActivityListeners.add(listener);
  listener(pendingRequestCount);

  return () => {
    apiActivityListeners.delete(listener);
  };
}

function beginApiActivity() {
  pendingRequestCount += 1;
  emitApiActivity();
}

function endApiActivity() {
  pendingRequestCount = Math.max(0, pendingRequestCount - 1);
  emitApiActivity();
}

export async function apiFetch(path, { method = "GET", body, token, isMultipart = false, authMode = "none", trackActivity } = {}) {
  const headers = {};
  const resolvedToken =
    token ||
    (authMode === "staff" ? getStaffSessionToken() : "") ||
    (authMode === "delegate" ? getDelegateSessionToken() : "");
  const resolvedMethod = method.toUpperCase();
  const shouldTrackActivity = trackActivity ?? resolvedMethod !== "GET";

  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }

  if (!isMultipart && body) {
    headers["Content-Type"] = "application/json";
  }

  if (shouldTrackActivity) {
    beginApiActivity();
  }

  try {
    const browserOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const apiBaseUrl = resolveApiBaseUrl(siteConfig.apiUrl, browserOrigin);
    let response;

    try {
      response = await fetch(`${apiBaseUrl}${path}`, {
        method: resolvedMethod,
        headers,
        body: isMultipart ? body : body ? JSON.stringify(body) : undefined,
        credentials: "include",
      });
    } catch (error) {
      const networkError = new Error(
        path.startsWith("/stripe/") && resolvedMethod !== "GET"
          ? "The payment connection was interrupted. Check Payment Activity before trying again so you do not submit the same payment twice."
          : "ElevenOrbits could not be reached. Check your connection and try again.",
      );
      networkError.code = "NETWORK_ERROR";
      networkError.cause = error;
      throw networkError;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (
        authMode === "staff" &&
        response.status === 401 &&
        typeof window !== "undefined" &&
        (data.message === "Staff session is invalid." || data.message === "Staff authentication required.")
      ) {
        clearStaffSessionToken();

        if (window.location.pathname.startsWith("/eo-admin") && window.location.pathname !== "/eo-admin/login") {
          window.location.replace("/eo-admin/login");
        }

        throw new Error("Your admin session expired. Please sign in again.");
      }

      if (
        authMode === "delegate" &&
        response.status === 401 &&
        typeof window !== "undefined" &&
        (data.message === "Agent session is invalid." ||
          data.message === "Agent authentication required." ||
          data.message === "Portal authentication required.")
      ) {
        clearDelegateSessionToken();

        if (window.location.pathname.startsWith("/agent")) {
          window.location.replace("/agent/login");
        } else if (window.location.pathname.startsWith("/portal")) {
          window.location.replace("/login");
        }

        throw new Error("Your agent session expired. Please sign in again.");
      }

      const error = new Error(data.message || "Request failed");
      error.code = data.code;
      error.contractStatus = data.contractStatus;
      error.redirectUrl = data.redirectUrl;
      error.details = data.details;
      throw error;
    }

    return data;
  } finally {
    if (shouldTrackActivity) {
      endApiActivity();
    }
  }
}
