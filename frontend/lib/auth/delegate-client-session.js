"use client";

const DELEGATE_SESSION_COOKIE = "eo_delegate_session";
const DELEGATE_TOKEN_STORAGE_KEY = "eo_delegate_token";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function secureCookieSuffix() {
  return window.location.protocol === "https:" ? "; Secure" : "";
}

function sharedDomainSuffix() {
  const host = window.location.hostname;
  return host === "elevenorbits.com" || host.endsWith(".elevenorbits.com") ? "; Domain=.elevenorbits.com" : "";
}

function setDelegateCookie(token) {
  document.cookie = `${DELEGATE_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax${secureCookieSuffix()}${sharedDomainSuffix()}`;
}

function clearDelegateCookie() {
  document.cookie = `${DELEGATE_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secureCookieSuffix()}`;
  if (window.location.hostname === "elevenorbits.com" || window.location.hostname.endsWith(".elevenorbits.com")) {
    document.cookie = `${DELEGATE_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secureCookieSuffix()}; Domain=.elevenorbits.com`;
  }
}

export function setDelegateSessionToken(token) {
  if (typeof window === "undefined" || !token) {
    return;
  }

  window.localStorage.setItem(DELEGATE_TOKEN_STORAGE_KEY, token);
  setDelegateCookie(token);
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
