"use client";

const STAFF_SESSION_COOKIE = "eo_staff_session";
const STAFF_TOKEN_STORAGE_KEY = "eo_staff_token";
const sevenDaysInSeconds = 7 * 24 * 60 * 60;

function buildCookieValue(token) {
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  return [
    `${STAFF_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${sevenDaysInSeconds}`,
    "SameSite=Lax",
    isHttps ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function setStaffSessionToken(token) {
  if (typeof window === "undefined" || !token) {
    return;
  }

  window.localStorage.setItem(STAFF_TOKEN_STORAGE_KEY, token);
  document.cookie = buildCookieValue(token);
}

export function getStaffSessionToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(STAFF_TOKEN_STORAGE_KEY) || "";
}

export function clearStaffSessionToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STAFF_TOKEN_STORAGE_KEY);
  document.cookie = `${STAFF_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
