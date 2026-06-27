import { getTemplate, listTemplates } from "../services/documenso-service.js";

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

function getTemplateItems(response) {
  return flattenItems(response?.templates || response);
}

function getRecipientItems(template) {
  return flattenItems(template?.recipients || template?.data?.recipients || template?.document?.recipients);
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
  return template?.title || template?.name || template?.document?.title || template?.data?.title || "Untitled template";
}

async function main() {
  const response = await listTemplates();
  const templates = getTemplateItems(response);

  if (!templates.length) {
    console.log("No Documenso templates returned.");
    return;
  }

  for (const item of templates) {
    const templateId = item.id || item.templateId;
    const detail = templateId ? await getTemplate(templateId).catch(() => item) : item;
    const recipients = getRecipientItems(detail);

    console.log(`Template: ${titleFor(detail)} (${templateId || "unknown id"})`);
    if (!recipients.length) {
      console.log("  Recipients: none returned");
    }

    for (const recipient of recipients) {
      const recipientId = recipient.id || recipient.recipientId || "unknown";
      const role = recipient.role || recipient.signingOrder || recipient.type || "signer";
      console.log(`  Recipient: ${recipientId} role=${role} email=${recipient.email || "not set"}`);
      const fields = getFieldItems(detail, recipient);
      for (const field of fields) {
        console.log(`    Field: ${field.id || "unknown"} type=${field.type || "unknown"} label=${field.label || field.name || ""}`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error.message || "Unable to list Documenso templates.");
  process.exit(1);
});
