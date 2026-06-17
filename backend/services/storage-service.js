import fs from "fs";
import path from "path";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

let r2Client = null;

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

function getR2Endpoint() {
  return env.r2Endpoint || (env.r2AccountId ? `https://${env.r2AccountId}.r2.cloudflarestorage.com` : "");
}

function getR2Client() {
  if (r2Client) {
    return r2Client;
  }

  r2Client = new S3Client({
    region: "auto",
    endpoint: getR2Endpoint(),
    credentials: {
      accessKeyId: env.r2AccessKeyId,
      secretAccessKey: env.r2SecretAccessKey,
    },
    forcePathStyle: true,
  });

  return r2Client;
}

function getContentDisposition(fileName, disposition = "attachment") {
  if (!fileName) {
    return disposition;
  }

  const asciiName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${disposition}; filename="${asciiName}"`;
}

export function isObjectStorageEnabled() {
  const wantsR2 = env.storageDriver === "r2" || Boolean(env.r2Bucket);
  return Boolean(
    wantsR2 &&
      env.r2Bucket &&
      env.r2AccessKeyId &&
      env.r2SecretAccessKey &&
      (env.r2Endpoint || env.r2AccountId),
  );
}

export function normalizeObjectKey(key) {
  const cleanKey = String(key || "")
    .replace(/^\/+/g, "")
    .replace(/\/{2,}/g, "/");

  if (!env.r2KeyPrefix) {
    return cleanKey;
  }

  if (cleanKey === env.r2KeyPrefix || cleanKey.startsWith(`${env.r2KeyPrefix}/`)) {
    return cleanKey;
  }

  return `${env.r2KeyPrefix}/${cleanKey}`;
}

export function toPublicObjectUrl(key) {
  if (!env.r2PublicBaseUrl) {
    return "";
  }

  const publicOrigin = normalizePossibleUrl(env.r2PublicBaseUrl).replace(/\/+$/u, "");
  return `${publicOrigin}/${normalizeObjectKey(key)}`;
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

export async function uploadBufferToStorage({ key, data, contentType = "application/octet-stream" }) {
  if (!isObjectStorageEnabled()) {
    return null;
  }

  const storageKey = normalizeObjectKey(key);
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: env.r2Bucket,
      Key: storageKey,
      Body: data,
      ContentType: contentType,
      CacheControl: "private, max-age=0, no-store",
    }),
  );

  return {
    storageProvider: "r2",
    storageKey,
    publicUrl: toPublicObjectUrl(storageKey),
  };
}

export async function uploadLocalFileToStorage({ filePath, key, contentType }) {
  const data = fs.readFileSync(filePath);
  return uploadBufferToStorage({ key, data, contentType });
}

export async function persistUploadedFile({ file, directory }) {
  if (!file?.filename) {
    return "";
  }

  const localUrl = `/files/uploads/${directory}/${file.filename}`;

  try {
    const uploadedFile = await uploadLocalFileToStorage({
      filePath: file.path,
      key: `uploads/${directory}/${file.filename}`,
      contentType: file.mimetype,
    });

    return uploadedFile?.publicUrl || localUrl;
  } catch (error) {
    console.error("Uploaded file object storage sync failed", error);
    return localUrl;
  }
}

export async function storageObjectExists(key) {
  if (!isObjectStorageEnabled() || !key) {
    return false;
  }

  try {
    await getR2Client().send(
      new HeadObjectCommand({
        Bucket: env.r2Bucket,
        Key: normalizeObjectKey(key),
      }),
    );
    return true;
  } catch (error) {
    const statusCode = error?.$metadata?.httpStatusCode;
    if (statusCode === 404 || error?.name === "NotFound") {
      return false;
    }

    throw error;
  }
}

export async function getStorageObject(key) {
  if (!isObjectStorageEnabled() || !key) {
    return null;
  }

  return getR2Client().send(
    new GetObjectCommand({
      Bucket: env.r2Bucket,
      Key: normalizeObjectKey(key),
    }),
  );
}

export async function streamStorageObjectToResponse({
  key,
  res,
  contentType = "application/octet-stream",
  fileName,
  disposition = "attachment",
}) {
  const object = await getStorageObject(key);
  if (!object?.Body) {
    return false;
  }

  res.setHeader("Content-Type", object.ContentType || contentType);
  res.setHeader("Content-Disposition", getContentDisposition(fileName, disposition));
  if (object.ContentLength) {
    res.setHeader("Content-Length", String(object.ContentLength));
  }

  if (typeof object.Body.pipe === "function") {
    object.Body.pipe(res);
    return true;
  }

  const bytes = await object.Body.transformToByteArray();
  res.end(Buffer.from(bytes));
  return true;
}
