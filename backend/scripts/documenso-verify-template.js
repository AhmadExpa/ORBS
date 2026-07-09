import { env } from "../config/env.js";
import { getTemplate } from "../services/documenso-service.js";

function flattenItems(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  for (const key of ["data", "items", "templates", "recipients", "fields"]) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  return [];
}

function getRecipientItems(template) {
  return flattenItems(
    template?.recipients ||
      template?.data?.recipients ||
      template?.document?.recipients ||
      template?.template?.recipients,
  );
}

function getFieldItems(template, recipient) {
  return flattenItems(
    recipient?.fields ||
      template?.fields ||
      template?.data?.fields ||
      template?.document?.fields ||
      template?.template?.fields,
  );
}

function titleFor(template) {
  return (
    template?.title ||
    template?.name ||
    template?.document?.title ||
    template?.data?.title ||
    template?.template?.title ||
    "Untitled template"
  );
}

function idFor(template) {
  return (
    template?.id ||
    template?.templateId ||
    template?.data?.id ||
    template?.template?.id ||
    template?.document?.id ||
    ""
  );
}

function normalizeRecipient(recipient, template) {
  return {
    id: String(recipient.id || recipient.recipientId || recipient.recipient_id || ""),
    templateRecipientId: String(recipient.templateRecipientId || recipient.template_recipient_id || ""),
    role: recipient.role || recipient.type || recipient.signingOrder || "signer",
    emailConfigured: Boolean(recipient.email),
    fieldCount: getFieldItems(template, recipient).length,
  };
}

async function main() {
  const templateId = String(env.documensoTemplateId || "").trim();
  const expectedRecipientId = String(env.documensoTemplateRecipientId || "").trim();

  if (!templateId || !expectedRecipientId) {
    throw new Error("DOCUMENSO_TEMPLATE_ID and DOCUMENSO_TEMPLATE_RECIPIENT_ID must both be set.");
  }

  const template = await getTemplate(templateId);
  const recipients = getRecipientItems(template).map((recipient) => normalizeRecipient(recipient, template));
  const matchingRecipient =
    recipients.find((recipient) => recipient.id === expectedRecipientId || recipient.templateRecipientId === expectedRecipientId) ||
    null;

  const result = {
    templateFound: true,
    requestedTemplateId: templateId,
    returnedTemplateId: String(idFor(template) || templateId),
    title: titleFor(template),
    recipientCount: recipients.length,
    expectedRecipientId,
    recipientMatchFound: Boolean(matchingRecipient),
    matchingRecipient,
    recipients,
  };

  console.log(JSON.stringify(result, null, 2));

  if (!matchingRecipient) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const status = error?.metadata?.providerStatus ? ` (${error.metadata.providerStatus})` : "";
  const message = error?.metadata?.providerMessage || error?.message || "Unable to verify Documenso template.";
  console.error(`Documenso template verification failed${status}: ${message}`);
  process.exit(1);
});
