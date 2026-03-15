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

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  publicApiUrl: process.env.PUBLIC_FILE_BASE_URL || "http://localhost:4000",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/elevenorbits",
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
};
