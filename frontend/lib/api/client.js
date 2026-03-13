"use client";

import { siteConfig } from "../constants/site";

export async function apiFetch(path, { method = "GET", body, token, isMultipart = false } = {}) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
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

