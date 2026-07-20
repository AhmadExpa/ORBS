function isElevenOrbitsHost(hostname) {
  const normalizedHostname = String(hostname || "").toLowerCase();
  return normalizedHostname === "elevenorbits.com" || normalizedHostname.endsWith(".elevenorbits.com");
}

/**
 * Keep browser API traffic on the same origin in production. Vercel proxies
 * /api/v1 to the API service, avoiding client-side DNS, CORS, and ISP issues
 * on the separate api.elevenorbits.com hostname.
 */
export function resolveApiBaseUrl(configuredApiUrl, browserOrigin = "") {
  if (!browserOrigin) {
    return configuredApiUrl;
  }

  try {
    const browserUrl = new URL(browserOrigin);
    const apiUrl = new URL(configuredApiUrl, browserUrl);

    if (isElevenOrbitsHost(browserUrl.hostname) && apiUrl.hostname === "api.elevenorbits.com") {
      return apiUrl.pathname.replace(/\/+$/u, "") || "/api/v1";
    }
  } catch {
    // Retain the configured URL if either value is malformed.
  }

  return configuredApiUrl;
}

