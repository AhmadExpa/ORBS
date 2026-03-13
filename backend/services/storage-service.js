import fs from "fs";
import path from "path";
import { env } from "../config/env.js";

function ensureDirectory(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
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
  return `${env.publicApiUrl}${relativePath.startsWith("/") ? relativePath : `/${relativePath}`}`;
}

export function writeBufferToFile(filePath, data) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, data);
}

