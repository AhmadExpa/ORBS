"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  Bot,
  BookOpen,
  Building2,
  ChevronDown,
  Cpu,
  Database,
  FileText,
  HardDrive,
  Headset,
  LogIn,
  Menu,
  PhoneCall,
  Server,
  ShieldCheck,
  Workflow,
  X,
} from "lucide-react";
import { Button, cn } from "@/lib/ui";
import { getLoginPath, getOrderPath, getSignupPath, productPlanSeeds } from "@/lib/shared";
import { industryPages, resourcePages } from "@/lib/marketing-content";
import { ServiceLogoCluster } from "@/components/marketing/service-branding";
import { BrandLogo } from "./brand-logo";

const planMap = new Map(productPlanSeeds.map((plan) => [plan.slug, plan]));

const industryRecommendationSlugs = {
  "Managed Servers": ["vps", "vds"],
  "Cybersecurity Services": ["cybersecurity"],
  "Workflow Automation": ["workflows"],
  "VoIP and Vicidial Services": ["vicidial"],
  "Development Support": ["development-support"],
  "AI Services": ["ai-servers", "ai-solutions", "workflows"],
  "Managed CDN": ["cdn"],
  "Object Storage": ["object-storage"],
  "Self-Hosted App Services": ["hermes-ai-hosting", "openclaw-hosting", "nextcloud-hosting"],
};

function plansFor(slugs) {
  return slugs.map((slug) => planMap.get(slug)).filter(Boolean);
}

function slugsForIndustryRecommendations(items = []) {
  return [...new Set(items.flatMap((item) => industryRecommendationSlugs[item] || []))];
}

const serviceChoices = [
  {
    id: "vps",
    label: "VPS Hosting",
    eyebrow: "Linux and Windows VPS",
    href: "/services/vps",
    icon: Server,
    categorySlugs: ["vps"],
    description: "Choose VPS when you need a managed server for apps, websites, RDP, testing, or client workloads without dedicated-resource isolation.",
    chooseWhen: ["You need fast provisioning", "Workload is moderate or predictable", "Windows RDP or Linux app hosting is the target"],
    paths: [
      { label: "Windows VPS for RDP", description: "Fixed monthly Windows Server plans with Remote Desktop access.", href: "/services/vps" },
      { label: "Managed Linux VPS", description: "Website, API, panel, and app hosting with managed operations.", href: "/services/vps" },
      { label: "VDS upgrade path", description: "Move up when dedicated resource isolation matters.", href: "/services/vds" },
    ],
    planSlugs: ["windows-4gb-vps", "windows-8gb-vps", "windows-16gb-vps", "basic-managed-vps"],
  },
  {
    id: "vds",
    label: "VDS Servers",
    eyebrow: "Dedicated resource isolation",
    href: "/services/vds",
    icon: HardDrive,
    categorySlugs: ["vds"],
    description: "Choose VDS when you want stronger isolation, steadier performance, and managed capacity planning for heavier business systems.",
    chooseWhen: ["Noisy-neighbor risk matters", "Database or business systems need steadier resources", "You expect growth and want scaling review"],
    paths: [
      { label: "Balanced VDS", description: "Dedicated-resource baseline for stable production services.", href: "/services/vds" },
      { label: "Business VDS", description: "More headroom for databases, portals, and client systems.", href: "/services/vds" },
      { label: "Enterprise VDS", description: "Custom capacity planning and priority change handling.", href: "/contact" },
    ],
    planSlugs: ["balanced-managed-vds", "business-managed-vds", "enterprise-managed-vds"],
  },
  {
    id: "storage",
    label: "O7 Bucket",
    eyebrow: "S3-compatible storage",
    href: "/services/object-storage",
    icon: Database,
    categorySlugs: ["object-storage"],
    description: "Choose O7 Bucket for fixed-capacity object storage with S3-style access, CORS policy, gated delivery, and custom domains.",
    chooseWhen: ["Backups, media, archives, or AI datasets", "You want fixed capacity pricing", "Applications need S3-compatible credentials"],
    paths: [
      { label: "Developer bucket", description: "S3-compatible credentials, CORS, and gated access for apps.", href: "/services/object-storage" },
      { label: "Media and backup bucket", description: "Fixed-capacity storage for archives, assets, and backups.", href: "/services/object-storage" },
      { label: "Custom domain delivery", description: "Bucket access behind your own domain and policy.", href: "/services/object-storage" },
    ],
    planSlugs: ["object-storage-250gb", "object-storage-1tb", "object-storage-5tb", "object-storage-10tb"],
  },
  {
    id: "voip",
    label: "VoIP and Vicidial",
    eyebrow: "Inbound, outbound, RVM",
    href: "/services/vicidial",
    icon: PhoneCall,
    categorySlugs: ["vicidial"],
    description: "Choose VoIP support when call routing, SIP trunks, queues, campaigns, RVM, and dialer uptime affect daily operations.",
    chooseWhen: ["Agents depend on dialer uptime", "You need inbound/outbound/RVM planning", "SIP routing and queue behavior need recurring support"],
    paths: [
      { label: "Inbound call handling", description: "Queues, DID routing, IVR behavior, recordings, and support.", href: "/services/vicidial" },
      { label: "Outbound campaigns", description: "Campaign setup, dialer health, list behavior, and reporting.", href: "/services/vicidial" },
      { label: "RVM and SIP review", description: "Carrier, trunk, drop, and compliance planning before rollout.", href: "/services/vicidial" },
    ],
    planSlugs: ["starter-vicidial-management", "growth-vicidial-management", "premium-vicidial-management"],
  },
  {
    id: "ai",
    label: "AI, n8n and DeepSeek",
    eyebrow: "AI servers, workflows, API support",
    href: "/ai-services",
    icon: Cpu,
    categorySlugs: ["ai-servers", "workflows", "ai-solutions"],
    description: "Choose AI services for managed AI servers, n8n automation, DeepSeek API access, private deployment guidance, and practical rollout support.",
    chooseWhen: ["You need AI infrastructure or API guardrails", "n8n workflows should run on managed infrastructure", "AI workflows need operations support"],
    paths: [
      { label: "AI server hosting", description: "Managed compute and deployment support for model workloads.", href: "/ai-services" },
      { label: "n8n workflow operations", description: "Community Edition workflows with managed uptime and server capacity.", href: "/services/workflows" },
      { label: "DeepSeek API access", description: "Managed access, guardrails, and implementation guidance.", href: "/services/ai-solutions" },
      { label: "Private model planning", description: "Architecture review for private or open-source deployment.", href: "/contact" },
    ],
    planSlugs: ["ai-server-starter", "ai-server-scale", "workflow-starter", "workflow-growth", "deepseek-api-access", "open-source-deepseek-services"],
  },
  {
    id: "apps",
    label: "Self-Hosted Apps",
    eyebrow: "Hermes AI, OpenClaw, Nextcloud",
    href: "/self-hosted-app-services",
    icon: Bot,
    categorySlugs: ["hermes-ai-hosting", "openclaw-hosting", "nextcloud-hosting"],
    description: "Choose app hosting when you want private AI agents, assistants, or collaboration apps on managed VPS infrastructure.",
    chooseWhen: ["You need a hosted app, not a blank server", "Private assistant or file cloud is the goal", "Credentials and app handoff should live in portal"],
    paths: [
      { label: "Private AI assistants", description: "Hermes AI and OpenClaw hosted on managed infrastructure.", href: "/self-hosted-app-services" },
      { label: "Nextcloud hosting", description: "File cloud, media, backups, and collaboration apps.", href: "/services/nextcloud-hosting" },
      { label: "App catalog order", description: "Pick the app and receive provisioned access in the portal.", href: "/self-hosted-app-services" },
    ],
    planSlugs: ["hermes-ai-personal-vps", "openclaw-personal-vps", "nextcloud-starter", "nextcloud-ultimate-media-server"],
  },
  {
    id: "security",
    label: "Cybersecurity",
    eyebrow: "Hardening and response",
    href: "/cybersecurity-services",
    icon: ShieldCheck,
    categorySlugs: ["cybersecurity"],
    description: "Choose cybersecurity coverage when hosted systems need hardening, access review, monitoring, patch governance, and incident readiness.",
    chooseWhen: ["Public systems need stronger controls", "Access and patching need review", "You want recurring posture and response coverage"],
    paths: [
      { label: "Server hardening", description: "Baseline controls for VPS, VDS, and public apps.", href: "/cybersecurity-services" },
      { label: "Access review", description: "Credential, delegated access, and admin surface review.", href: "/cybersecurity-services" },
      { label: "Incident readiness", description: "Monitoring, escalation, and response planning.", href: "/contact" },
    ],
    planSlugs: ["cybersecurity-basic", "cybersecurity-premium", "cybersecurity-platinum"],
  },
];

const defaultServiceChoice = serviceChoices[0];

const companyLinks = [
  { href: "/about", label: "About", description: "Company and operating model.", icon: Building2 },
  { href: "/process", label: "Process", description: "Order, approval, and handoff.", icon: Workflow },
  { href: "/tech-stack", label: "Tech Stack", description: "Platforms behind delivery.", icon: Server },
  { href: "/contact", label: "Contact", description: "Sales and support routing.", icon: Headset },
];

function DesktopTrigger({ label, active, onClick }) {
  return (
    <button
      type="button"
      className={cn("inline-flex items-center gap-1 py-2 text-white/70 transition hover:text-white", active && "text-white")}
      aria-expanded={active}
      onClick={onClick}
    >
      {label}
      <ChevronDown className={cn("h-4 w-4 transition", active && "rotate-180")} />
    </button>
  );
}

function PlanCard({ plan, onNavigate }) {
  const href = plan.contactSalesOnly ? "/contact" : getSignupPath(getOrderPath(plan.slug));

  return (
    <Link
      href={href}
      className="group rounded-md border border-white/10 bg-white/[0.02] px-3 py-2.5 transition hover:border-[#ff7a1a]/30 hover:bg-white/[0.05]"
      onClick={onNavigate}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">{plan.name}</span>
          <span className="mt-0.5 block truncate text-xs text-white/60">{plan.displayPriceLabel || "Contact sales"}</span>
        </span>
        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
      </span>
    </Link>
  );
}

function MegaFrame({ children }) {
  return (
    <div className="fixed left-1/2 top-[62px] z-50 hidden w-[min(1120px,calc(100vw-3rem))] -translate-x-1/2 pt-4 xl:block">
      <div className="max-h-[calc(100vh-6rem)] overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] shadow-[0_46px_120px_-56px_rgba(2,6,23,0.72)]">
        {children}
      </div>
    </div>
  );
}

function ServicesMegaMenu({ activeChoiceId, setActiveChoiceId, onNavigate }) {
  const activeChoice = serviceChoices.find((choice) => choice.id === activeChoiceId) || defaultServiceChoice;
  const Icon = activeChoice.icon;
  const plans = plansFor(activeChoice.planSlugs);
  const pathItems = activeChoice.paths || activeChoice.chooseWhen.map((item) => ({ label: item, description: activeChoice.eyebrow, href: activeChoice.href }));

  return (
    <MegaFrame>
      <div className="grid bg-[#0d1117] xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        <section className="flex flex-col bg-slate-950 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff7a1a]">Services</p>

          <div className="mt-4 grid gap-1">
            {serviceChoices.map((choice) => {
              const ChoiceIcon = choice.icon;
              const active = choice.id === activeChoice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  onFocus={() => setActiveChoiceId(choice.id)}
                  onClick={() => setActiveChoiceId(choice.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition",
                    active ? "bg-white/[0.08] text-white shadow-sm border-l-2 border-[#ff7a1a]" : "text-white/70 hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", active ? "bg-white/[0.12] text-white" : "bg-white/[0.06] text-white/50")}>
                    <ChoiceIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{choice.label}</span>
                    <span className={cn("mt-0.5 block truncate text-xs", active ? "text-[#ff7a1a]" : "text-white/40")}>{choice.eyebrow}</span>
                  </span>
                  <ArrowRight className={cn("ml-auto h-3.5 w-3.5 transition", active ? "text-[#ff7a1a]" : "text-white/25 group-hover:translate-x-0.5")} />
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
            <Link href="/services" className="rounded-md border border-white/15 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10" onClick={onNavigate}>
              All services
            </Link>
            <Link href="/pricing" className="rounded-md bg-[#ff7a1a] px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#e66a12]" onClick={onNavigate}>
              Pricing
            </Link>
          </div>
        </section>

        <section className="min-w-0 bg-[#0d1117] p-6 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-white shadow-sm">
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff7a1a]">{activeChoice.eyebrow}</p>
              <h3 className="mt-1 text-2xl font-semibold leading-tight text-white">{activeChoice.label}</h3>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-end justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Choose</p>
              <Link href={activeChoice.href} className="hidden text-sm font-semibold text-[#ff7a1a] transition hover:text-[#e66a12] sm:inline-flex" onClick={onNavigate}>
                View service
              </Link>
            </div>

            <div className="mt-3 grid gap-2">
              {pathItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-start justify-between gap-4 rounded-md border border-white/10 bg-white/[0.02] px-3 py-3 transition hover:border-[#ff7a1a]/30 hover:bg-white/[0.05]"
                  onClick={onNavigate}
                >
                  <span>
                    <span className="block text-sm font-semibold text-white">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-white/40">{item.description}</span>
                  </span>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-5">
            <Link href={activeChoice.href} onClick={onNavigate}>
              <Button variant="outline" className="min-h-10 w-full rounded-md border border-white/10 bg-transparent text-white hover:bg-white/10">View Service</Button>
            </Link>
            <Link href={getSignupPath()} onClick={onNavigate}>
              <Button className="min-h-10 w-full rounded-md bg-[#ff7a1a] hover:bg-[#e66a12] text-white border-0">Start Account</Button>
            </Link>
          </div>
        </section>

        <section className="border-l border-white/[0.07] bg-[#0b0e14] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff7a1a]">Plans</p>
          <div className="mt-3 grid gap-2">
            {plans.map((plan) => (
              <PlanCard key={plan.slug} plan={plan} onNavigate={onNavigate} />
            ))}
          </div>

          <Link href="/contact" className="mt-4 inline-flex text-sm font-semibold text-[#ff7a1a] transition hover:text-[#e66a12]" onClick={onNavigate}>
            Custom quote
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </section>
      </div>
    </MegaFrame>
  );
}

function SimpleLinkCard({ href, label, description, icon: Icon, onNavigate, active = false, onFocus, onClick }) {
  const content = (
    <>
      {Icon ? <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-[#ff7a1a]" : "text-white/30")} /> : null}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{label}</span>
        {description ? <span className={cn("mt-0.5 block truncate text-xs", active ? "text-white/65" : "text-white/40")}>{description}</span> : null}
      </span>
      <ArrowRight className={cn("ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 transition", active ? "text-[#ff7a1a]" : "text-white/20 group-hover:translate-x-0.5 group-hover:text-white/60")} />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "group flex items-start gap-3 rounded-md px-3 py-2.5 transition",
          active ? "bg-[#ff7a1a]/10 text-white border border-[#ff7a1a]/30" : "text-white/70 hover:bg-white/[0.04] hover:text-white",
        )}
        onFocus={onFocus}
        onClick={onNavigate}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition",
        active ? "bg-[#ff7a1a]/10 text-white border border-[#ff7a1a]/30" : "text-white/70 hover:bg-white/[0.04] hover:text-white",
      )}
      onFocus={onFocus}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

function IndustryFitPanel({ industry, onNavigate }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-4 text-white">
      <ServiceLogoCluster categorySlugs={slugsForIndustryRecommendations(industry.recommended)} max={5} />
      <p className="mt-4 text-sm leading-6 text-white/60">
        {industry.fit}
      </p>
      <Link href={`/industries/${industry.slug}`} className="mt-4 inline-flex text-sm font-semibold text-[#ff7a1a] transition hover:text-[#e66a12]" onClick={onNavigate}>
        Open industry page
        <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </div>
  );
}

function SimpleColumn({ eyebrow, children, className }) {
  return (
    <section className={cn("p-5", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff7a1a]">{eyebrow}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SolutionsMegaMenu({ activeIndustrySlug, setActiveIndustrySlug, onNavigate }) {
  const activeIndustry = industryPages.find((industry) => industry.slug === activeIndustrySlug) || industryPages[0];

  return (
    <MegaFrame>
      <div className="grid bg-[#0d1117] xl:grid-cols-[360px_minmax(0,1fr)_260px] text-white">
        <SimpleColumn eyebrow="Industries" className="border-r border-white/[0.07]">
          <div className="grid gap-1">
            {industryPages.map((industry) => (
              <SimpleLinkCard
                key={industry.slug}
                label={industry.title}
                description={industry.eyebrow}
                active={industry.slug === activeIndustry.slug}
                onFocus={() => setActiveIndustrySlug(industry.slug)}
                onClick={() => setActiveIndustrySlug(industry.slug)}
              />
            ))}
          </div>
        </SimpleColumn>

        <SimpleColumn eyebrow="Operational fit">
          <IndustryFitPanel industry={activeIndustry} onNavigate={onNavigate} />
        </SimpleColumn>

        <SimpleColumn eyebrow="More" className="border-l border-white/[0.07] bg-[#0b0e14]">
          <div className="grid gap-2">
            <SimpleLinkCard href="/industries" label="All Industries" description="Browse every sector." icon={Building2} onNavigate={onNavigate} />
            <SimpleLinkCard href="/contact" label="Talk to Sales" description="Get service guidance." icon={Headset} onNavigate={onNavigate} />
          </div>
        </SimpleColumn>
      </div>
    </MegaFrame>
  );
}

function LearnMegaMenu({ onNavigate }) {
  // Map eyebrow types to colors
  const typeColor = {
    Guide: { dot: "bg-[#ff7a1a]", text: "text-[#ff7a1a]", badge: "bg-[#ff7a1a]/15 text-[#ff7a1a]" },
    Checklist: { dot: "bg-emerald-400", text: "text-emerald-400", badge: "bg-emerald-400/10 text-emerald-400" },
    Baseline: { dot: "bg-amber-400", text: "text-amber-400", badge: "bg-amber-400/10 text-amber-400" },
  };

  const featured = resourcePages[0];
  const rest = resourcePages.slice(1);

  return (
    <MegaFrame>
      <div className="grid bg-[#0d1117] xl:grid-cols-[280px_minmax(0,1fr)_220px]">
        {/* ── Left: Featured resource ── */}
        <section className="flex flex-col justify-between gap-6 border-r border-white/[0.07] p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">Featured</p>
            <Link
              href={`/resources/${featured.slug}`}
              className="group mt-4 block"
              onClick={onNavigate}
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest",
                  (typeColor[featured.eyebrow] || typeColor.Guide).badge,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", (typeColor[featured.eyebrow] || typeColor.Guide).dot)} />
                {featured.eyebrow}
              </span>
              <h3 className="mt-3 text-lg font-bold leading-snug text-white transition-colors group-hover:text-[#ff7a1a]">
                {featured.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/40 line-clamp-3">
                {featured.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff7a1a] transition group-hover:gap-2.5">
                Read guide <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>

          <Link
            href="/resources"
            className="group mt-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            onClick={onNavigate}
          >
            <BookOpen className="h-4 w-4 text-white/40" />
            Browse all resources
            <ArrowRight className="ml-auto h-3.5 w-3.5 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/60" />
          </Link>
        </section>

        {/* ── Center: All guides grid ── */}
        <section className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">All Resources</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {rest.map((resource) => {
              const tc = typeColor[resource.eyebrow] || typeColor.Guide;
              return (
                <Link
                  key={resource.slug}
                  href={`/resources/${resource.slug}`}
                  className="group flex flex-col gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 transition hover:border-white/15 hover:bg-white/[0.07]"
                  onClick={onNavigate}
                >
                  <span className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest", tc.text)}>
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tc.dot)} />
                    {resource.eyebrow}
                  </span>
                  <span className="text-sm font-semibold leading-snug text-white/85 transition group-hover:text-[#ff7a1a]">
                    {resource.title}
                  </span>
                  <span className="text-xs leading-5 text-white/35 line-clamp-2">{resource.description}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Right: Company links ── */}
        <section className="flex flex-col border-l border-white/[0.07] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">Company</p>
          <div className="mt-4 grid gap-1">
            {companyLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                onClick={onNavigate}
              >
                <item.icon className="h-4 w-4 shrink-0 text-white/25 transition group-hover:text-white/50" />
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-xs text-white/30">{item.description}</span>
                </span>
                <ArrowRight className="ml-auto h-3 w-3 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/40" />
              </Link>
            ))}
          </div>

          <div className="mt-auto pt-6">
            <Link
              href="/contact"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a1a]/10 to-red-500/10 px-4 py-3.5 text-sm font-semibold text-white/80 ring-1 ring-white/10 transition hover:from-[#ff7a1a]/20 hover:to-red-500/20 hover:text-white"
              onClick={onNavigate}
            >
              <Headset className="h-4 w-4 text-[#ff7a1a]" />
              Talk to sales
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-white/30 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </div>
    </MegaFrame>
  );
}


function MobileSection({ title, open, onToggle, children }) {
  return (
    <section className="border-t border-white/10 py-5">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 rounded-md py-2 text-left text-2xl font-semibold leading-tight sm:text-3xl"
        aria-expanded={open}
        onClick={onToggle}
      >
        {title}
        <ChevronDown className={cn("h-6 w-6 shrink-0 text-white/50 transition", open && "rotate-180")} />
      </button>
      {open ? <div className="mt-4 grid gap-3">{children}</div> : null}
    </section>
  );
}

function MobileLink({ href, label, description, onClick, icon: Icon }) {
  return (
    <Link href={href} className="flex min-w-0 items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 sm:p-4" onClick={onClick}>
      <span className="flex min-w-0 gap-3">
        {Icon ? <Icon className="mt-1 h-4 w-4 shrink-0 text-white/50" /> : null}
        <span className="min-w-0">
          <span className="block break-words text-base font-semibold leading-snug text-white sm:text-lg">{label}</span>
          {description ? <span className="mt-1 block break-words text-sm leading-6 text-white/60">{description}</span> : null}
        </span>
      </span>
      <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-white/40" />
    </Link>
  );
}

export function SiteHeader() {
  const { user } = useUser();
  const headerRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOpenSection, setMobileOpenSection] = useState("services");
  const [activeDesktopMenu, setActiveDesktopMenu] = useState(null);
  const [activeServiceChoiceId, setActiveServiceChoiceId] = useState(defaultServiceChoice.id);
  const [activeIndustrySlug, setActiveIndustrySlug] = useState(industryPages[0]?.slug || "");
  const [hasScrolled, setHasScrolled] = useState(false);
  const greetingName = user?.firstName || user?.fullName || user?.username || "there";
  const elevated = hasScrolled || mobileMenuOpen;
  const desktopMenus = useMemo(
    () => [
      { id: "services", label: "Services" },
      { id: "solutions", label: "Industries" },
      { id: "learn", label: "Resources" },
    ],
    [],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateScrolled = () => setHasScrolled(window.scrollY > 8);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });

    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!activeDesktopMenu) {
      return;
    }

    function handlePointerDown(event) {
      if (headerRef.current?.contains(event.target)) {
        return;
      }
      setActiveDesktopMenu(null);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setActiveDesktopMenu(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDesktopMenu]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    setMobileOpenSection("services");
  }

  function toggleMobileMenu() {
    setActiveDesktopMenu(null);
    setMobileMenuOpen((current) => {
      const next = !current;
      if (next) {
        setMobileOpenSection("services");
      }
      return next;
    });
  }

  function closeDesktopMenu() {
    setActiveDesktopMenu(null);
  }

  function toggleDesktopMenu(menuId) {
    setMobileMenuOpen(false);
    setActiveDesktopMenu((current) => (current === menuId ? null : menuId));
  }

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 border-b text-white backdrop-blur-xl transition-all duration-300",
        elevated
          ? "border-white/15 bg-[#0b0e14]/95 shadow-[0_20px_60px_-46px_rgba(2,6,23,0.95)]"
          : "border-white/10 bg-[#101318]/95 shadow-none",
      )}
    >
      {activeDesktopMenu ? (
        <button
          type="button"
          className="fixed inset-x-0 top-[68px] z-30 hidden h-[calc(100vh-68px)] cursor-default bg-slate-950/60 backdrop-blur-[2px] xl:block"
          aria-label="Close menu"
          onClick={closeDesktopMenu}
        />
      ) : null}

      <div className={cn("relative z-40 mx-auto flex w-full max-w-[1520px] items-center gap-3 px-3 transition-[padding] duration-300 sm:gap-5 sm:px-6 lg:px-8", elevated ? "py-3" : "py-4")}>
        <Link href="/" className="flex shrink-0 items-center" aria-label="ElevenOrbits home">
          <BrandLogo className="h-9 w-[158px] sm:h-11 sm:w-[196px] md:h-12 md:w-[230px]" imageClassName="w-full brightness-0 invert" priority />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-7 text-sm font-semibold xl:flex">
          <Link href="/pricing" className="relative py-2 text-white/70 transition hover:text-white">
            Pricing
          </Link>
          {desktopMenus.map((menu) => (
            <div key={menu.id} className="relative">
              <DesktopTrigger
                label={menu.label}
                active={activeDesktopMenu === menu.id}
                onClick={() => toggleDesktopMenu(menu.id)}
              />
              {activeDesktopMenu === "services" && menu.id === "services" ? (
                <ServicesMegaMenu
                  activeChoiceId={activeServiceChoiceId}
                  setActiveChoiceId={setActiveServiceChoiceId}
                  onNavigate={closeDesktopMenu}
                />
              ) : null}
              {activeDesktopMenu === "solutions" && menu.id === "solutions" ? (
                <SolutionsMegaMenu
                  activeIndustrySlug={activeIndustrySlug}
                  setActiveIndustrySlug={setActiveIndustrySlug}
                  onNavigate={closeDesktopMenu}
                />
              ) : null}
              {activeDesktopMenu === "learn" && menu.id === "learn" ? (
                <LearnMegaMenu onNavigate={closeDesktopMenu} />
              ) : null}
            </div>
          ))}
          <Link href="/contact" className="relative py-2 text-white/70 transition hover:text-white">
            Contact
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <SignedOut>
            <Link href={getLoginPath()} className="hidden items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white sm:inline-flex">
              <LogIn className="h-4 w-4" />
              Log In
            </Link>
            <Link
              href={getSignupPath()}
              className="hidden min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 sm:inline-flex"
            >
              Get Started
            </Link>
          </SignedOut>
          <SignedIn>
            <p className="hidden text-sm font-medium text-white/70 md:block">Hi, {greetingName}</p>
            <Link href="/portal" className="hidden sm:block">
              <Button variant="ghost" className="min-h-10 rounded-md px-4 py-2 text-white hover:bg-white/10 hover:text-white">Portal</Button>
            </Link>
            <UserButton />
          </SignedIn>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-white/[0.06] text-white shadow-sm transition hover:border-white/25 hover:bg-white/10 xl:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="site-mobile-menu"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mounted && mobileMenuOpen
        ? createPortal(
            <div
              id="site-mobile-menu"
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[100] overflow-x-hidden overflow-y-auto bg-slate-950 text-white xl:hidden"
            >
              <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <Link href="/" className="min-w-0 shrink" aria-label="ElevenOrbits home" onClick={closeMobileMenu}>
                    <BrandLogo className="h-9 w-[168px] sm:h-10 sm:w-[188px]" imageClassName="brightness-0 invert" priority />
                  </Link>
                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-white sm:h-11 sm:w-11"
                    aria-label="Close menu"
                    onClick={closeMobileMenu}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-7 min-w-0 flex-1 sm:mt-9">
                  <MobileSection
                    title="Services"
                    open={mobileOpenSection === "services"}
                    onToggle={() => setMobileOpenSection((current) => (current === "services" ? "" : "services"))}
                  >
                    {serviceChoices.map((choice) => (
                      <MobileLink
                        key={choice.id}
                        href={choice.href}
                        label={choice.label}
                        description={choice.eyebrow}
                        icon={choice.icon}
                        onClick={closeMobileMenu}
                      />
                    ))}
                  </MobileSection>

                  <MobileSection
                    title="Industries"
                    open={mobileOpenSection === "solutions"}
                    onToggle={() => setMobileOpenSection((current) => (current === "solutions" ? "" : "solutions"))}
                  >
                    {industryPages.slice(0, 6).map((industry) => (
                      <MobileLink
                        key={industry.slug}
                        href={`/industries/${industry.slug}`}
                        label={industry.title}
                        description={industry.description}
                        icon={Building2}
                        onClick={closeMobileMenu}
                      />
                    ))}
                  </MobileSection>

                  <MobileSection
                    title="Resources"
                    open={mobileOpenSection === "learn"}
                    onToggle={() => setMobileOpenSection((current) => (current === "learn" ? "" : "learn"))}
                  >
                    {resourcePages.slice(0, 6).map((resource) => (
                      <MobileLink
                        key={resource.slug}
                        href={`/resources/${resource.slug}`}
                        label={resource.title}
                        description={resource.description}
                        icon={BookOpen}
                        onClick={closeMobileMenu}
                      />
                    ))}
                  </MobileSection>

                  <div className="border-t border-white/10 py-5">
                    <div className="grid gap-2">
                      <MobileLink href="/pricing" label="Pricing" description="Compare plans, fixed pricing, and contact-sales services." icon={FileText} onClick={closeMobileMenu} />
                      <MobileLink href="/contact" label="Contact" description="Route sales, support, billing, and security requests." icon={Headset} onClick={closeMobileMenu} />
                    </div>
                  </div>
                </nav>

                <div className="mt-8 grid gap-3 border-t border-white/10 pt-6">
                  <SignedOut>
                    <Link href={getSignupPath()} className="rounded-md bg-white px-4 py-3 text-center text-base font-semibold text-slate-950" onClick={closeMobileMenu}>
                      Get Started
                    </Link>
                    <Link href={getLoginPath()} className="rounded-md border border-white/15 px-4 py-3 text-center text-base font-semibold text-white" onClick={closeMobileMenu}>
                      Log In
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/portal" className="rounded-md bg-white px-4 py-3 text-center text-base font-semibold text-slate-950" onClick={closeMobileMenu}>
                      Open Portal
                    </Link>
                  </SignedIn>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
