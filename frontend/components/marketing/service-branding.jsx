import {
  Boxes,
  BrainCircuit,
  Cable,
  CheckCircle2,
  CloudCog,
  Code2,
  Container,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Headphones,
  LockKeyhole,
  Monitor,
  PhoneCall,
  RadioTower,
  Route,
  Shield,
  ShieldCheck,
  Terminal,
  Webhook,
  Workflow,
} from "lucide-react";
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
    tools: ["VICIdial", "3CX", "FreePBX", "Zoiper", "Asterisk"],
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
  "3cx": { name: "3CX", logo: "/partners/3cx.svg" },
  freepbx: { name: "FreePBX", logo: "/partners/freepbx.svg" },
  zoiper: { name: "Zoiper", logo: "/partners/zoiper.svg" },
  asterisk: { name: "Asterisk", logo: "/partners/asterisk.svg" },
  n8n: { name: "n8n", logo: "/partners/n8n.svg" },
  webhooks: { name: "Webhooks", icon: Webhook, iconClassName: "border-rose-200 bg-rose-50 text-rose-600" },
  webhook: { name: "Webhook", icon: Webhook, iconClassName: "border-rose-200 bg-rose-50 text-rose-600" },
  "webhook orchestration": { name: "Webhook orchestration", icon: Webhook, iconClassName: "border-rose-200 bg-rose-50 text-rose-600" },
  "webhook routing": { name: "Webhook routing", icon: Route, iconClassName: "border-rose-200 bg-rose-50 text-rose-600" },
  zapier: { name: "Zapier", logo: "/partners/zapier.svg" },
  deepseek: { name: "DeepSeek", logo: "/partners/deepseek.svg" },
  "deepseek api": { name: "DeepSeek API", logo: "/partners/deepseek.svg" },
  "open-source deepseek": { name: "Open-source DeepSeek", logo: "/partners/deepseek.svg" },
  "deepseek openai integration": { name: "DeepSeek / OpenAI integration", icon: BrainCircuit, iconClassName: "border-violet-200 bg-violet-50 text-violet-700" },
  clawbot: { name: "Clawbot", logo: "/partners/clawbot.svg" },
  openai: { name: "OpenAI", logo: "/partners/openai.svg" },
  claude: { name: "Claude", logo: "/partners/claude.svg" },
  kimi: { name: "Kimi", logo: "/partners/kimi.svg" },
  cybersecurity: categoryBranding.cybersecurity,
  datto: { name: "Datto", logo: "/partners/datto.svg" },
  kaseya: { name: "Kaseya", logo: "/partners/kaseya.svg" },
  veeam: { name: "Veeam", logo: "/partners/veeam.svg" },
  "managed cdn": categoryBranding.cdn,
  cdn: categoryBranding.cdn,
  "cdn edge caching": { name: "CDN edge caching", icon: Globe, iconClassName: "border-cyan-200 bg-cyan-50 text-cyan-700" },
  "priority edge caching": { name: "Priority edge caching", icon: Globe, iconClassName: "border-cyan-200 bg-cyan-50 text-cyan-700" },
  "enterprise cdn": { name: "Enterprise CDN", icon: CloudCog, iconClassName: "border-cyan-200 bg-cyan-50 text-cyan-700" },
  "object storage": categoryBranding["object-storage"],
  "o7 bucket": categoryBranding["object-storage"],
  "s3-compatible api": { name: "S3-compatible API", icon: Database, iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  "cors policy": { name: "CORS policy", icon: ShieldCheck, iconClassName: "border-sky-200 bg-sky-50 text-sky-700" },
  "custom domain": { name: "Custom domain", icon: Globe, iconClassName: "border-sky-200 bg-sky-50 text-sky-700" },
  "hermes agent": categoryBranding["hermes-ai-hosting"],
  "hermes ai": categoryBranding["hermes-ai-hosting"],
  openclaw: categoryBranding["openclaw-hosting"],
  nextcloud: categoryBranding["nextcloud-hosting"],
  "development support": categoryBranding["development-support"],
  github: { name: "GitHub", logo: "/partners/github.svg" },
  jira: { name: "Jira", logo: "/partners/jira.svg" },
  twilio: { name: "Twilio", logo: "/partners/twilio.svg" },
  telnyx: { name: "Telnyx", logo: "/partners/telnyx.png" },
  broadvoice: { name: "Broadvoice", logo: "/partners/broadvoice.svg" },
  nextiva: { name: "Nextiva", logo: "/partners/nextiva.svg" },
  "zoom phone": { name: "Zoom Phone", logo: "/partners/zoom-phone.svg" },
  zoom: { name: "Zoom Phone", logo: "/partners/zoom-phone.svg" },
  "google voice": { name: "Google Voice", logo: "/partners/google-voice.svg" },
  "google call": { name: "Google Voice", logo: "/partners/google-voice.svg" },
  microsoft: { name: "Microsoft", logo: "/partners/microsoft.svg" },
  windows: { name: "Windows", logo: "/partners/windows.svg" },
  azure: { name: "Microsoft Azure", logo: "/partners/azure.svg" },
  hp: { name: "HP", logo: "/partners/hp.svg" },
  ubuntu: { name: "Ubuntu", logo: "/partners/ubuntu.svg" },
  almalinux: { name: "AlmaLinux", logo: "/partners/almalinux.svg" },
  nvidia: { name: "NVIDIA", logo: "/partners/nvidia.svg" },
  amd: { name: "AMD", logo: "/partners/amd.svg" },
  ryzen: { name: "AMD Ryzen", logo: "/partners/amd-ryzen.svg" },
  "amd ryzen": { name: "AMD Ryzen", logo: "/partners/amd-ryzen.svg" },
  intel: { name: "Intel", logo: "/partners/intel.svg" },
  cloudflare: { name: "Cloudflare", logo: "/partners/cloudflare.svg" },
  "ubuntu almalinux": { name: "Ubuntu / AlmaLinux", logo: "/partners/ubuntu.svg" },
  "almalinux ubuntu": { name: "AlmaLinux / Ubuntu", logo: "/partners/almalinux.svg" },
  "ubuntu debian": { name: "Ubuntu / Debian", logo: "/partners/ubuntu.svg" },
  nginx: { name: "Nginx", logo: "/partners/nginx.svg" },
  apache: { name: "Apache", logo: "/partners/apache.svg" },
  "nginx apache": { name: "Nginx / Apache", logo: "/partners/nginx.svg" },
  docker: { name: "Docker", logo: "/partners/docker.svg" },
  "kubernetes docker": { name: "Kubernetes / Docker", logo: "/partners/kubernetes.svg" },
  "container orchestration": { name: "Container orchestration", icon: Container, iconClassName: "border-blue-200 bg-blue-50 text-blue-700" },
  proxmox: { name: "Proxmox", logo: "/partners/proxmox.svg" },
  "kvm proxmox": { name: "KVM / Proxmox", logo: "/partners/proxmox.svg" },
  kubernetes: { name: "Kubernetes", logo: "/partners/kubernetes.svg" },
  ollama: { name: "Ollama", icon: BrainCircuit, iconClassName: "border-slate-200 bg-slate-50 text-slate-700" },
  "vllm ollama": { name: "vLLM / Ollama", icon: BrainCircuit, iconClassName: "border-slate-200 bg-slate-50 text-slate-700" },
  "pytorch vllm": { name: "PyTorch / vLLM", icon: BrainCircuit, iconClassName: "border-orange-200 bg-orange-50 text-orange-700" },
  "managed firewall": { name: "Managed firewall", icon: Shield, iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  "managed firewall and backups": { name: "Managed firewall and backups", icon: ShieldCheck, iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  "firewall policy review": { name: "Firewall policy review", icon: ShieldCheck, iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  "os hardening": { name: "OS hardening", icon: LockKeyhole, iconClassName: "border-slate-200 bg-slate-50 text-slate-700" },
  fail2ban: { name: "Fail2Ban / WAF", icon: ShieldCheck, iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  waf: { name: "WAF", icon: Shield, iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  "waf rules": { name: "WAF rules", icon: Shield, iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  "waf reverse proxy": { name: "WAF / reverse proxy", icon: Shield, iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  "sip routing": { name: "SIP routing", icon: Route, iconClassName: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  "sip trunk setup": { name: "SIP trunk setup", icon: Cable, iconClassName: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  "call recording review": { name: "Call recording review", icon: RadioTower, iconClassName: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  "qa workflow support": { name: "QA workflow support", icon: Headphones, iconClassName: "border-indigo-200 bg-indigo-50 text-indigo-700" },
};

function normalizeBrandName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[/()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getIconForLabel(label) {
  const normalized = normalizeBrandName(label);

  if (/\b(vcpu|cpu|gpu|cuda|cluster|compute)\b/.test(normalized)) {
    return { icon: Cpu, iconClassName: "border-violet-200 bg-violet-50 text-violet-700" };
  }
  if (/\b(ram|memory)\b/.test(normalized)) {
    return { icon: Boxes, iconClassName: "border-indigo-200 bg-indigo-50 text-indigo-700" };
  }
  if (/\b(ssd|nvme|disk|storage|bucket|backup|snapshot|retention|archive)\b/.test(normalized)) {
    return { icon: HardDrive, iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  if (/\b(bandwidth|edge|cdn|ddos|ssl|domain|cors|cloud)\b/.test(normalized)) {
    return { icon: Globe, iconClassName: "border-cyan-200 bg-cyan-50 text-cyan-700" };
  }
  if (/\b(firewall|waf|security|hardening|edr|siem|policy|governed|controls|incident|response|patch)\b/.test(normalized)) {
    return { icon: ShieldCheck, iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  if (/\b(monitoring|observability|analytics|model monitoring)\b/.test(normalized)) {
    return { icon: Monitor, iconClassName: "border-sky-200 bg-sky-50 text-sky-700" };
  }
  if (/\b(webhook|workflow|queue|event|automation|integration|routing)\b/.test(normalized)) {
    return { icon: Workflow, iconClassName: "border-rose-200 bg-rose-50 text-rose-700" };
  }
  if (/\b(api|custom apis|release|runbook|application|architecture|troubleshooting|support|registry|artifact)\b/.test(normalized)) {
    return { icon: Code2, iconClassName: "border-slate-200 bg-slate-50 text-slate-700" };
  }
  if (/\b(phone|call|sip|voip|vicidial|asterisk|queue)\b/.test(normalized)) {
    return { icon: PhoneCall, iconClassName: "border-indigo-200 bg-indigo-50 text-indigo-700" };
  }
  if (/\b(ai|model|prompt|vector|deepseek|openai|vllm|ollama|private model)\b/.test(normalized)) {
    return { icon: BrainCircuit, iconClassName: "border-violet-200 bg-violet-50 text-violet-700" };
  }
  if (/\b(container|docker|kubernetes)\b/.test(normalized)) {
    return { icon: Container, iconClassName: "border-blue-200 bg-blue-50 text-blue-700" };
  }
  if (/\b(windows|ubuntu|debian|linux|almalinux|os)\b/.test(normalized)) {
    return { icon: Terminal, iconClassName: "border-orange-200 bg-orange-50 text-orange-700" };
  }

  return { icon: CheckCircle2, iconClassName: "border-slate-200 bg-white text-slate-700" };
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
  return matchedKey ? brandLogos[matchedKey] : { name, ...getIconForLabel(name) };
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
  const shouldShowLabel = showLabel;
  const logoSizeClassName = imageClassName || (showLabel ? "h-9 w-9" : "h-10 w-28");
  const Icon = resolved?.icon || getIconForLabel(label).icon;
  const iconClassName = resolved?.iconClassName || getIconForLabel(label).iconClassName;

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)} aria-label={label}>
      {resolved?.logo ? (
        <img
          src={resolved.logo}
          alt={`${label} logo`}
          loading="lazy"
          decoding="async"
          width={144}
          height={56}
          className={cn("shrink-0 object-contain", logoSizeClassName)}
        />
      ) : (
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md border", iconClassName)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      {shouldShowLabel ? <span className={cn("min-w-0 text-sm font-semibold text-slate-800", labelClassName)}>{label}</span> : null}
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
          <span key={item} className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700">
            <ServiceLogo brand={brand} imageClassName="h-6 w-12" className="[&>span:first-child]:h-7 [&>span:first-child]:w-7" />
            <span className="truncate">{item}</span>
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
        <ServiceLogo brand={primaryBrand} imageClassName="h-12 w-24" className="[&>span:first-child]:h-12 [&>span:first-child]:w-12" />
      </div>

      <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5">
        {brands.slice(0, 6).map((brand) => (
          <div key={brand.logo || brand.name} className="flex min-h-14 items-center justify-center">
            <ServiceLogo brand={brand} showLabel imageClassName="h-10 w-10" className="w-full justify-start [&>span:first-child]:h-11 [&>span:first-child]:w-11" labelClassName="text-xs leading-5" />
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
