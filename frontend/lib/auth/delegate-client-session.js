"use client";

const DELEGATE_SESSION_COOKIE = "eo_delegate_session";
const DELEGATE_TOKEN_STORAGE_KEY = "eo_delegate_token";

function clearDelegateCookie() {
  document.cookie = `${DELEGATE_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function setDelegateSessionToken(token) {
  if (typeof window === "undefined" || !token) {
    return;
  }

  window.localStorage.setItem(DELEGATE_TOKEN_STORAGE_KEY, token);
}

export function getDelegateSessionToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(DELEGATE_TOKEN_STORAGE_KEY) || "";
}

export function clearDelegateSessionToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DELEGATE_TOKEN_STORAGE_KEY);
  clearDelegateCookie();
}
