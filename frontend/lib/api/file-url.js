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

function getPublicApiOrigin() {
  const configuredApiUrl = normalizePossibleUrl(process.env.NEXT_PUBLIC_API_URL || "");
  const fallbackApiUrl = "http://localhost:4000";
  const resolvedApiUrl = configuredApiUrl || fallbackApiUrl;

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
