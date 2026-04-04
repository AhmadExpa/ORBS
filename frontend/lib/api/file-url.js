"use client";

function normalizePossibleUrl(value) {
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) {
    return "";
  }

  if (/^(https?)\/\//i.test(trimmedValue)) {
    return trimmedValue.replace(/^(https?)\/\//i, "$1://");
  }

  if (/^\/\//.test(trimmedValue)) {
    return `https:${trimmedValue}`;
  }

  return trimmedValue;
}

function normalizeApiUrl(value) {
  const fallbackApiUrl = "https://api.account.elevenorbits.com/api/v1";
  const normalizedValue = normalizePossibleUrl(value || fallbackApiUrl)
    .replace(/:\/\/api\.accounts\.elevenorbits\.com/iu, "://api.account.elevenorbits.com")
    .replace(/\/+$/u, "");

  return /\/api\/v1$/iu.test(normalizedValue) ? normalizedValue : `${normalizedValue}/api/v1`;
}

function getPublicApiOrigin() {
  const resolvedApiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

  return resolvedApiUrl.replace(/\/api\/v1\/?$/i, "").replace(/\/+$/, "");
}

export function resolvePublicFileUrl(path) {
  const normalizedPath = normalizePossibleUrl(path);

  if (!normalizedPath) {
    return "";
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  return `${getPublicApiOrigin()}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}
