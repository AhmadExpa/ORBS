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

  for (const key of [
    "data",
    "items",
    "templates",
    "documents",
    "Documents",
    "envelopes",
    "Envelopes",
    "recipients",
    "Recipients",
    "Recipient",
    "fields",
    "Fields",
    "Field",
    "fieldValues",
  ]) {
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
      document?.Fields ||
      document?.Field ||
      template?.fields ||
      template?.Fields ||
      template?.Field ||
      template?.data?.fields ||
      template?.data?.Fields ||
      template?.data?.Field ||
      document?.recipients?.flatMap?.((recipient) => recipient.fields || []) ||
      document?.Recipients?.flatMap?.((recipient) => recipient.Fields || recipient.Field || recipient.fields || []) ||
      document?.Recipient?.flatMap?.((recipient) => recipient.Field || recipient.fields || []) ||
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

function getReadableFieldLabel(field) {
  return String(
    field?.fieldMeta?.label ||
      field?.label ||
      field?.name ||
      field?.fieldMeta?.name ||
      field?.fieldMeta?.placeholder ||
      field?.placeholder ||
      field?.secondaryId ||
      field?.id ||
      "",
  ).trim();
}

function getPrefillFieldType(field) {
  const fieldType = String(field?.fieldMeta?.type || field?.type || "").toLowerCase();
  const normalizedTypes = new Set(["text", "number", "radio", "checkbox", "dropdown", "date"]);
  return normalizedTypes.has(fieldType) ? fieldType : "";
}

function resolveTemplateFieldValue(label, values) {
  if (label.includes("signing as") || label.includes("customer type") || label.includes("account type") || label.includes("client type")) {
    return values.customerTypeLabel;
  }
  if (label.includes("legal") || label.includes("full name")) {
    return values.customerName;
  }
  if (label.includes("email")) {
    return values.customerEmail;
  }
  if (label.includes("ein") || label.includes("tax id") || label.includes("registration number") || label.includes("company number")) {
    return values.businessRegistrationNumber;
  }
  if (label.includes("registration type") || label.includes("tax type")) {
    return values.businessRegistrationType;
  }
  if (label.includes("incorporation") || label.includes("formation")) {
    return values.incorporationCountry;
  }
  if (label.includes("role") || label.includes("title")) {
    return values.businessRole;
  }
  if (label.includes("capacity") || label.includes("authority")) {
    return values.signingCapacity;
  }
  if (label.includes("business") || label.includes("company")) {
    return values.businessName;
  }
  if (label.includes("country")) {
    return values.country;
  }
  if (label.includes("phone")) {
    return values.phone;
  }
  return "";
}

function formatCustomerType(value) {
  return value === "BUSINESS" ? "Business" : value === "INDIVIDUAL" ? "Individual" : "";
}

function normalizePrefillValueForType(type, label, value) {
  const normalizedValue = normalizeSignedFieldValue(value);
  if (type !== "number") {
    return normalizedValue;
  }

  const numericValue = normalizedValue.replace(/[^\d.-]/gu, "");
  return numericValue && /[0-9]/u.test(numericValue) ? numericValue : "";
}

function buildTemplateFieldValues({
  template,
  customerType,
  customerName,
  customerEmail,
  businessName,
  signingCapacity,
  businessRole,
  businessRegistrationType,
  businessRegistrationNumber,
  incorporationCountry,
  country,
  phone,
}) {
  return getTemplateFields(template)
    .map((field) => {
      const label = getFieldLabel(field);
      const type = getPrefillFieldType(field);
      const value = normalizePrefillValueForType(type, label, resolveTemplateFieldValue(label, {
        customerTypeLabel: formatCustomerType(customerType),
        customerName,
        customerEmail,
        businessName,
        signingCapacity,
        businessRole,
        businessRegistrationType,
        businessRegistrationNumber,
        incorporationCountry,
        country,
        phone,
      }));

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

function getDocumentFields(payload) {
  const document = extractDocument(payload);
  const recipients = [
    ...flattenItems(document?.recipients),
    ...flattenItems(document?.Recipients),
    ...flattenItems(document?.Recipient),
    ...flattenItems(payload?.recipients),
    ...flattenItems(payload?.Recipients),
    ...flattenItems(payload?.Recipient),
    ...flattenItems(payload?.data?.recipients),
    ...flattenItems(payload?.data?.Recipients),
    ...flattenItems(payload?.data?.Recipient),
  ];
  const fields = [
    ...flattenItems(document?.fields),
    ...flattenItems(document?.Fields),
    ...flattenItems(document?.Field),
    ...flattenItems(payload?.fields),
    ...flattenItems(payload?.Fields),
    ...flattenItems(payload?.Field),
    ...flattenItems(payload?.fieldValues),
    ...flattenItems(payload?.data?.fields),
    ...flattenItems(payload?.data?.Fields),
    ...flattenItems(payload?.data?.Field),
    ...flattenItems(payload?.data?.fieldValues),
    ...recipients.flatMap((recipient) => [
      ...flattenItems(recipient?.fields),
      ...flattenItems(recipient?.Fields),
      ...flattenItems(recipient?.Field),
    ]),
  ];
  const seen = new Set();

  return fields.filter((field) => {
    const key = String(field?.id || field?.secondaryId || field?.fieldId || `${field?.type || ""}:${getReadableFieldLabel(field)}`);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeSignedFieldValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeSignedFieldValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return normalizeSignedFieldValue(value.value ?? value.label ?? value.text ?? value.name ?? value.id ?? "");
  }

  return String(value).replace(/\s+/gu, " ").trim();
}

function optionValue(option) {
  return normalizeSignedFieldValue(option?.value ?? option?.label ?? option?.text ?? option?.name ?? option?.id ?? "");
}

function normalizeSelectionSet(values = []) {
  return new Set(
    values
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map((value) => normalizeSignedFieldValue(value).toLowerCase())
      .filter(Boolean),
  );
}

function extractCheckedOptionValues(field = {}) {
  const fieldMeta = field?.fieldMeta || {};
  const values = [
    ...flattenItems(fieldMeta.values),
    ...flattenItems(fieldMeta.options),
    ...flattenItems(field?.values),
    ...flattenItems(field?.options),
  ];
  const selectedValues = normalizeSelectionSet([
    field?.value,
    field?.selectedValue,
    field?.selected_value,
    field?.selectedValues,
    field?.selected_values,
    fieldMeta.value,
    fieldMeta.defaultValue,
    fieldMeta.selectedValue,
    fieldMeta.selected_value,
    fieldMeta.selectedValues,
    fieldMeta.selected_values,
  ]);

  return values
    .filter((option) => {
      const normalizedOptionValue = optionValue(option).toLowerCase();
      return option?.checked || option?.selected || option?.isSelected || selectedValues.has(normalizedOptionValue);
    })
    .map(optionValue)
    .filter(Boolean);
}

function getSignedFieldValue(field) {
  const checkedOptionValues = extractCheckedOptionValues(field);
  if (checkedOptionValues.length) {
    return checkedOptionValues.join(", ");
  }

  if (field?.checked || field?.selected || field?.isSelected || field?.fieldMeta?.checked || field?.fieldMeta?.selected || field?.fieldMeta?.isSelected) {
    return "Checked";
  }

  for (const candidate of [
    field?.customText,
    field?.value,
    field?.text,
    field?.answer,
    field?.insertedValue,
    field?.inserted_value,
    field?.fieldValue,
    field?.field_value,
    field?.recipientValue,
    field?.recipient_value,
    field?.completedValue,
    field?.completed_value,
    field?.fieldMeta?.text,
    field?.fieldMeta?.value,
    field?.fieldMeta?.defaultValue,
    field?.fieldMeta?.selectedValue,
    field?.fieldMeta?.selected_value,
    field?.fieldMeta?.selectedValues,
    field?.fieldMeta?.selected_values,
  ]) {
    const normalized = normalizeSignedFieldValue(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

export function extractDocumentFieldValues(payload) {
  const ignoredTypes = new Set(["SIGNATURE", "FREE_SIGNATURE", "INITIALS"]);
  const fields = getDocumentFields(payload);

  return fields
    .map((field) => {
      const type = String(field?.type || field?.fieldMeta?.type || "").toUpperCase();
      if (ignoredTypes.has(type)) {
        return null;
      }

      const value = getSignedFieldValue(field);
      if (!value) {
        return null;
      }

      return {
        id: String(field?.id || field?.secondaryId || field?.fieldId || ""),
        label: getReadableFieldLabel(field),
        type,
        value,
      };
    })
    .filter(Boolean);
}

export function mapDocumensoFieldValuesToContractDetails(fieldValues = []) {
  const details = {};

  for (const field of fieldValues) {
    const label = String(field?.label || "").toLowerCase();
    const value = normalizeSignedFieldValue(field?.value);
    if (!label || !value) {
      continue;
    }

    if (
      !details.customerType &&
      (label.includes("customer type") ||
        label.includes("signing as") ||
        label.includes("account type") ||
        label.includes("client type"))
    ) {
      const normalizedType = value.toLowerCase();
      if (normalizedType.includes("business") || normalizedType.includes("company") || normalizedType.includes("organization")) {
        details.customerType = "BUSINESS";
      } else if (normalizedType.includes("individual") || normalizedType.includes("personal") || normalizedType.includes("person")) {
        details.customerType = "INDIVIDUAL";
      }
      continue;
    }

    if (
      !details.businessRegistrationType &&
      (label.includes("registration type") || label.includes("tax type") || label.includes("identifier type"))
    ) {
      details.businessRegistrationType = value;
      continue;
    }

    if (
      !details.businessRegistrationNumber &&
      (label.includes("registration number") ||
        label.includes("business registration") ||
        label.includes("company registration") ||
        label.includes("ein") ||
        label.includes("tax id") ||
        label.includes("vat number") ||
        label.includes("business identifier") ||
        label.includes("company number"))
    ) {
      details.businessRegistrationNumber = value;
      continue;
    }

    if (!details.incorporationCountry && (label.includes("incorporation") || label.includes("formation") || label.includes("jurisdiction"))) {
      details.incorporationCountry = value;
      continue;
    }

    if (!details.businessRole && (label.includes("business role") || label.includes("company role") || label.includes("job title") || label.includes("title") || label.includes("position"))) {
      details.businessRole = value;
      continue;
    }

    if (!details.signingCapacity && (label.includes("signing capacity") || label.includes("capacity") || label.includes("authority"))) {
      details.signingCapacity = value;
      continue;
    }

    if (
      !details.businessName &&
      ((label.includes("business") && label.includes("name")) ||
        (label.includes("company") && label.includes("name")) ||
        (label.includes("organization") && label.includes("name")) ||
        (label.includes("organisation") && label.includes("name")) ||
        label.includes("legal entity"))
    ) {
      details.businessName = value;
      continue;
    }

    if (!details.phone && (label.includes("phone") || label.includes("mobile") || label.includes("telephone") || label.includes("contact number"))) {
      details.phone = value;
      continue;
    }

    if (!details.country && label.includes("country")) {
      details.country = value;
      continue;
    }

    if (!details.customerName && (label.includes("full name") || label.includes("legal name") || label.includes("customer name") || label.includes("client name") || label.includes("signer name") || label === "name")) {
      details.customerName = value;
      continue;
    }

    if (!details.customerEmail && label.includes("email")) {
      details.customerEmail = value;
    }
  }

  return details;
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
  customerType = "",
  customerName,
  customerEmail,
  businessName = "",
  signingCapacity = "",
  businessRole = "",
  businessRegistrationType = "",
  businessRegistrationNumber = "",
  incorporationCountry = "",
  country = "",
  phone = "",
  redirectUrl,
}) {
  const fieldValues = buildTemplateFieldValues({
    template,
    customerType,
    customerName,
    customerEmail,
    businessName,
    signingCapacity,
    businessRole,
    businessRegistrationType,
    businessRegistrationNumber,
    incorporationCountry,
    country,
    phone,
  });
  const title = `ElevenOrbits Managed Service Agreement ${contractNumber}`;
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
      subject: "ElevenOrbits Managed Service Agreement",
      message: "Please review and sign the ElevenOrbits Managed Service Agreement.",
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
        subject: "ElevenOrbits Managed Service Agreement",
        message: "Please review and sign the ElevenOrbits Managed Service Agreement.",
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

  const responseStatus = normalizeStatus(extractDocument(response));
  if (documentId && (responseStatus === "DRAFT" || !signingUrl)) {
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

export async function getDocumentCompletionDetails(documentId) {
  const payload = await getDocument(documentId);
  const document = extractDocument(payload);

  return {
    status: normalizeStatus(document),
    completedAt:
      document?.completedAt ||
      document?.completed_at ||
      payload?.completedAt ||
      payload?.completed_at ||
      payload?.data?.completedAt ||
      payload?.data?.completed_at ||
      null,
    fieldValues: extractDocumentFieldValues(payload),
  };
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
