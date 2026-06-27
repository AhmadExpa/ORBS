import crypto from "crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

let contractR2Client = null;

function getR2Endpoint() {
  return env.r2Endpoint || (env.r2AccountId ? `https://${env.r2AccountId}.r2.cloudflarestorage.com` : "");
}

function assertR2Configured() {
  if (!env.r2Bucket || !env.r2AccessKeyId || !env.r2SecretAccessKey || !getR2Endpoint()) {
    throw new HttpError(500, "Private contract storage is not configured.");
  }

  try {
    const endpoint = new URL(getR2Endpoint());
    if (endpoint.pathname && endpoint.pathname !== "/") {
      throw new HttpError(500, "R2_ENDPOINT must be the account endpoint only and must not include the bucket name.");
    }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(500, "R2_ENDPOINT is invalid.");
  }
}

export function getContractR2Client() {
  assertR2Configured();
  if (contractR2Client) {
    return contractR2Client;
  }

  contractR2Client = new S3Client({
    region: env.r2Region || "auto",
    endpoint: getR2Endpoint(),
    credentials: {
      accessKeyId: env.r2AccessKeyId,
      secretAccessKey: env.r2SecretAccessKey,
    },
    forcePathStyle: true,
  });

  return contractR2Client;
}

export function assertPdfBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 5 || buffer.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw new HttpError(502, "Downloaded contract file was not a valid PDF.");
  }
}

export function calculateSha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sanitizeMetadataValue(value) {
  return String(value || "").replace(/[^\x20-\x7E]/g, "").slice(0, 500);
}

function contractBaseKey(contract) {
  const clerkUserId = String(contract.clerkUserId || "").replace(/[^a-zA-Z0-9_-]/g, "_");
  const contractId = String(contract._id || contract.id || "").replace(/[^a-zA-Z0-9_-]/g, "_");
  if (!clerkUserId || !contractId) {
    throw new HttpError(500, "Contract storage key could not be generated.");
  }

  return `contracts/${clerkUserId}/${contractId}`;
}

function buildMetadata(contract, extra = {}) {
  return Object.fromEntries(
    Object.entries({
      contractNumber: contract.contractNumber,
      agreementVersion: contract.templateVersion,
      ...extra,
    }).map(([key, value]) => [key, sanitizeMetadataValue(value)]),
  );
}

export function buildContractStorageKeys(contract) {
  const baseKey = contractBaseKey(contract);
  return {
    signedPdfKey: `${baseKey}/signed-agreement-v${contract.templateVersion}.pdf`,
    auditCertificateKey: `${baseKey}/audit-certificate.pdf`,
    evidenceKey: `${baseKey}/signing-evidence.json`,
  };
}

export async function uploadContractObject({ key, body, contentType, metadata = {} }) {
  assertR2Configured();
  await getContractR2Client().send(
    new PutObjectCommand({
      Bucket: env.r2Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "private, max-age=0, no-store",
      Metadata: Object.fromEntries(
        Object.entries(metadata)
          .filter(([, value]) => value !== undefined && value !== null && String(value) !== "")
          .map(([keyName, value]) => [keyName.replace(/[^a-zA-Z0-9-]/g, "-"), sanitizeMetadataValue(value)]),
      ),
    }),
  );
}

export async function deleteContractObjectForTests(key) {
  assertR2Configured();
  await getContractR2Client().send(
    new DeleteObjectCommand({
      Bucket: env.r2Bucket,
      Key: key,
    }),
  );
}

export async function createPresignedContractDownloadUrl({ key, fileName, expiresIn = 300 }) {
  assertR2Configured();
  if (!key || !String(key).startsWith("contracts/")) {
    throw new HttpError(404, "Contract file is not available.");
  }

  return getSignedUrl(
    getContractR2Client(),
    new GetObjectCommand({
      Bucket: env.r2Bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${String(fileName || "contract.pdf").replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
    }),
    { expiresIn },
  );
}

export async function storeCompletedContractFiles({ contract, signedPdfBuffer, auditCertificateBuffer }) {
  assertPdfBuffer(signedPdfBuffer);
  if (auditCertificateBuffer) {
    assertPdfBuffer(auditCertificateBuffer);
  }

  const sha256 = calculateSha256(signedPdfBuffer);
  const keys = buildContractStorageKeys(contract);
  const metadata = buildMetadata(contract, { sha256 });
  const storedAt = new Date();

  await uploadContractObject({
    key: keys.signedPdfKey,
    body: signedPdfBuffer,
    contentType: "application/pdf",
    metadata,
  });

  if (auditCertificateBuffer) {
    await uploadContractObject({
      key: keys.auditCertificateKey,
      body: auditCertificateBuffer,
      contentType: "application/pdf",
      metadata,
    });
  }

  const evidence = {
    contractNumber: contract.contractNumber,
    clerkUserId: contract.clerkUserId,
    documensoDocumentId: String(contract.documensoDocumentId || ""),
    templateVersion: contract.templateVersion,
    signedAt: contract.signedAt ? new Date(contract.signedAt).toISOString() : storedAt.toISOString(),
    storedAt: storedAt.toISOString(),
    sha256,
  };

  await uploadContractObject({
    key: keys.evidenceKey,
    body: Buffer.from(JSON.stringify(evidence, null, 2)),
    contentType: "application/json",
    metadata,
  });

  return {
    ...keys,
    auditCertificateKey: auditCertificateBuffer ? keys.auditCertificateKey : "",
    sha256,
    storedAt,
  };
}
