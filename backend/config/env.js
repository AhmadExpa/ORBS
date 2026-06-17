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
  return normalizePossibleUrl(value || "https://api.account.elevenorbits.com")
    .replace(/:\/\/api\.accounts\.elevenorbits\.com/iu, "://api.account.elevenorbits.com")
    .replace(/\/api\/v1\/?$/iu, "")
    .replace(/\/+$/u, "");
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  publicApiUrl: normalizePublicApiOrigin(process.env.PUBLIC_FILE_BASE_URL || process.env.NEXT_PUBLIC_API_URL),
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || "",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@elevenorbits.com",
  clerkSecretKey: process.env.CLERK_SECRET_KEY || "",
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
  adminBootstrapEmail: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@elevenorbits.com",
  adminBootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD || "change-me",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripeCurrency: (process.env.STRIPE_CURRENCY || "usd").toLowerCase(),
  uploadDir: resolveStorageDir(process.env.UPLOAD_DIR, "storage/uploads"),
  invoiceDir: resolveStorageDir(process.env.INVOICE_DIR, "storage/invoices"),
  storageDriver: (process.env.STORAGE_DRIVER || "").toLowerCase(),
  r2AccountId: process.env.R2_ACCOUNT_ID || "",
  r2Endpoint: process.env.R2_ENDPOINT || "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  r2Bucket: process.env.R2_BUCKET || "",
  r2PublicBaseUrl: normalizePossibleUrl(process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/u, ""),
  r2KeyPrefix: String(process.env.R2_KEY_PREFIX || "").replace(/^\/+|\/+$/g, ""),
};
