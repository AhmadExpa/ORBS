const generalEmail = process.env.NEXT_PUBLIC_GENERAL_EMAIL || "hello@elevenorbits.com";
const salesEmail = process.env.NEXT_PUBLIC_SALES_EMAIL || "sales@elevenorbits.com";
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@elevenorbits.com";
const billingEmail = process.env.NEXT_PUBLIC_BILLING_EMAIL || "billing@elevenorbits.com";
const serversEmail = process.env.NEXT_PUBLIC_SERVERS_EMAIL || "servers@elevenorbits.com";
const aiEmail = process.env.NEXT_PUBLIC_AI_EMAIL || "ai@elevenorbits.com";
const automationEmail = process.env.NEXT_PUBLIC_AUTOMATION_EMAIL || "automation@elevenorbits.com";
const vicidialEmail = process.env.NEXT_PUBLIC_VICIDIAL_EMAIL || "vicidial@elevenorbits.com";
const devSupportEmail = process.env.NEXT_PUBLIC_DEV_SUPPORT_EMAIL || "devsupport@elevenorbits.com";
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
    key: "servers",
    title: "Managed Servers",
    email: serversEmail,
    description: "Use for managed VPS, managed VDS, provisioning, and infrastructure requests.",
  },
  {
    key: "ai",
    title: "AI Services",
    email: aiEmail,
    description: "Use for AI servers, AI products, DeepSeek deployments, and model service discussions.",
  },
  {
    key: "automation",
    title: "Workflow Automation",
    email: automationEmail,
    description: "Use for workflow automation design, integrations, and process rollout requests.",
  },
  {
    key: "vicidial",
    title: "Vicidial and Call Centers",
    email: vicidialEmail,
    description: "Use for Vicidial management, dialer operations, and call-center workflow coordination.",
  },
  {
    key: "development-support",
    title: "Development Support",
    email: devSupportEmail,
    description: "Use for implementation support, technical changes, and recurring engineering help.",
  },
  {
    key: "security",
    title: "Cybersecurity",
    email: securityEmail,
    description: "Use for security hardening, reviews, incident response, and cybersecurity services.",
  },
];

const serviceDepartmentMap = {
  vps: "servers",
  vds: "servers",
  "ai-servers": "ai",
  vicidial: "vicidial",
  workflows: "automation",
  "ai-solutions": "ai",
  "development-support": "development-support",
  cybersecurity: "security",
};

export const siteConfig = {
  name: "ElevenOrbits",
  generalEmail,
  salesEmail,
  supportEmail,
  billingEmail,
  serversEmail,
  aiEmail,
  automationEmail,
  vicidialEmail,
  devSupportEmail,
  securityEmail,
  departmentContacts,
  serviceDepartmentMap,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1",
};

export function getDepartmentContactByServiceSlug(slug) {
  const departmentKey = siteConfig.serviceDepartmentMap[slug];
  return siteConfig.departmentContacts.find((item) => item.key === departmentKey) || siteConfig.departmentContacts.find((item) => item.key === "sales");
}

export const paymentProcessingMessage =
  "Your payment is in process. After verification, it will be added to your account. International payments usually take less than 3–4 hours to process.";
