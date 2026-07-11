"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { getLoginPath, getOrderPath, getSignupPath, productPlanSeeds, serviceVerticals } from "@/lib/shared";
import { industryPages, resourcePages } from "@/lib/marketing-content";
import { ServiceLogoCluster } from "@/components/marketing/service-branding";
import { BrandLogo } from "./brand-logo";

const planMap = new Map(productPlanSeeds.map((plan) => [plan.slug, plan]));

function plansFor(slugs) {
  return slugs.map((slug) => planMap.get(slug)).filter(Boolean);
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
    id: "automation",
    label: "n8n Automation",
    eyebrow: "Workflows and integrations",
    href: "/services/workflows",
    icon: Workflow,
    categorySlugs: ["workflows"],
    description: "Choose automation when forms, webhooks, CRMs, AI tasks, approvals, and internal operations need managed workflows.",
    chooseWhen: ["A process repeats often", "Apps need API or webhook handoff", "You need monitoring and revision support"],
    paths: [
      { label: "Workflow build", description: "n8n flows for forms, approvals, CRMs, and internal tools.", href: "/services/workflows" },
      { label: "AI workflow operations", description: "Prompts, webhooks, and model calls wrapped in monitored flows.", href: "/services/workflows" },
      { label: "Integration support", description: "APIs, credentials, retries, and production handoff.", href: "/services/workflows" },
    ],
    planSlugs: ["workflow-starter", "workflow-growth", "workflow-enterprise"],
  },
  {
    id: "ai",
    label: "AI and DeepSeek",
    eyebrow: "AI servers and API support",
    href: "/ai-services",
    icon: Cpu,
    categorySlugs: ["ai-servers", "ai-solutions"],
    description: "Choose AI services for managed AI servers, DeepSeek API access, private deployment guidance, and practical rollout support.",
    chooseWhen: ["You need AI infrastructure or API guardrails", "Private model deployment is being evaluated", "AI workflows need operations support"],
    paths: [
      { label: "AI server hosting", description: "Managed compute and deployment support for model workloads.", href: "/ai-services" },
      { label: "DeepSeek API access", description: "Managed access, guardrails, and implementation guidance.", href: "/services/ai-solutions" },
      { label: "Private model planning", description: "Architecture review for private or open-source deployment.", href: "/contact" },
    ],
    planSlugs: ["ai-server-starter", "ai-server-scale", "deepseek-api-access", "open-source-deepseek-services"],
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

const deliverySteps = [
  { label: "Configure", description: "Plan, add-ons, and service-specific requirements." },
  { label: "Approve", description: "Contract review before delegated access and provisioning." },
  { label: "Operate", description: "Credentials, tickets, billing, renewals, and agents in portal." },
];

const companyLinks = [
  { href: "/about", label: "About ElevenOrbits", description: "How services, billing, support, and operations connect.", icon: Building2 },
  { href: "/process", label: "Delivery Process", description: "How orders move into provisioning and handoff.", icon: Workflow },
  { href: "/tech-stack", label: "Operating Stack", description: "Platforms, logos, and managed products behind delivery.", icon: Server },
  { href: "/contact", label: "Contact Routing", description: "Sales, support, billing, and security inquiries.", icon: Headset },
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
      className="group rounded-md border border-slate-200 bg-white px-3 py-2.5 transition hover:border-sky-200 hover:bg-sky-50/50"
      onClick={onNavigate}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-950">{plan.name}</span>
          <span className="mt-0.5 block truncate text-xs text-slate-500">{plan.displayPriceLabel || "Contact sales"}</span>
        </span>
        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
      </span>
    </Link>
  );
}

function MegaFrame({ children }) {
  return (
    <div className="fixed left-1/2 top-[62px] z-50 hidden w-[min(1260px,calc(100vw-3rem))] -translate-x-1/2 pt-4 xl:block">
      <div className="max-h-[calc(100vh-6rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_46px_120px_-56px_rgba(2,6,23,0.72)]">
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
      <div className="grid bg-white xl:grid-cols-[340px_minmax(0,1fr)_340px]">
        <section className="flex min-h-[610px] flex-col bg-slate-950 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Managed catalog</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">Choose the service lane before checkout.</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Hover a service to compare use case, configuration path, and order-ready plans.
          </p>

          <div className="mt-6 grid gap-1.5">
            {serviceChoices.map((choice) => {
              const ChoiceIcon = choice.icon;
              const active = choice.id === activeChoice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  onMouseEnter={() => setActiveChoiceId(choice.id)}
                  onFocus={() => setActiveChoiceId(choice.id)}
                  onClick={() => setActiveChoiceId(choice.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition",
                    active ? "bg-white text-slate-950 shadow-sm" : "text-white/70 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", active ? "bg-slate-950 text-white" : "bg-white/[0.06] text-white/50")}>
                    <ChoiceIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{choice.label}</span>
                    <span className={cn("mt-0.5 block truncate text-xs", active ? "text-slate-500" : "text-white/40")}>{choice.eyebrow}</span>
                  </span>
                  <ArrowRight className={cn("ml-auto h-3.5 w-3.5 transition", active ? "text-slate-500" : "text-white/25 group-hover:translate-x-0.5")} />
                </button>
              );
            })}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
            <Link href="/services" className="rounded-md border border-white/15 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10" onClick={onNavigate}>
              All services
            </Link>
            <Link href="/pricing" className="rounded-md bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-100" onClick={onNavigate}>
              Pricing
            </Link>
          </div>
        </section>

        <section className="min-w-0 bg-white p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">{activeChoice.eyebrow}</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{activeChoice.label}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{activeChoice.description}</p>
              <ServiceLogoCluster categorySlugs={activeChoice.categorySlugs} max={5} className="mt-5" />
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">What to choose</p>
                <h4 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-slate-950">Pick the path that matches the workload.</h4>
              </div>
              <Link href={activeChoice.href} className="hidden text-sm font-semibold text-sky-700 transition hover:text-sky-950 sm:inline-flex" onClick={onNavigate}>
                Open service page
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {pathItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50/50"
                  onClick={onNavigate}
                >
                  <span className="block text-sm font-semibold text-slate-950">{item.label}</span>
                  <span className="mt-2 block text-xs leading-5 text-slate-500">{item.description}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                    Review
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-7 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
            {deliverySteps.map((step, index) => (
              <div key={step.label} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-white">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-950">{step.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">{step.description}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link href={activeChoice.href} onClick={onNavigate}>
              <Button variant="outline" className="min-h-10 w-full rounded-md px-3 py-2">View Service</Button>
            </Link>
            <Link href={getSignupPath()} onClick={onNavigate}>
              <Button className="min-h-10 w-full rounded-md bg-slate-950 px-3 py-2 hover:bg-black">Start Account</Button>
            </Link>
          </div>
        </section>

        <section className="border-l border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Popular plans</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Start with a plan, then add configuration details in the portal before approval and provisioning.
          </p>
          <div className="mt-5 grid gap-2">
            {plans.map((plan) => (
              <PlanCard key={plan.slug} plan={plan} onNavigate={onNavigate} />
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-950">Need a custom configuration?</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">Use contact routing for enterprise scope, migration, carrier, or security review before order placement.</p>
            <Link href="/contact" className="mt-4 inline-flex text-sm font-semibold text-sky-700 transition hover:text-sky-950" onClick={onNavigate}>
              Contact sales
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </MegaFrame>
  );
}

function SolutionsMegaMenu({ activeIndustrySlug, setActiveIndustrySlug, onNavigate }) {
  const activeIndustry = industryPages.find((industry) => industry.slug === activeIndustrySlug) || industryPages[0];

  return (
    <MegaFrame>
      <div className="grid bg-slate-200 lg:grid-cols-[0.9fr_1.1fr_0.85fr]">
        <section className="bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Industries</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-slate-950">Navigate by business context.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Choose the kind of team you operate. The panel shows why the service mix fits and which pages to review.
          </p>

          <div className="mt-5 grid gap-1.5">
            {industryPages.map((industry) => {
              const active = industry.slug === activeIndustry.slug;
              return (
                <button
                  key={industry.slug}
                  type="button"
                  onMouseEnter={() => setActiveIndustrySlug(industry.slug)}
                  onFocus={() => setActiveIndustrySlug(industry.slug)}
                  onClick={() => setActiveIndustrySlug(industry.slug)}
                  className={cn(
                    "group flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left transition",
                    active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold">{industry.title}</span>
                    <span className={cn("mt-0.5 block text-xs", active ? "text-white/50" : "text-slate-400")}>{industry.eyebrow}</span>
                  </span>
                  <ArrowRight className={cn("h-3.5 w-3.5 shrink-0 transition", active ? "text-white/60" : "text-slate-300 group-hover:translate-x-0.5")} />
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-slate-950 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">{activeIndustry.eyebrow}</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">{activeIndustry.title}</h3>
          <p className="mt-3 text-sm leading-6 text-white/60">{activeIndustry.fit}</p>
          <div className="mt-5 grid gap-2">
            {activeIndustry.outcomes.slice(0, 3).map((outcome) => (
              <div key={outcome} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm leading-6 text-white/75">
                {outcome}
              </div>
            ))}
          </div>
          <Link
            href={`/industries/${activeIndustry.slug}`}
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            onClick={onNavigate}
          >
            Open Industry
          </Link>
        </section>

        <section className="bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Recommended pages</p>
          <div className="mt-4 grid gap-2">
            {activeIndustry.recommended.map((label) => {
              const match = serviceVerticals.find((vertical) => vertical.name === label || vertical.shortName === label || label.includes(vertical.shortName));
              return (
                <Link
                  key={label}
                  href={match ? `/${match.slug}` : "/services"}
                  className="group rounded-md border border-slate-200 bg-white px-3 py-2.5 transition hover:border-sky-200 hover:bg-sky-50/50"
                  onClick={onNavigate}
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-950">
                    {label}
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
                  </span>
                </Link>
              );
            })}
          </div>
          <Link href="/industries" className="mt-5 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-900" onClick={onNavigate}>
            Browse all industries
          </Link>
        </section>
      </div>
    </MegaFrame>
  );
}

function LearnMegaMenu({ activeResourceSlug, setActiveResourceSlug, onNavigate }) {
  const activeResource = resourcePages.find((resource) => resource.slug === activeResourceSlug) || resourcePages[0];

  return (
    <MegaFrame>
      <div className="grid bg-slate-200 lg:grid-cols-[1fr_1fr_0.9fr]">
        <section className="bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Resources</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-slate-950">Guides before you configure.</h2>
          <div className="mt-5 grid gap-1.5">
            {resourcePages.map((resource) => {
              const active = resource.slug === activeResource.slug;
              return (
                <button
                  key={resource.slug}
                  type="button"
                  onMouseEnter={() => setActiveResourceSlug(resource.slug)}
                  onFocus={() => setActiveResourceSlug(resource.slug)}
                  onClick={() => setActiveResourceSlug(resource.slug)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition",
                    active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  <FileText className={cn("h-4 w-4 shrink-0", active ? "text-white/65" : "text-slate-400")} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{resource.title}</span>
                    <span className={cn("mt-0.5 block text-xs", active ? "text-white/50" : "text-slate-400")}>{resource.eyebrow}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">{activeResource.eyebrow}</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-slate-950">{activeResource.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">{activeResource.description}</p>
          <div className="mt-5 grid gap-2">
            {activeResource.sections?.[0]?.points?.slice(0, 3).map((point) => (
              <div key={point} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700">
                {point}
              </div>
            ))}
          </div>
          <Link href={`/resources/${activeResource.slug}`} className="mt-5 inline-flex" onClick={onNavigate}>
            <Button variant="outline" className="min-h-10 rounded-md px-4 py-2">Read Guide</Button>
          </Link>
        </section>

        <section className="bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Company and support</p>
          <div className="mt-4 grid gap-2">
            {companyLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 transition hover:border-sky-200 hover:bg-sky-50/50"
                  onClick={onNavigate}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.description}</span>
                  </span>
                </Link>
              );
            })}
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
        className="flex w-full items-center justify-between gap-4 rounded-md py-2 text-left text-3xl font-semibold tracking-[-0.04em]"
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
    <Link href={href} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4" onClick={onClick}>
      <span className="flex min-w-0 gap-3">
        {Icon ? <Icon className="mt-1 h-4 w-4 shrink-0 text-white/50" /> : null}
        <span className="min-w-0">
          <span className="block text-xl font-semibold tracking-[-0.03em] text-white">{label}</span>
          {description ? <span className="mt-1 block text-sm leading-6 text-white/60">{description}</span> : null}
        </span>
      </span>
      <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-white/40" />
    </Link>
  );
}

export function SiteHeader() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOpenSection, setMobileOpenSection] = useState("services");
  const [activeDesktopMenu, setActiveDesktopMenu] = useState(null);
  const [activeServiceChoiceId, setActiveServiceChoiceId] = useState(defaultServiceChoice.id);
  const [activeIndustrySlug, setActiveIndustrySlug] = useState(industryPages[0]?.slug || "");
  const [activeResourceSlug, setActiveResourceSlug] = useState(resourcePages[0]?.slug || "");
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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b text-white backdrop-blur-xl transition-all duration-300",
        elevated
          ? "border-white/15 bg-[#0b0e14]/95 shadow-[0_20px_60px_-46px_rgba(2,6,23,0.95)]"
          : "border-white/10 bg-[#101318]/95 shadow-none",
      )}
    >
      {activeDesktopMenu ? <div className="fixed inset-x-0 top-[68px] z-30 hidden h-[calc(100vh-68px)] bg-slate-950/60 backdrop-blur-[2px] xl:block" aria-hidden="true" /> : null}

      <div className={cn("relative z-40 mx-auto flex w-full max-w-[1520px] items-center gap-5 px-4 transition-[padding] duration-300 sm:px-6 lg:px-8", elevated ? "py-3" : "py-4")}>
        <Link href="/" className="flex shrink-0 items-center" aria-label="ElevenOrbits home">
          <BrandLogo className="h-11 w-[196px] md:h-12 md:w-[230px]" imageClassName="w-full brightness-0 invert" priority />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-7 text-sm font-semibold xl:flex">
          <Link href="/pricing" className="relative py-2 text-white/70 transition hover:text-white" onMouseEnter={closeDesktopMenu}>
            Pricing
          </Link>
          {desktopMenus.map((menu) => (
            <div
              key={menu.id}
              className="relative"
              onMouseEnter={() => setActiveDesktopMenu(menu.id)}
              onMouseLeave={closeDesktopMenu}
            >
              <DesktopTrigger
                label={menu.label}
                active={activeDesktopMenu === menu.id}
                onClick={() => setActiveDesktopMenu(menu.id)}
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
                <LearnMegaMenu
                  activeResourceSlug={activeResourceSlug}
                  setActiveResourceSlug={setActiveResourceSlug}
                  onNavigate={closeDesktopMenu}
                />
              ) : null}
            </div>
          ))}
          <Link href="/contact" className="relative py-2 text-white/70 transition hover:text-white" onMouseEnter={closeDesktopMenu}>
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
            <Link href="/portal">
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
              className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950 text-white xl:hidden"
            >
              <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 py-5">
                <div className="flex items-center justify-between gap-4">
                  <Link href="/" aria-label="ElevenOrbits home" onClick={closeMobileMenu}>
                    <BrandLogo className="h-10 w-[188px]" imageClassName="brightness-0 invert" priority />
                  </Link>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-md border border-white/15 bg-white/5 text-white"
                    aria-label="Close menu"
                    onClick={closeMobileMenu}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-9 flex-1">
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
