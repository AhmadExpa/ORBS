import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

function assertConfigured() {
  if (!env.documensoApiUrl || !env.documensoApiToken) {
    throw new HttpError(500, "Documenso is not configured.");
  }
}

function joinApiPath(path) {
  return `${env.documensoApiUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getDocumensoWebBaseUrl() {
  try {
    const url = new URL(env.documensoApiUrl);
    url.pathname = url.pathname.replace(/\/api\/v\d+\/?$/iu, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/+$/u, "");
  } catch (error) {
    return "https://app.documenso.com";
  }
}

function toNumberIfNumeric(value) {
  const stringValue = String(value || "").trim();
  return /^\d+$/u.test(stringValue) ? Number(stringValue) : stringValue;
}

function normalizeHeaderSignature(value) {
  return String(value || "").trim().replace(/^sha256=/iu, "");
}

function isPdfResponse(response, bytes) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.toLowerCase().includes("application/pdf")) {
    return true;
  }

  return bytes?.length >= 4 && bytes.subarray(0, 4).toString("utf8") === "%PDF";
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.toLowerCase().includes("application/json")) {
    return response.json();
  }

  if (contentType.toLowerCase().includes("application/pdf")) {
    return Buffer.from(await response.arrayBuffer());
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

async function documensoFetch(path, { method = "GET", body, raw = false } = {}) {
  assertConfigured();

  const response = await fetch(joinApiPath(path), {
    method,
    headers: {
      Authorization: env.documensoApiToken,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (raw) {
    return response;
  }

  const data = await parseResponse(response);
  if (!response.ok) {
    throw new HttpError(response.status >= 500 ? 502 : 400, "Documenso request failed.", {
      providerStatus: response.status,
      providerMessage: typeof data === "string" ? data.slice(0, 300) : data?.message || data?.error || "",
    });
  }

  return data;
}

async function firstSuccessful(candidates, action) {
  let lastError = null;

  for (const candidate of candidates) {
    try {
      return await action(candidate);
    } catch (error) {
      lastError = error;
      if (![400, 404, 405].includes(error.statusCode)) {
        throw error;
      }
    }
  }

  throw lastError || new HttpError(502, "Documenso request failed.");
}

function flattenItems(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  for (const key of ["data", "items", "templates", "documents", "recipients", "fields"]) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  return [];
}

function extractDocument(payload) {
  return payload?.document || payload?.envelope || payload?.data?.document || payload?.data?.envelope || payload?.data || payload;
}

function extractDocumentId(payload) {
  const document = extractDocument(payload);
  return (
    document?.id ||
    document?.documentId ||
    document?.document_id ||
    document?.envelopeId ||
    document?.envelope_id ||
    payload?.documentId ||
    payload?.document_id ||
    payload?.envelopeId ||
    payload?.envelope_id ||
    ""
  );
}

function extractRecipients(payload) {
  if (payload?.role && (payload?.email || payload?.token)) {
    return [payload];
  }

  const document = extractDocument(payload);
  return flattenItems(
    document?.recipients ||
      document?.recipient ||
      payload?.recipients ||
      payload?.data?.recipients ||
      payload?.document?.recipients,
  );
}

function extractRecipientId(payload, templateRecipientId) {
  const recipients = extractRecipients(payload);
  const preferred = recipients.find((recipient) =>
    [recipient?.templateRecipientId, recipient?.template_recipient_id, recipient?.id].some(
      (value) => String(value || "") === String(templateRecipientId || ""),
    ),
  );
  const recipient = preferred || recipients[0] || {};
  return recipient.id || recipient.recipientId || recipient.recipient_id || "";
}

function extractSigningUrl(payload, recipientId) {
  const candidates = [
    payload?.signingUrl,
    payload?.signing_url,
    payload?.recipientSigningUrl,
    payload?.recipient_signing_url,
    payload?.data?.signingUrl,
    payload?.data?.signing_url,
  ];

  const recipients = extractRecipients(payload);
  const recipient = recipients.find((item) => String(item?.id || item?.recipientId || "") === String(recipientId || "")) || recipients[0];
  candidates.push(
    recipient?.signingUrl,
    recipient?.signing_url,
    recipient?.embedUrl,
    recipient?.embed_url,
    recipient?.url,
  );

  const directUrl = candidates.map((value) => String(value || "").trim()).find((value) => /^https?:\/\//iu.test(value));
  if (directUrl) {
    return directUrl;
  }

  const signingToken = extractSigningToken(payload, recipientId);
  return signingToken ? `${getDocumensoWebBaseUrl()}/sign/${encodeURIComponent(signingToken)}` : "";
}

function extractSigningToken(payload, recipientId) {
  const recipients = extractRecipients(payload);
  const recipient = recipients.find((item) => String(item?.id || item?.recipientId || "") === String(recipientId || "")) || recipients[0];

  return String(
    recipient?.token ||
      recipient?.signingToken ||
      recipient?.signing_token ||
      payload?.token ||
      payload?.signingToken ||
      payload?.signing_token ||
      payload?.data?.token ||
      payload?.data?.signingToken ||
      "",
  ).trim();
}

function normalizeStatus(document) {
  return String(document?.status || document?.documentStatus || document?.document_status || "").toUpperCase();
}

function getTemplateFields(template) {
  const document = extractDocument(template);
  return flattenItems(
    document?.fields ||
      template?.fields ||
      template?.data?.fields ||
      document?.recipients?.flatMap?.((recipient) => recipient.fields || []) ||
      [],
  );
}

function getFieldLabel(field) {
  return String(
    field?.label ||
      field?.name ||
      field?.fieldMeta?.label ||
      field?.fieldMeta?.placeholder ||
      field?.customText ||
      field?.placeholder ||
      "",
  ).toLowerCase();
}

function getPrefillFieldType(field) {
  const fieldType = String(field?.fieldMeta?.type || field?.type || "").toLowerCase();
  const normalizedTypes = new Set(["text", "number", "radio", "checkbox", "dropdown", "date"]);
  return normalizedTypes.has(fieldType) ? fieldType : "";
}

function buildTemplateFieldValues({ template, customerName, customerEmail, businessName, country, phone }) {
  return getTemplateFields(template)
    .map((field) => {
      const label = getFieldLabel(field);
      const type = getPrefillFieldType(field);
      const value = label.includes("legal") || label.includes("full name")
        ? customerName
        : label.includes("email")
          ? customerEmail
          : label.includes("business") || label.includes("company")
            ? businessName
            : label.includes("country")
              ? country
              : label.includes("phone")
                ? phone
                : "";

      if (!field?.id || !type || !value) {
        return null;
      }

      return {
        id: toNumberIfNumeric(field.id),
        type,
        ...(field?.fieldMeta?.label ? { label: field.fieldMeta.label } : {}),
        ...(field?.fieldMeta?.placeholder ? { placeholder: field.fieldMeta.placeholder } : {}),
        value,
      };
    })
    .filter(Boolean);
}

function buildRecipientPayload({ templateRecipientId, customerName, customerEmail }) {
  return {
    id: toNumberIfNumeric(templateRecipientId),
    name: customerName,
    email: customerEmail,
  };
}

function buildTemplateUsePayload({
  contractId,
  contractNumber,
  template,
  templateId,
  templateRecipientId,
  customerName,
  customerEmail,
  businessName = "",
  country = "",
  phone = "",
  redirectUrl,
}) {
  const fieldValues = buildTemplateFieldValues({
    template,
    customerName,
    customerEmail,
    businessName,
    country,
    phone,
  });
  const title = `ElevenOrbits Master Services Agreement ${contractNumber}`;
  const recipient = buildRecipientPayload({ templateRecipientId, customerName, customerEmail });

  return {
    templateId: toNumberIfNumeric(templateId),
    externalId: contractNumber || contractId,
    recipients: [recipient],
    prefillFields: fieldValues,
    distributeDocument: false,
    override: {
      title,
      redirectUrl,
      subject: "ElevenOrbits Master Services Agreement",
      message: "Please review and sign the ElevenOrbits Master Services Agreement.",
      distributionMethod: "NONE",
    },
  };
}

export async function distributeDocumentForSigning(documentId, redirectUrl) {
  return documensoFetch("/document/distribute", {
    method: "POST",
    body: {
      documentId: toNumberIfNumeric(documentId),
      meta: {
        redirectUrl,
        distributionMethod: "NONE",
        subject: "ElevenOrbits Master Services Agreement",
        message: "Please review and sign the ElevenOrbits Master Services Agreement.",
      },
    },
  });
}

export async function ensureDocumentDistributedForSigning(documentId, redirectUrl) {
  const document = await getDocument(documentId);
  const status = normalizeStatus(extractDocument(document));

  if (status === "DRAFT") {
    return distributeDocumentForSigning(documentId, redirectUrl);
  }

  return document;
}

export function getDocumensoWebhookSignature(headers = {}) {
  return normalizeHeaderSignature(
    headers["x-documenso-signature"] ||
      headers["documenso-signature"] ||
      headers["x-webhook-signature"] ||
      headers["x-signature"] ||
      "",
  );
}

export async function listTemplates() {
  return firstSuccessful(["/templates", "/template"], (path) => documensoFetch(path));
}

export async function getTemplate(templateId) {
  const id = encodeURIComponent(String(templateId));
  return firstSuccessful([`/templates/${id}`, `/template/${id}`], (path) => documensoFetch(path));
}

export async function createDocumentFromTemplate(payload) {
  const template = payload.template || (await getTemplate(payload.templateId));
  const body = buildTemplateUsePayload({ ...payload, template });

  const response = await firstSuccessful(
    ["/template/use", "/templates/use", `/templates/${encodeURIComponent(String(payload.templateId))}/use`],
    (path) => documensoFetch(path, { method: "POST", body }),
  );

  let documentId = extractDocumentId(response);
  let recipientId = extractRecipientId(response, payload.templateRecipientId);
  let signingUrl = extractSigningUrl(response, recipientId);
  let distributedResponse = null;

  if (documentId && !signingUrl) {
    try {
      distributedResponse = await distributeDocumentForSigning(documentId, payload.redirectUrl);
      recipientId = recipientId || extractRecipientId(distributedResponse, payload.templateRecipientId);
      signingUrl = extractSigningUrl(distributedResponse, recipientId);

      if (!signingUrl) {
        const document = await getDocument(documentId);
        recipientId = recipientId || extractRecipientId(document, payload.templateRecipientId);
        signingUrl = extractSigningUrl(document, recipientId);
      }
    } catch (error) {
      if (![400, 404, 405].includes(error.statusCode)) {
        throw error;
      }
    }
  }

  if (!documentId) {
    throw new HttpError(502, "Documenso did not return a document ID.");
  }

  return {
    raw: response,
    distributedRaw: distributedResponse,
    documentId,
    recipientId,
    signingUrl,
  };
}

export async function getDocument(documentId) {
  const id = encodeURIComponent(String(documentId));
  return firstSuccessful(
    [`/documents/${id}`, `/document/${id}`, `/envelopes/${id}`, `/envelope/${id}`],
    (path) => documensoFetch(path),
  );
}

export async function getDocumentStatus(documentId) {
  const document = await getDocument(documentId);
  return normalizeStatus(extractDocument(document));
}

export async function getRecipientSigningUrl(documentId, recipientId) {
  const document = await getDocument(documentId);
  const embeddedUrl = extractSigningUrl(document, recipientId);
  if (embeddedUrl) {
    return embeddedUrl;
  }

  const id = encodeURIComponent(String(documentId));
  const rid = encodeURIComponent(String(recipientId));
  const response = await firstSuccessful(
    [
      `/document/recipient/${rid}`,
      `/envelope/recipient/${rid}`,
      `/documents/${id}/recipients/${rid}/signing-url`,
      `/document/${id}/recipients/${rid}/signing-url`,
    ],
    (path) => documensoFetch(path),
  );

  const url = extractSigningUrl(response, recipientId);
  if (!url) {
    throw new HttpError(502, "Documenso did not return a signing URL.");
  }

  return url;
}

export async function getRecipientSigningToken(documentId, recipientId) {
  const rid = encodeURIComponent(String(recipientId));
  const response = await firstSuccessful(
    [`/document/recipient/${rid}`, `/envelope/recipient/${rid}`],
    (path) => documensoFetch(path),
  );

  const token = extractSigningToken(response, recipientId);
  if (!token) {
    throw new HttpError(502, "Documenso did not return a signing token.");
  }

  return {
    token,
    host: getDocumensoWebBaseUrl(),
    documentId: String(documentId),
    recipientId: String(recipientId),
  };
}

async function fetchPossiblyRedirectedPdf(path) {
  const response = await documensoFetch(path, { raw: true });
  if (!response.ok) {
    const data = await parseResponse(response);
    throw new HttpError(response.status >= 500 ? 502 : 400, "Documenso download failed.", {
      providerStatus: response.status,
      providerMessage: typeof data === "string" ? data.slice(0, 300) : data?.message || data?.error || "",
    });
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.toLowerCase().includes("application/json")) {
    const data = await response.json();
    const downloadUrl = data?.downloadUrl || data?.download_url || data?.url;
    if (!downloadUrl) {
      throw new HttpError(404, "Documenso did not return a downloadable PDF.");
    }

    const downloadResponse = await fetch(downloadUrl);
    const bytes = Buffer.from(await downloadResponse.arrayBuffer());
    if (!downloadResponse.ok || !isPdfResponse(downloadResponse, bytes)) {
      throw new HttpError(502, "Documenso download was not a PDF.");
    }
    return bytes;
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (!isPdfResponse(response, bytes)) {
    throw new HttpError(502, "Documenso download was not a PDF.");
  }

  return bytes;
}

export async function downloadCompletedDocument(documentId) {
  const id = encodeURIComponent(String(documentId));
  return firstSuccessful(
    [
      `/documents/${id}/download`,
      `/document/${id}/download`,
      `/envelopes/${id}/download`,
      `/envelope/${id}/download`,
    ],
    fetchPossiblyRedirectedPdf,
  );
}

export async function downloadAuditCertificate(documentId) {
  const id = encodeURIComponent(String(documentId));
  try {
    return await firstSuccessful(
      [
        `/documents/${id}/audit-certificate`,
        `/document/${id}/audit-certificate`,
        `/envelopes/${id}/audit-certificate`,
        `/envelope/${id}/audit-certificate`,
        `/documents/${id}/certificate/download`,
        `/envelopes/${id}/certificate/download`,
      ],
      fetchPossiblyRedirectedPdf,
    );
  } catch (error) {
    if ([400, 404, 405].includes(error.statusCode)) {
      return null;
    }
    throw error;
  }
}

export function normalizeDocumensoStatus(status) {
  const normalized = String(status || "").toUpperCase();
  if (["COMPLETED", "COMPLETE", "SIGNED"].includes(normalized)) {
    return "COMPLETED";
  }
  if (["REJECTED", "DECLINED"].includes(normalized)) {
    return "REJECTED";
  }
  if (["CANCELLED", "VOIDED"].includes(normalized)) {
    return "CANCELLED";
  }
  if (["EXPIRED"].includes(normalized)) {
    return "EXPIRED";
  }
  return normalized || "PENDING";
}
