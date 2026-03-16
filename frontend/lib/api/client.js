"use client";

import { siteConfig } from "../constants/site";
import { clearStaffSessionToken, getStaffSessionToken } from "../auth/staff-client-session";

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

export async function apiFetch(path, { method = "GET", body, token, isMultipart = false, authMode = "none" } = {}) {
  const headers = {};
  const resolvedToken = token || (authMode === "staff" ? getStaffSessionToken() : "");

  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }

  if (!isMultipart && body) {
    headers["Content-Type"] = "application/json";
  }

  beginApiActivity();

  try {
    const response = await fetch(`${siteConfig.apiUrl}${path}`, {
      method,
      headers,
      body: isMultipart ? body : body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

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

      throw new Error(data.message || "Request failed");
    }

    return data;
  } finally {
    endApiActivity();
  }
}
