"use client";

import { siteConfig } from "../constants/site";
import { getStaffSessionToken } from "../auth/staff-client-session";

export async function apiFetch(path, { method = "GET", body, token, isMultipart = false } = {}) {
  const headers = {};
  const resolvedToken = token || getStaffSessionToken();

  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }

  if (!isMultipart && body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${siteConfig.apiUrl}${path}`, {
    method,
    headers,
    body: isMultipart ? body : body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}
