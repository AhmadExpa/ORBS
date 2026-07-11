import { CheckCircle2 } from "lucide-react";
import { serviceCategories } from "@/lib/shared";
import { cn } from "@/lib/ui";

export const categoryBranding = {
  vps: {
    name: "Managed VPS",
    logo: "/partners/managed-vps.svg",
    accentClassName: "border-orange-200 bg-orange-50 text-orange-700",
    panelClassName: "from-orange-50 via-white to-sky-50",
    tools: ["Managed VPS", "Ubuntu", "Nginx", "Proxmox", "Managed backups"],
  },
  vds: {
    name: "Managed VDS",
    logo: "/partners/managed-vds.svg",
    accentClassName: "border-blue-200 bg-blue-50 text-blue-700",
    panelClassName: "from-blue-50 via-white to-cyan-50",
    tools: ["Managed VDS", "Proxmox", "Ubuntu", "Managed backups", "Private networking"],
  },
  "ai-servers": {
    name: "AI Servers",
    logo: "/partners/ai-server.svg",
    accentClassName: "border-violet-200 bg-violet-50 text-violet-700",
    panelClassName: "from-violet-50 via-white to-sky-50",
    tools: ["AI Servers", "DeepSeek", "OpenAI", "Claude", "GPU compute"],
  },
  vicidial: {
    name: "Vicidial",
    logo: "/partners/vicidial.svg",
    accentClassName: "border-slate-200 bg-slate-50 text-slate-800",
    panelClassName: "from-slate-50 via-white to-indigo-50",
    tools: ["VICIdial", "Asterisk", "SIP routing", "Twilio", "Jira"],
  },
  workflows: {
    name: "n8n Workflows",
    logo: "/partners/n8n.svg",
    accentClassName: "border-rose-200 bg-rose-50 text-rose-700",
    panelClassName: "from-rose-50 via-white to-orange-50",
    tools: ["n8n", "Zapier", "OpenAI", "DeepSeek", "Webhooks"],
  },
  "ai-solutions": {
    name: "AI Solutions",
    logo: "/partners/deepseek.svg",
    accentClassName: "border-sky-200 bg-sky-50 text-sky-700",
    panelClassName: "from-sky-50 via-white to-indigo-50",
    tools: ["DeepSeek", "OpenAI", "Claude", "Kimi", "Custom Workflows"],
  },
  "development-support": {
    name: "Development Support",
    logo: "/partners/dev-support.svg",
    accentClassName: "border-slate-200 bg-slate-50 text-slate-800",
    panelClassName: "from-slate-50 via-white to-sky-50",
    tools: ["Development Support", "Jira", "GitHub", "Runbooks", "Release support"],
  },
  cybersecurity: {
    name: "Cybersecurity",
    logo: "/partners/cybersecurity.svg",
    accentClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    panelClassName: "from-emerald-50 via-white to-slate-50",
    tools: ["Cybersecurity", "Datto", "Veeam", "SIEM", "WAF"],
  },
  cdn: {
    name: "Managed CDN",
    logo: "/partners/managed-cdn.svg",
    accentClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
    panelClassName: "from-cyan-50 via-white to-emerald-50",
    tools: ["Managed CDN", "DDoS protection", "Image optimization", "SSL", "Edge caching"],
  },
  "object-storage": {
    name: "O7 Bucket",
    logo: "/partners/object-storage.svg",
    accentClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    panelClassName: "from-emerald-50 via-white to-cyan-50",
    tools: ["O7 Bucket", "S3-compatible API", "CORS policy", "Custom domain", "Gated access"],
  },
  "hermes-ai-hosting": {
    name: "Hermes AI",
    logo: "/partners/hermes-ai.svg",
    accentClassName: "border-indigo-200 bg-indigo-50 text-indigo-700",
    panelClassName: "from-indigo-50 via-white to-sky-50",
    tools: ["Hermes Agent", "Hermes AI", "Ollama", "Tailscale", "Private VPS"],
  },
  "openclaw-hosting": {
    name: "OpenClaw",
    logo: "/partners/openclaw.svg",
    accentClassName: "border-blue-200 bg-blue-50 text-blue-700",
    panelClassName: "from-blue-50 via-white to-indigo-50",
    tools: ["OpenClaw", "Messaging", "AI Providers", "Private VPS", "Automation"],
  },
  "nextcloud-hosting": {
    name: "Nextcloud",
    logo: "/partners/nextcloud.svg",
    accentClassName: "border-sky-200 bg-sky-50 text-sky-700",
    panelClassName: "from-sky-50 via-white to-emerald-50",
    tools: ["Nextcloud", "O7 Bucket", "ONLYOFFICE", "Backups", "Private cloud"],
  },
};

export const brandLogos = {
  "managed vps": categoryBranding.vps,
  "managed vds": categoryBranding.vds,
  "ai servers": categoryBranding["ai-servers"],
  "gpu compute": categoryBranding["ai-servers"],
  "gpu-ready": categoryBranding["ai-servers"],
  vicidial: categoryBranding.vicidial,
  "vicidial management": categoryBranding.vicidial,
  asterisk: { name: "Asterisk", logo: "/partners/vicidial.svg" },
  n8n: { name: "n8n", logo: "/partners/n8n.svg" },
  webhooks: { name: "Webhooks", logo: "/partners/n8n.svg" },
  zapier: { name: "Zapier", logo: "/partners/zapier.svg" },
  deepseek: { name: "DeepSeek", logo: "/partners/deepseek.svg" },
  clawbot: { name: "Clawbot", logo: "/partners/clawbot.svg" },
  openai: { name: "OpenAI", logo: "/partners/openai.svg" },
  claude: { name: "Claude", logo: "/partners/claude.svg" },
  kimi: { name: "Kimi", logo: "/partners/kimi.svg" },
  cybersecurity: categoryBranding.cybersecurity,
  datto: { name: "Datto", logo: "/partners/datto.svg" },
  veeam: { name: "Veeam", logo: "/partners/veeam.svg" },
  "managed cdn": categoryBranding.cdn,
  cdn: categoryBranding.cdn,
  "object storage": categoryBranding["object-storage"],
  "o7 bucket": categoryBranding["object-storage"],
  "s3-compatible api": categoryBranding["object-storage"],
  "hermes agent": categoryBranding["hermes-ai-hosting"],
  "hermes ai": categoryBranding["hermes-ai-hosting"],
  openclaw: categoryBranding["openclaw-hosting"],
  nextcloud: categoryBranding["nextcloud-hosting"],
  "development support": categoryBranding["development-support"],
  jira: { name: "Jira", logo: "/partners/jira.svg" },
  twilio: { name: "Twilio", logo: "/partners/twilio.svg" },
  microsoft: { name: "Microsoft", logo: "/partners/microsoft.svg" },
  azure: { name: "Microsoft Azure", logo: "/partners/azure.svg" },
  hp: { name: "HP", logo: "/partners/hp.svg" },
};

function normalizeBrandName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[/()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getInitials(label) {
  const parts = String(label || "EO").replace(/[^a-zA-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "EO";
}

export function getCategoryBrand(categorySlug) {
  return categoryBranding[categorySlug] || {
    name: serviceCategories.find((category) => category.slug === categorySlug)?.name || categorySlug,
  };
}

export function getBrandForName(name) {
  const normalized = normalizeBrandName(name);
  if (brandLogos[normalized]) {
    return brandLogos[normalized];
  }

  const matchedKey = Object.keys(brandLogos).find((key) => normalized.includes(key) || key.includes(normalized));
  return matchedKey ? brandLogos[matchedKey] : { name };
}

export function getServiceBrands(categorySlugs = [], techItems = []) {
  const seen = new Set();
  const brands = [];

  [...categorySlugs.map(getCategoryBrand), ...techItems.map(getBrandForName)].forEach((brand) => {
    const key = brand.logo || brand.name;
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    brands.push(brand);
  });

  return brands;
}

export function ServiceLogo({ brand, name, showLabel = false, className, imageClassName, labelClassName }) {
  const resolved = brand || getBrandForName(name);
  const label = resolved?.name || name || "Service";
  const shouldShowLabel = showLabel && !resolved?.logo;
  const logoOnlyLabelRequested = showLabel && Boolean(resolved?.logo);

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)]",
          logoOnlyLabelRequested && "h-12 w-20",
        )}
      >
        {resolved?.logo ? (
          <img
            src={resolved.logo}
            alt={`${label} logo`}
            loading="lazy"
            decoding="async"
            width={112}
            height={44}
            className={cn("h-7 w-8 object-contain", logoOnlyLabelRequested && "h-8 w-16", imageClassName)}
          />
        ) : (
          <span className="text-xs font-semibold text-slate-800">{getInitials(label)}</span>
        )}
      </span>
      {shouldShowLabel ? <span className={cn("truncate text-sm font-semibold text-slate-800", labelClassName)}>{label}</span> : null}
    </span>
  );
}

export function ServiceLogoCluster({ brands, categorySlugs = [], techItems = [], max = 7, showLabels = false, className }) {
  const resolvedBrands = brands || getServiceBrands(categorySlugs, techItems);
  const visibleBrands = resolvedBrands.slice(0, max);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {visibleBrands.map((brand) => (
        <ServiceLogo key={brand.logo || brand.name} brand={brand} showLabel={showLabels} />
      ))}
    </div>
  );
}

export function TechLogoPills({ items = [], limit = 5, className }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.slice(0, limit).map((item) => {
        const brand = getBrandForName(item);

        return (
          <span key={item} className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.24)]">
            <ServiceLogo brand={brand} imageClassName="h-5 w-6" className="[&>span:first-child]:h-7 [&>span:first-child]:w-7 [&>span:first-child]:rounded-md [&>span:first-child]:shadow-none" />
            {brand.logo ? null : <span className="truncate">{item}</span>}
          </span>
        );
      })}
    </div>
  );
}

export function ServiceVisualPanel({ title = "Managed delivery stack", description, categorySlugs = [], techItems = [], className }) {
  const primaryCategory = categorySlugs[0];
  const primaryBrand = getCategoryBrand(primaryCategory);
  const brands = getServiceBrands(categorySlugs, techItems);
  const panelClassName = primaryBrand.panelClassName || "from-slate-50 via-white to-sky-50";

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.42)]", panelClassName, className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Operating Stack</p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight text-slate-950">{title}</h3>
          {description ? <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p> : null}
        </div>
        <ServiceLogo brand={primaryBrand} imageClassName="h-9 w-10" className="[&>span:first-child]:h-14 [&>span:first-child]:w-14 [&>span:first-child]:rounded-lg" />
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {brands.slice(0, 6).map((brand) => (
          <div key={brand.logo || brand.name} className="flex min-h-16 items-center justify-center rounded-md border border-white/80 bg-white/82 px-3 py-3 shadow-[0_16px_38px_-32px_rgba(15,23,42,0.42)]">
            <ServiceLogo brand={brand} showLabel imageClassName="h-9 w-20" className="[&>span:first-child]:h-12 [&>span:first-child]:w-24 [&>span:first-child]:shadow-none" labelClassName="text-xs" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-2">
        {["Portal order", "Managed provisioning", "Support handoff"].map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-md border border-white/80 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
