import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.resolve(backendRoot, ".env") });
dotenv.config({ path: path.resolve(backendRoot, ".env.local"), override: true });

function resolveStorageDir(relativePath, fallback) {
  if (!relativePath) {
    return path.resolve(backendRoot, fallback);
  }

  return path.isAbsolute(relativePath) ? relativePath : path.resolve(backendRoot, relativePath);
}

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

function normalizePublicApiOrigin(value) {
  return normalizePossibleUrl(value || "https://api.elevenorbits.com")
    .replace(/:\/\/api\.accounts?\.elevenorbits\.com/iu, "://api.elevenorbits.com")
    .replace(/\/api\/v1\/?$/iu, "")
    .replace(/\/+$/u, "");
}

function normalizeAppOrigin(value) {
  const fallbackAppUrl = process.env.NODE_ENV === "production" ? "https://elevenorbits.com" : "http://localhost:3000";

  return normalizePossibleUrl(value || fallbackAppUrl)
    .replace(/:\/\/account\.elevenorbits\.com/iu, "://elevenorbits.com")
    .replace(/\/+$/u, "");
}

function expandCorsOrigins(origin) {
  const origins = new Set();
  const normalizedOrigin = normalizeAppOrigin(origin);

  if (normalizedOrigin) {
    origins.add(normalizedOrigin);
  }

  try {
    const url = new URL(normalizedOrigin);
    if (url.hostname === "elevenorbits.com") {
      origins.add(`${url.protocol}//www.elevenorbits.com`);
    }
    if (url.hostname === "www.elevenorbits.com") {
      origins.add(`${url.protocol}//elevenorbits.com`);
    }
  } catch (error) {
    // Invalid origins are ignored here; the raw configured value is still omitted.
  }

  for (const item of String(process.env.CORS_ORIGINS || "").split(",")) {
    const normalized = normalizePossibleUrl(item).replace(/\/+$/u, "");
    if (normalized) {
      origins.add(normalized);
    }
  }

  return [...origins];
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  appUrl: normalizeAppOrigin(process.env.FRONTEND_URL || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL),
  corsOrigins: expandCorsOrigins(process.env.FRONTEND_URL || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL),
  backendUrl: normalizePublicApiOrigin(process.env.BACKEND_URL || process.env.PUBLIC_FILE_BASE_URL || process.env.NEXT_PUBLIC_API_URL),
  publicApiUrl: normalizePublicApiOrigin(process.env.PUBLIC_FILE_BASE_URL || process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL),
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || "",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  supportEmail: process.env.SUPPORT_EMAIL || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@elevenorbits.com",
  companyAddress: process.env.COMPANY_ADDRESS || process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "3326 Anna Gorge Dr. Valrico, FL 33596",
  notificationFromEmail: process.env.NOTIFICATION_FROM_EMAIL || process.env.SMTP_USER || "noreply@elevenorbits.com",
  notificationFromName: process.env.NOTIFICATION_FROM_NAME || "ElevenOrbits",
  smtpHost: process.env.SMTP_HOST || "mail.elevenorbits.com",
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: String(process.env.SMTP_SECURE || "true").toLowerCase() !== "false",
  smtpUser: process.env.SMTP_USER || "",
  smtpPassword: process.env.SMTP_PASSWORD || "",
  // Shared cPanel mail hosts (Namecheap) present a provider wildcard cert
  // (*.web-hosting.com) that will not match a custom mail hostname. Allow the
  // hostname check to be relaxed without disabling transport encryption.
  smtpTlsRejectUnauthorized: String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || "true").toLowerCase() !== "false",
  smtpTlsServername: process.env.SMTP_TLS_SERVERNAME || "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY || "",
  adminBootstrapEmail: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@elevenorbits.com",
  adminBootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD || "change-me",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripeCurrency: (process.env.STRIPE_CURRENCY || "usd").toLowerCase(),
  internalCronSecret: process.env.INTERNAL_CRON_SECRET || "",
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || "",
  turnstileExpectedAction: process.env.TURNSTILE_EXPECTED_ACTION || "contract_start",
  turnstileAllowedHostnames: String(
    process.env.TURNSTILE_ALLOWED_HOSTNAMES ||
      (process.env.NODE_ENV === "production"
        ? "elevenorbits.com,www.elevenorbits.com"
        : "elevenorbits.com,www.elevenorbits.com,localhost,127.0.0.1"),
  )
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
  documensoApiUrl: normalizePossibleUrl(process.env.DOCUMENSO_API_URL || "https://app.documenso.com/api/v2").replace(/\/+$/u, ""),
  documensoApiToken: process.env.DOCUMENSO_API_TOKEN || "",
  documensoTemplateId: process.env.DOCUMENSO_TEMPLATE_ID || "",
  documensoTemplateRecipientId: process.env.DOCUMENSO_TEMPLATE_RECIPIENT_ID || "",
  documensoWebhookSecret: process.env.DOCUMENSO_WEBHOOK_SECRET || "",
  documensoAgreementVersion: process.env.DOCUMENSO_AGREEMENT_VERSION || "1.0",
  contractSyncIntervalMs: Number(process.env.CONTRACT_SYNC_INTERVAL_MS || 5 * 60 * 1000),
  contractStartRateLimitMax: Number(process.env.CONTRACT_START_RATE_LIMIT_MAX || 5),
  contractSyncRateLimitMax: Number(process.env.CONTRACT_SYNC_RATE_LIMIT_MAX || 15),
  uploadDir: resolveStorageDir(process.env.UPLOAD_DIR, "storage/uploads"),
  invoiceDir: resolveStorageDir(process.env.INVOICE_DIR, "storage/invoices"),
  storageDriver: (process.env.STORAGE_DRIVER || "").toLowerCase(),
  r2AccountId: process.env.R2_ACCOUNT_ID || "",
  r2Region: process.env.R2_REGION || "auto",
  r2Endpoint: process.env.R2_ENDPOINT || "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  r2Bucket: process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "",
  r2PublicBaseUrl: normalizePossibleUrl(process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/u, ""),
  r2KeyPrefix: String(process.env.R2_KEY_PREFIX || "").replace(/^\/+|\/+$/g, ""),
};
