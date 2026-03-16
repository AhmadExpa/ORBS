"use client";

const STAFF_SESSION_COOKIE = "eo_staff_session";
const STAFF_TOKEN_STORAGE_KEY = "eo_staff_token";

function clearLegacyStaffCookie() {
  document.cookie = `${STAFF_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function setStaffSessionToken(token) {
  if (typeof window === "undefined" || !token) {
    return;
  }

  window.localStorage.setItem(STAFF_TOKEN_STORAGE_KEY, token);
  clearLegacyStaffCookie();
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
  clearLegacyStaffCookie();
}
