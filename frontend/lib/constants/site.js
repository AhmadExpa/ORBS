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

function normalizeApiUrl(value) {
  const fallbackApiUrl = "https://api.elevenorbits.com/api/v1";
  const normalizedValue = normalizePossibleUrl(value || fallbackApiUrl)
    .replace(/:\/\/api\.accounts?\.elevenorbits\.com/iu, "://api.elevenorbits.com")
    .replace(/\/+$/u, "");

  return /\/api\/v1$/iu.test(normalizedValue) ? normalizedValue : `${normalizedValue}/api/v1`;
}

function normalizeSiteUrl(value) {
  return normalizePossibleUrl(value || "https://elevenorbits.com")
    .replace(/:\/\/account\.elevenorbits\.com/iu, "://elevenorbits.com")
    .replace(/\/+$/u, "");
}

const fallbackAppUrl = process.env.NODE_ENV === "production" ? "https://elevenorbits.com" : "http://localhost:3000";

const generalEmail = process.env.NEXT_PUBLIC_GENERAL_EMAIL || "hello@elevenorbits.com";
const salesEmail = process.env.NEXT_PUBLIC_SALES_EMAIL || "sales@elevenorbits.com";
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@elevenorbits.com";
const billingEmail = process.env.NEXT_PUBLIC_BILLING_EMAIL || "billing@elevenorbits.com";
const securityEmail = process.env.NEXT_PUBLIC_SECURITY_EMAIL || "security@elevenorbits.com";

const departmentContacts = [
  {
    key: "general",
    title: "General Inquiries",
    email: generalEmail,
    description: "Start here for anything that does not fit a specific service desk yet.",
  },
  {
    key: "sales",
    title: "Sales",
    email: salesEmail,
    description: "Use for scoped engagements, enterprise conversations, and contact-sales plans.",
  },
  {
    key: "support",
    title: "Support",
    email: supportEmail,
    description: "Use for active customer issues, tickets, and operational help.",
  },
  {
    key: "billing",
    title: "Billing",
    email: billingEmail,
    description: "Use for invoices, payment confirmations, wallet funding, and account charges.",
  },
  {
    key: "security",
    title: "Cybersecurity",
    email: securityEmail,
    description: "Use for security hardening, reviews, incident response, and cybersecurity services.",
  },
];

const serviceDepartmentMap = {
  vps: "sales",
  vds: "sales",
  "ai-servers": "sales",
  vicidial: "sales",
  workflows: "sales",
  "ai-solutions": "sales",
  "development-support": "support",
  cybersecurity: "security",
};

export const siteConfig = {
  name: "ElevenOrbits",
  generalEmail,
  salesEmail,
  supportEmail,
  billingEmail,
  securityEmail,
  departmentContacts,
  serviceDepartmentMap,
  publicUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_MARKETING_URL),
  appUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || fallbackAppUrl),
  apiUrl: normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL),
};

export function getDepartmentContactByServiceSlug(slug) {
  const departmentKey = siteConfig.serviceDepartmentMap[slug];
  return siteConfig.departmentContacts.find((item) => item.key === departmentKey) || siteConfig.departmentContacts.find((item) => item.key === "sales");
}

export const paymentProcessingMessage =
  "Your payment is in process. After verification, it will be added to your account. International payments usually take less than 3–4 hours to process.";
