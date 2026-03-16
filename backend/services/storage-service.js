import fs from "fs";
import path from "path";
import { env } from "../config/env.js";

function ensureDirectory(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
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

export function getUploadPaths() {
  const qrCodeDir = path.join(env.uploadDir, "qr-codes");
  const paymentProofDir = path.join(env.uploadDir, "payment-proofs");
  const supportAttachmentDir = path.join(env.uploadDir, "support-attachments");

  [env.uploadDir, env.invoiceDir, qrCodeDir, paymentProofDir, supportAttachmentDir].forEach(ensureDirectory);

  return {
    qrCodeDir,
    paymentProofDir,
    supportAttachmentDir,
  };
}

export function toPublicFileUrl(relativePath) {
  const normalizedPath = normalizePossibleUrl(relativePath);

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  const publicOrigin = normalizePossibleUrl(env.publicApiUrl || "http://localhost:4000").replace(/\/+$/, "");
  return `${publicOrigin}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}

export function writeBufferToFile(filePath, data) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, data);
}
