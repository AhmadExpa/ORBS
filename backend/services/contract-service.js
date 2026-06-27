import crypto from "crypto";
import { env } from "../config/env.js";
import { ContractWebhookEvent, CustomerContract } from "../db/models/index.js";
import { query } from "../db/postgres-client.js";
import { withTransaction } from "../db/postgres-model.js";
import { normalizeDocumensoStatus } from "./documenso-service.js";
import {
  createDocumentFromTemplate,
  downloadAuditCertificate,
  downloadCompletedDocument,
  ensureDocumentDistributedForSigning,
  getDocumentStatus,
  getRecipientSigningUrl,
} from "./documenso-service.js";
import {
  createPresignedContractDownloadUrl,
  storeCompletedContractFiles,
} from "./contract-storage-service.js";
import { getClerkAccountIdentity } from "./customer-profile-service.js";
import { recordActivity } from "./activity-log-service.js";
import { HttpError } from "../utils/http-error.js";

export const CONTRACT_STATUSES = [
  "NOT_STARTED",
  "TURNSTILE_REQUIRED",
  "READY_TO_SIGN",
  "PENDING_SIGNATURE",
  "SIGNED_PENDING_STORAGE",
  "SIGNED_PENDING_ADMIN",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "SUPERSEDED",
];

const TERMINAL_CONTRACT_STATUSES = ["REJECTED", "CANCELLED", "EXPIRED", "SUPERSEDED"];
const ACTIVE_CONTRACT_STATUSES = CONTRACT_STATUSES.filter((status) => status !== "NOT_STARTED" && !TERMINAL_CONTRACT_STATUSES.includes(status));
const storageLockTtlMs = 10 * 60 * 1000;
let contractSyncTimer = null;
let contractSyncInFlight = false;

const transitionRules = {
  NOT_STARTED: new Set(["TURNSTILE_REQUIRED"]),
  TURNSTILE_REQUIRED: new Set(["READY_TO_SIGN", "CANCELLED", "EXPIRED"]),
  READY_TO_SIGN: new Set(["PENDING_SIGNATURE", "CANCELLED", "EXPIRED"]),
  PENDING_SIGNATURE: new Set(["SIGNED_PENDING_STORAGE", "REJECTED", "CANCELLED", "EXPIRED"]),
  SIGNED_PENDING_STORAGE: new Set(["SIGNED_PENDING_ADMIN", "CANCELLED", "EXPIRED"]),
  SIGNED_PENDING_ADMIN: new Set(["APPROVED", "REJECTED"]),
  APPROVED: new Set(["SUPERSEDED"]),
  REJECTED: new Set([]),
  CANCELLED: new Set([]),
  EXPIRED: new Set([]),
  SUPERSEDED: new Set([]),
};

function assertValidStatus(status) {
  if (!CONTRACT_STATUSES.includes(status)) {
    throw new HttpError(500, `Invalid contract status: ${status}`);
  }
}

function assertTransition(fromStatus, toStatus, { actorRole = "system" } = {}) {
  assertValidStatus(fromStatus);
  assertValidStatus(toStatus);

  if (!transitionRules[fromStatus]?.has(toStatus)) {
    throw new HttpError(409, `Contract cannot transition from ${fromStatus} to ${toStatus}.`);
  }

  if (toStatus === "APPROVED" && actorRole !== "admin") {
    throw new HttpError(403, "Only an administrator can make this contract decision.");
  }

  if (fromStatus === "SIGNED_PENDING_ADMIN" && toStatus === "REJECTED" && actorRole !== "admin") {
    throw new HttpError(403, "Only an administrator can make this contract decision.");
  }
}

function normalizeContractForResponse(contract) {
  if (!contract) {
    return null;
  }

  return {
    ...(contract.toJSON?.() || contract),
    id: contract._id,
  };
}

function getRequiredTemplateId() {
  if (!env.documensoTemplateId || !env.documensoTemplateRecipientId) {
    throw new HttpError(500, "Documenso template configuration is incomplete.");
  }

  return {
    templateId: env.documensoTemplateId,
    templateRecipientId: env.documensoTemplateRecipientId,
    templateVersion: env.documensoAgreementVersion,
  };
}

function redirectUrlForContract(contractId) {
  return `${env.appUrl}/portal/contracts/${encodeURIComponent(String(contractId))}/complete`;
}

function getContractNumberParts(date = new Date()) {
  return {
    year: date.getUTCFullYear(),
    counterKey: `EO-MSA-${date.getUTCFullYear()}`,
  };
}

async function nextContractNumber() {
  const { year, counterKey } = getContractNumberParts();
  const result = await query(
    `
      INSERT INTO eo_documents (collection, id, data, created_at, updated_at)
      VALUES ('contract_counters', $1, jsonb_build_object('key', $1::text, 'year', $2::int, 'sequence', 1), now(), now())
      ON CONFLICT (collection, id)
      DO UPDATE SET
        data = jsonb_set(eo_documents.data, '{sequence}', to_jsonb(((eo_documents.data->>'sequence')::int + 1)), true),
        updated_at = now()
      RETURNING (data->>'sequence')::int AS sequence
    `,
    [counterKey, year],
  );
  const sequence = Number(result.rows[0]?.sequence || 0);
  return `EO-MSA-${year}-${String(sequence).padStart(6, "0")}`;
}

async function insertContract(data) {
  const id = crypto.randomUUID();
  const now = new Date();
  const storedData = JSON.stringify(data);
  await query(
    `
      INSERT INTO eo_documents (collection, id, data, created_at, updated_at)
      VALUES ('customer_contracts', $1, $2::jsonb, $3, $3)
    `,
    [id, storedData, now],
  );
  return CustomerContract.findById(id);
}

async function supersedeOutdatedApprovedContracts(clerkUserId) {
  const currentVersion = env.documensoAgreementVersion;
  const result = await query(
    `
      UPDATE eo_documents
      SET data = jsonb_set(
            jsonb_set(data, '{status}', to_jsonb('SUPERSEDED'::text), true),
            '{supersededAt}', to_jsonb(now()::text), true
          ),
          updated_at = now()
      WHERE collection = 'customer_contracts'
        AND data->>'clerkUserId' = $1
        AND data->>'status' = 'APPROVED'
        AND data->>'templateVersion' <> $2
      RETURNING id
    `,
    [String(clerkUserId), String(currentVersion)],
  );

  await Promise.all(
    result.rows.map((row) =>
      recordActivity({
        actorId: String(clerkUserId),
        actorRole: "system",
        action: "contract.superseded",
        targetType: "customer_contract",
        targetId: row.id,
        metadata: {
          requiredVersion: currentVersion,
        },
      }),
    ),
  );
}

export async function findLatestContractForUser(clerkUserId, { currentVersionOnly = true } = {}) {
  if (!clerkUserId) {
    return null;
  }

  const filter = { clerkUserId };
  if (currentVersionOnly) {
    filter.templateVersion = env.documensoAgreementVersion;
  }

  const contracts = await CustomerContract.find(filter).sort({ createdAt: -1 }).limit(1);
  return contracts[0] || null;
}

export async function getCurrentContractSummary(clerkUserId) {
  await supersedeOutdatedApprovedContracts(clerkUserId);
  const contract = await findLatestContractForUser(clerkUserId);

  return {
    agreementVersion: env.documensoAgreementVersion,
    status: contract?.status || "NOT_STARTED",
    contract: normalizeContractForResponse(contract),
  };
}

async function findReusableActiveContract(clerkUserId) {
  const contracts = await CustomerContract.find({
    clerkUserId,
    templateVersion: env.documensoAgreementVersion,
    status: { $in: ACTIVE_CONTRACT_STATUSES },
  }).sort({ createdAt: -1 }).limit(1);

  return contracts[0] || null;
}

async function createReadyContract({ identity, payload, turnstile = null, templateConfig }) {
  try {
    return await withTransaction(async () => {
      const activeContract = await findReusableActiveContract(identity.clerkUserId);
      if (activeContract) {
        return activeContract;
      }

      const contractNumber = await nextContractNumber();
      const contract = await insertContract({
        contractNumber,
        clerkUserId: identity.clerkUserId,
        customerEmail: identity.customerEmail,
        customerName: identity.customerName,
        customerType: payload.customerType,
        businessName: payload.customerType === "BUSINESS" ? payload.businessName : "",
        country: payload.country || "",
        phone: payload.phone || "",
        templateVersion: templateConfig.templateVersion,
        status: "READY_TO_SIGN",
        documensoTemplateId: templateConfig.templateId,
        documensoTemplateRecipientId: templateConfig.templateRecipientId,
        ...(turnstile
          ? {
              turnstileVerifiedAt: turnstile.verifiedAt,
              turnstileHostname: turnstile.hostname,
            }
          : {}),
      });

      return contract;
    });
  } catch (error) {
    if (String(error.message || "").includes("duplicate key")) {
      const existing = await findReusableActiveContract(identity.clerkUserId);
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
}

async function updateContractStatus(contract, toStatus, { actorRole = "system", set = {} } = {}) {
  assertTransition(contract.status, toStatus, { actorRole });
  const updated = await CustomerContract.findOneAndUpdate(
    { _id: contract._id, status: contract.status },
    {
      $set: {
        ...set,
        status: toStatus,
      },
    },
    { new: true },
  );

  if (!updated) {
    throw new HttpError(409, "Contract was updated by another process. Please retry.");
  }

  return updated;
}

async function issueSigningUrl(contract) {
  if (!contract.documensoDocumentId || !contract.documensoRecipientId) {
    return "";
  }

  await ensureDocumentDistributedForSigning(contract.documensoDocumentId, redirectUrlForContract(contract._id));
  const signingUrl = await getRecipientSigningUrl(contract.documensoDocumentId, contract.documensoRecipientId);

  await recordActivity({
    actorId: contract.clerkUserId,
    actorRole: "customer",
    action: "contract.signing_url_issued",
    targetType: "customer_contract",
    targetId: String(contract._id),
    metadata: {
      contractNumber: contract.contractNumber,
    },
  });
  return signingUrl;
}

export async function startCustomerContract({ auth, payload, turnstile = null }) {
  const templateConfig = getRequiredTemplateId();
  await supersedeOutdatedApprovedContracts(auth.clerkId);

  const identity = await getClerkAccountIdentity({
    clerkId: auth.clerkId,
    payload: auth.payload,
  });

  const readyOrActiveContract = await createReadyContract({
    identity,
    payload,
    turnstile,
    templateConfig,
  });

  if (turnstile) {
    await recordActivity({
      actorId: auth.user?._id || identity.clerkUserId,
      actorRole: "customer",
      action: "contract.turnstile_verified",
      targetType: "customer_contract",
      targetId: String(readyOrActiveContract._id),
      metadata: {
        hostname: turnstile.hostname,
      },
    });
  }

  if (readyOrActiveContract.status === "APPROVED") {
    return {
      contract: normalizeContractForResponse(readyOrActiveContract),
      signingUrl: "",
    };
  }

  if (readyOrActiveContract.status === "PENDING_SIGNATURE") {
    return {
      contract: normalizeContractForResponse(readyOrActiveContract),
      signingUrl: await issueSigningUrl(readyOrActiveContract),
    };
  }

  if (readyOrActiveContract.status !== "READY_TO_SIGN") {
    return {
      contract: normalizeContractForResponse(readyOrActiveContract),
      signingUrl: "",
    };
  }

  await recordActivity({
    actorId: auth.user?._id || identity.clerkUserId,
    actorRole: "customer",
    action: "contract.created",
    targetType: "customer_contract",
    targetId: String(readyOrActiveContract._id),
    metadata: {
      contractNumber: readyOrActiveContract.contractNumber,
      templateVersion: readyOrActiveContract.templateVersion,
    },
  });

  let document;
  try {
    document = await createDocumentFromTemplate({
      contractId: readyOrActiveContract._id,
      contractNumber: readyOrActiveContract.contractNumber,
      templateId: templateConfig.templateId,
      templateRecipientId: templateConfig.templateRecipientId,
      customerName: identity.customerName,
      customerEmail: identity.customerEmail,
      businessName: readyOrActiveContract.businessName || "",
      country: readyOrActiveContract.country || "",
      phone: readyOrActiveContract.phone || "",
      redirectUrl: redirectUrlForContract(readyOrActiveContract._id),
    });
  } catch (error) {
    throw new HttpError(502, "The signing document could not be created right now. Please try again later.", {
      provider: "documenso",
    });
  }

  const contract = await updateContractStatus(readyOrActiveContract, "PENDING_SIGNATURE", {
    set: {
      documensoDocumentId: String(document.documentId),
      documensoRecipientId: String(document.recipientId || ""),
    },
  });

  await recordActivity({
    actorId: auth.user?._id || identity.clerkUserId,
    actorRole: "customer",
    action: "contract.documenso_document_created",
    targetType: "customer_contract",
    targetId: String(contract._id),
    metadata: {
      contractNumber: contract.contractNumber,
      documensoDocumentId: String(document.documentId),
    },
  });

  const signingUrl = await issueSigningUrl(contract);
  if (!signingUrl) {
    throw new HttpError(502, "The signing URL could not be generated right now. Please try again later.");
  }

  return {
    contract: normalizeContractForResponse(contract),
    signingUrl,
  };
}

function ensureCanViewContract(contract, auth) {
  if (!contract) {
    throw new HttpError(404, "Contract not found.");
  }

  if (String(contract.clerkUserId) !== String(auth.clerkId)) {
    throw new HttpError(403, "This contract does not belong to the authenticated customer.");
  }
}

export async function getCustomerContract({ contractId, auth }) {
  const contract = await CustomerContract.findById(contractId);
  ensureCanViewContract(contract, auth);
  return normalizeContractForResponse(contract);
}

function statusFromDocumensoEvent(eventType, status) {
  const normalizedStatus = normalizeDocumensoStatus(status);
  const normalizedEvent = String(eventType || "").toUpperCase();

  if (normalizedStatus === "COMPLETED" || normalizedEvent.includes("COMPLETED")) {
    return "COMPLETED";
  }
  if (normalizedStatus === "REJECTED" || normalizedEvent.includes("REJECTED") || normalizedEvent.includes("DECLINED")) {
    return "REJECTED";
  }
  if (normalizedStatus === "CANCELLED" || normalizedEvent.includes("CANCELLED") || normalizedEvent.includes("VOIDED")) {
    return "CANCELLED";
  }
  if (normalizedStatus === "EXPIRED" || normalizedEvent.includes("EXPIRED")) {
    return "EXPIRED";
  }
  return normalizedStatus;
}

async function acquireStorageContract(contractId) {
  const staleBefore = new Date(Date.now() - storageLockTtlMs).toISOString();
  const now = new Date().toISOString();
  const result = await query(
    `
      UPDATE eo_documents
      SET data = jsonb_set(
            jsonb_set(
              jsonb_set(data, '{status}', to_jsonb('SIGNED_PENDING_STORAGE'::text), true),
              '{storageStartedAt}', to_jsonb($3::text), true
            ),
            '{signedAt}',
            CASE
              WHEN COALESCE(data->>'signedAt', '') = '' THEN to_jsonb($3::text)
              ELSE data->'signedAt'
            END,
            true
          ),
          updated_at = now()
      WHERE collection = 'customer_contracts'
        AND id = $1
        AND (
          data->>'status' = 'PENDING_SIGNATURE'
          OR (
            data->>'status' = 'SIGNED_PENDING_STORAGE'
            AND COALESCE(data->>'storageStartedAt', '') < $2
          )
        )
      RETURNING id
    `,
    [String(contractId), staleBefore, now],
  );

  return result.rows[0]?.id ? CustomerContract.findById(result.rows[0].id) : null;
}

export async function processCompletedContract(contractOrId, { actorRole = "system" } = {}) {
  const contractId = typeof contractOrId === "object" ? contractOrId._id : contractOrId;
  const existing = typeof contractOrId === "object" ? contractOrId : await CustomerContract.findById(contractId);
  if (!existing) {
    throw new HttpError(404, "Contract not found.");
  }

  if (["SIGNED_PENDING_ADMIN", "APPROVED", "REJECTED"].includes(existing.status) && existing.r2SignedPdfKey) {
    return existing;
  }

  const contract = await acquireStorageContract(existing._id);
  if (!contract) {
    return CustomerContract.findById(existing._id);
  }

  await recordActivity({
    actorId: contract.clerkUserId,
    actorRole,
    action: "contract.document_completed",
    targetType: "customer_contract",
    targetId: String(contract._id),
    metadata: {
      documensoDocumentId: String(contract.documensoDocumentId),
    },
  });

  const signedPdfBuffer = await downloadCompletedDocument(contract.documensoDocumentId);
  await recordActivity({
    actorId: contract.clerkUserId,
    actorRole,
    action: "contract.pdf_downloaded",
    targetType: "customer_contract",
    targetId: String(contract._id),
    metadata: {
      documensoDocumentId: String(contract.documensoDocumentId),
    },
  });

  const auditCertificateBuffer = await downloadAuditCertificate(contract.documensoDocumentId);
  const stored = await storeCompletedContractFiles({
    contract,
    signedPdfBuffer,
    auditCertificateBuffer,
  });

  const updated = await CustomerContract.findOneAndUpdate(
    { _id: contract._id, status: "SIGNED_PENDING_STORAGE" },
    {
      $set: {
        status: "SIGNED_PENDING_ADMIN",
        signedAt: contract.signedAt || new Date(),
        storedAt: stored.storedAt,
        r2SignedPdfKey: stored.signedPdfKey,
        r2AuditCertificateKey: stored.auditCertificateKey,
        r2EvidenceKey: stored.evidenceKey,
        signedPdfSha256: stored.sha256,
      },
    },
    { new: true },
  );

  if (!updated) {
    throw new HttpError(409, "Contract storage state changed while processing.");
  }

  await recordActivity({
    actorId: updated.clerkUserId,
    actorRole,
    action: "contract.pdf_uploaded_to_r2",
    targetType: "customer_contract",
    targetId: String(updated._id),
    metadata: {
      signedPdfKey: updated.r2SignedPdfKey,
      auditCertificateStored: Boolean(updated.r2AuditCertificateKey),
      sha256: updated.signedPdfSha256,
    },
  });

  return updated;
}

export async function syncContractWithDocumenso({ contractId, auth, staff }) {
  const contract = await CustomerContract.findById(contractId);
  if (!contract) {
    throw new HttpError(404, "Contract not found.");
  }

  if (auth) {
    ensureCanViewContract(contract, auth);
  } else if (!staff) {
    throw new HttpError(401, "Authentication required.");
  }

  if (!contract.documensoDocumentId) {
    return normalizeContractForResponse(contract);
  }

  const status = statusFromDocumensoEvent("", await getDocumentStatus(contract.documensoDocumentId));
  if (status === "COMPLETED") {
    return normalizeContractForResponse(await processCompletedContract(contract, { actorRole: staff ? "admin" : "customer" }));
  }

  if (["REJECTED", "CANCELLED", "EXPIRED"].includes(status) && contract.status === "PENDING_SIGNATURE") {
    const updated = await updateContractStatus(contract, status, {
      actorRole: status === "REJECTED" ? "system" : "system",
    });
    return normalizeContractForResponse(updated);
  }

  return normalizeContractForResponse(contract);
}

export async function recordDocumensoWebhookEvent({ eventId, eventType, documentId }) {
  try {
    return await ContractWebhookEvent.create({
      _id: `documenso:${eventId}`,
      provider: "documenso",
      eventId,
      eventType,
      documentId: String(documentId || ""),
      processedAt: new Date(),
    });
  } catch (error) {
    if (String(error.message || "").includes("duplicate key")) {
      return null;
    }
    throw error;
  }
}

export async function handleDocumensoWebhook({ eventId, eventType, documentId, status }) {
  const event = await recordDocumensoWebhookEvent({ eventId, eventType, documentId });
  if (!event) {
    return { duplicate: true };
  }

  if (!documentId) {
    return { ignored: true };
  }

  const contract = await CustomerContract.findOne({ documensoDocumentId: String(documentId) });
  if (!contract) {
    return { ignored: true };
  }

  const mappedStatus = statusFromDocumensoEvent(eventType, status);
  if (mappedStatus === "COMPLETED") {
    const updated = await processCompletedContract(contract, { actorRole: "system" });
    return { contract: normalizeContractForResponse(updated) };
  }

  if (["REJECTED", "CANCELLED", "EXPIRED"].includes(mappedStatus) && contract.status === "PENDING_SIGNATURE") {
    const updated = await updateContractStatus(contract, mappedStatus, {
      actorRole: "system",
    });
    await recordActivity({
      actorId: updated.clerkUserId,
      actorRole: "system",
      action: `contract.${mappedStatus.toLowerCase()}`,
      targetType: "customer_contract",
      targetId: String(updated._id),
      metadata: {
        documensoDocumentId: String(updated.documensoDocumentId),
      },
    });
    return { contract: normalizeContractForResponse(updated) };
  }

  return { ignored: true };
}

export async function syncPendingContracts({ limit = 25 } = {}) {
  const contracts = await CustomerContract.find({
    status: { $in: ["PENDING_SIGNATURE", "SIGNED_PENDING_STORAGE"] },
  })
    .sort({ updatedAt: 1 })
    .limit(limit);

  const results = [];
  for (const contract of contracts) {
    try {
      const updated = await syncContractWithDocumenso({ contractId: contract._id, staff: { _id: "system" } });
      results.push({ contractId: contract._id, status: updated?.status || contract.status });
    } catch (error) {
      results.push({ contractId: contract._id, error: error.message });
    }
  }

  return results;
}

async function runContractSyncSweep() {
  if (contractSyncInFlight || !env.documensoApiToken) {
    return;
  }

  contractSyncInFlight = true;
  try {
    await syncPendingContracts();
  } catch (error) {
    console.error("Contract sync sweep failed", error);
  } finally {
    contractSyncInFlight = false;
  }
}

export function startContractSyncScheduler(intervalMs = env.contractSyncIntervalMs) {
  if (contractSyncTimer) {
    return contractSyncTimer;
  }

  void runContractSyncSweep();
  contractSyncTimer = setInterval(() => {
    void runContractSyncSweep();
  }, intervalMs);

  if (typeof contractSyncTimer.unref === "function") {
    contractSyncTimer.unref();
  }

  return contractSyncTimer;
}

export async function listAdminContracts({ status } = {}) {
  const filter = {};
  if (status) {
    filter.status = status;
  }
  return CustomerContract.find(filter).sort({ createdAt: -1 });
}

export async function getAdminContract(contractId) {
  const contract = await CustomerContract.findById(contractId);
  if (!contract) {
    throw new HttpError(404, "Contract not found.");
  }
  return normalizeContractForResponse(contract);
}

export async function approveContract({ contractId, staff }) {
  const now = new Date();
  const updated = await CustomerContract.findOneAndUpdate(
    {
      _id: contractId,
      status: "SIGNED_PENDING_ADMIN",
      r2SignedPdfKey: { $ne: "" },
    },
    {
      $set: {
        status: "APPROVED",
        adminDecision: "APPROVED",
        adminReviewedBy: staff._id,
        adminReviewedAt: now,
        adminRejectionReason: "",
      },
    },
    { new: true },
  );

  if (!updated) {
    throw new HttpError(409, "Only stored contracts pending admin review can be approved.");
  }

  await recordActivity({
    actorId: staff._id,
    actorRole: staff.role,
    action: "contract.approved",
    targetType: "customer_contract",
    targetId: String(updated._id),
    metadata: {
      contractNumber: updated.contractNumber,
      clerkUserId: updated.clerkUserId,
    },
  });

  return normalizeContractForResponse(updated);
}

export async function rejectContract({ contractId, staff, reason }) {
  const trimmedReason = String(reason || "").trim();
  if (!trimmedReason) {
    throw new HttpError(400, "A rejection reason is required.");
  }

  const updated = await CustomerContract.findOneAndUpdate(
    { _id: contractId, status: "SIGNED_PENDING_ADMIN" },
    {
      $set: {
        status: "REJECTED",
        adminDecision: "REJECTED",
        adminReviewedBy: staff._id,
        adminReviewedAt: new Date(),
        adminRejectionReason: trimmedReason,
      },
    },
    { new: true },
  );

  if (!updated) {
    throw new HttpError(409, "Only contracts pending admin review can be rejected.");
  }

  await recordActivity({
    actorId: staff._id,
    actorRole: staff.role,
    action: "contract.rejected",
    targetType: "customer_contract",
    targetId: String(updated._id),
    metadata: {
      contractNumber: updated.contractNumber,
      clerkUserId: updated.clerkUserId,
    },
  });

  return normalizeContractForResponse(updated);
}

export async function createContractDownloadUrl({ contractId, auth, staff, audit = false }) {
  const contract = await CustomerContract.findById(contractId);
  if (!contract) {
    throw new HttpError(404, "Contract not found.");
  }
  if (auth) {
    ensureCanViewContract(contract, auth);
  } else if (!staff) {
    throw new HttpError(401, "Authentication required.");
  }

  const key = audit ? contract.r2AuditCertificateKey : contract.r2SignedPdfKey;
  if (!key) {
    throw new HttpError(404, audit ? "Audit certificate is not available." : "Signed contract is not available.");
  }

  const url = await createPresignedContractDownloadUrl({
    key,
    fileName: audit ? `${contract.contractNumber}-audit-certificate.pdf` : `${contract.contractNumber}.pdf`,
    expiresIn: 300,
  });

  await recordActivity({
    actorId: auth?.user?._id || staff?._id || contract.clerkUserId,
    actorRole: auth ? "customer" : staff?.role || "system",
    action: audit ? "contract.audit_download_url_generated" : "contract.download_url_generated",
    targetType: "customer_contract",
    targetId: String(contract._id),
    metadata: {
      contractNumber: contract.contractNumber,
    },
  });

  return {
    url,
    expiresIn: 300,
  };
}

export async function requireApprovedContract(clerkUserId) {
  if (!clerkUserId) {
    throw new HttpError(401, "Customer authentication required.");
  }

  await supersedeOutdatedApprovedContracts(clerkUserId);

  const contract = await CustomerContract.findOne({
    clerkUserId,
    templateVersion: env.documensoAgreementVersion,
    status: "APPROVED",
    adminDecision: "APPROVED",
    r2SignedPdfKey: { $ne: "" },
  });

  if (contract?.r2SignedPdfKey && contract.adminReviewedBy) {
    return contract;
  }

  const latest = await findLatestContractForUser(clerkUserId);
  throw new HttpError(
    403,
    "You must sign the current service agreement and receive administrative approval before purchasing.",
    {
      code: "CONTRACT_APPROVAL_REQUIRED",
      contractStatus: latest?.status || "NOT_STARTED",
      redirectUrl: "/portal/contracts",
    },
  );
}

export async function requireSubmittedContract(clerkUserId) {
  if (!clerkUserId) {
    throw new HttpError(401, "Customer authentication required.");
  }

  await supersedeOutdatedApprovedContracts(clerkUserId);

  const contract = await CustomerContract.findOne({
    clerkUserId,
    templateVersion: env.documensoAgreementVersion,
    status: { $in: ["SIGNED_PENDING_ADMIN", "APPROVED"] },
    r2SignedPdfKey: { $ne: "" },
  });

  if (contract?.r2SignedPdfKey) {
    return contract;
  }

  const latest = await findLatestContractForUser(clerkUserId);
  throw new HttpError(
    403,
    "You must sign the current service agreement before creating orders.",
    {
      code: "CONTRACT_SIGNATURE_REQUIRED",
      contractStatus: latest?.status || "NOT_STARTED",
      redirectUrl: "/portal/contracts",
    },
  );
}
