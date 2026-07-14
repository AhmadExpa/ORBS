import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  CloudCog,
  Cpu,
  Globe2,
  Headphones,
  LockKeyhole,
  PackageCheck,
  PhoneCall,
  ShieldCheck,
  Wallet,
  Workflow,
} from "lucide-react";
import { formatCurrency, getPurchasePath, getSignupPath, productPlanSeeds, serviceCategories, serviceFamilies } from "@/lib/shared";
import { ServiceLogo, getCategoryBrand } from "./service-branding";
import { TechStackShowcase } from "./tech-stack-showcase";

const activePlans = productPlanSeeds.filter((plan) => plan.isActive !== false);
const activeCategories = serviceCategories.filter((category) => category.isActive !== false);

const subjectDetails = {
  "Managed Cloud": {
    number: "01",
    eyebrow: "Cloud operations",
    primaryCategorySlug: "vps",
    promise: "Managed hosting, storage, CDN, and self-hosted app operations with provisioning notes and renewal records attached.",
    managedLine: "Servers, storage, edge delivery, app hosting, access handoff, billing records, and support continuity.",
    background: "border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#ecfeff_100%)]",
    accent: "text-[#ff6b00]",
    iconShell: "border-orange-200 bg-orange-50",
    chip: "border-orange-200 bg-white/75 text-slate-800",
    icon: CloudCog,
    iconClassName: "border-orange-200 bg-orange-50 text-[#ff7a1a]",
    panelClassName: "from-orange-50 via-white to-cyan-50",
  },
  "Call Centers": {
    number: "02",
    eyebrow: "Voice operations",
    primaryCategorySlug: "vicidial",
    promise: "Dialer operations, SIP routing, queue support, and service coordination for teams that need context preserved.",
    managedLine: "Vicidial, Asterisk, SIP routing, campaign support, queue behavior, service issues, and operational runbooks.",
    background: "border-blue-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_50%,#f8fafc_100%)]",
    accent: "text-blue-700",
    iconShell: "border-blue-200 bg-blue-50",
    chip: "border-blue-200 bg-white/75 text-slate-800",
    icon: PhoneCall,
    iconClassName: "border-blue-200 bg-blue-50 text-blue-700",
    panelClassName: "from-blue-50 via-white to-slate-50",
  },
  "AI Services": {
    number: "03",
    eyebrow: "AI enablement",
    primaryCategorySlug: "ai-servers",
    promise: "GPU-ready servers, n8n workflow operations, model integrations, and private AI rollout support.",
    managedLine: "AI servers, model access, workflow automation, n8n operations, private rollout planning, and support routing.",
    background: "border-violet-200 bg-[linear-gradient(135deg,#f5f3ff_0%,#ffffff_48%,#ecfeff_100%)]",
    accent: "text-violet-700",
    iconShell: "border-violet-200 bg-violet-50",
    chip: "border-violet-200 bg-white/75 text-slate-800",
    icon: BrainCircuit,
    iconClassName: "border-violet-200 bg-violet-50 text-violet-700",
    panelClassName: "from-violet-50 via-white to-cyan-50",
  },
  Cybersecurity: {
    number: "04",
    eyebrow: "Security operations",
    primaryCategorySlug: "cybersecurity",
    promise: "Hardening, monitoring guidance, response readiness, and policy follow-up for hosted systems.",
    managedLine: "Security baselines, access review, WAF and SIEM guidance, patch governance, and incident-readiness coordination.",
    background: "border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_50%,#f8fafc_100%)]",
    accent: "text-emerald-700",
    iconShell: "border-emerald-200 bg-emerald-50",
    chip: "border-emerald-200 bg-white/75 text-slate-800",
    icon: ShieldCheck,
    iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    panelClassName: "from-emerald-50 via-white to-slate-50",
  },
};

const promoTiles = [
  {
    title: "Managed cloud operations",
    body: "Servers, storage, edge delivery, hosted apps, renewal records, and support context stay under one operating model.",
    href: "/services",
    label: "Explore cloud",
    categorySlugs: ["vps", "vds", "cdn", "object-storage"],
    theme: "from-[#ff7a1a] to-[#ff9f47]",
    icon: CloudCog,
    iconTone: "text-slate-950",
  },
  {
    title: "AI and automation delivery",
    body: "AI servers, n8n workflows, model access, private deployment planning, and rollout support are managed together.",
    href: "/ai-services",
    label: "Explore AI",
    categorySlugs: ["ai-servers", "workflows", "ai-solutions"],
    theme: "from-slate-950 to-[#142238]",
    icon: Workflow,
    iconTone: "text-slate-950",
  },
];

const proofCards = [
  {
    title: "Orders keep context",
    body: "Plan selection, configuration notes, invoices, and support follow-up stay connected to the customer record.",
    icon: ClipboardCheck,
  },
  {
    title: "Wallet-first renewals",
    body: "Renewals can check wallet balance before saved-card fallback when card billing is available.",
    icon: Wallet,
  },
  {
    title: "Support has ownership",
    body: "Tickets, service notes, active subscriptions, and access handoff remain visible after launch.",
    icon: Headphones,
  },
];

const journeySteps = [
  {
    eyebrow: "Portal order flow",
    title: "From idea to an approved managed service.",
    body: "Customers choose a service lane, select the plan, leave the operational details, and keep the order visible through the portal.",
    href: "/services",
    cta: "Browse services",
    icon: PackageCheck,
    imageSide: "left",
    bullets: ["Service intent captured", "Invoice and payment state attached", "Trial and custom requests stay visible"],
  },
  {
    eyebrow: "Provisioning handoff",
    title: "Setup is handled with notes, credentials, and billing context.",
    body: "ElevenOrbits manages the handoff instead of leaving customers with disconnected vendor dashboards and unclear support paths.",
    href: "/process",
    cta: "View process",
    icon: LockKeyhole,
    imageSide: "right",
    bullets: ["Provisioning notes", "Credential assignment", "Support-ready service record"],
  },
];

const operatingStandards = [
  "Portal order, invoice, and billing state stay attached.",
  "Provisioning notes, credentials, and support history stay visible.",
  "The customer sees one accountable service model after launch.",
];

const aiHighlights = [
  {
    title: "AI Servers",
    body: "GPU-ready environments for managed model workloads.",
    icon: Cpu,
    tone: "text-violet-300",
  },
  {
    title: "n8n Workflows",
    body: "Community Edition automation on managed infrastructure.",
    icon: Workflow,
    tone: "text-rose-300",
  },
  {
    title: "AI Solutions",
    body: "Model/API access, implementation guidance, and rollout support.",
    icon: BrainCircuit,
    tone: "text-sky-300",
  },
];

const serviceAreaStats = [
  {
    title: "Managed record",
    body: "Orders, invoices, support, and handoff stay attached.",
    icon: ClipboardCheck,
  },
  {
    title: "Global reach",
    body: "Provider stack selected for resilient delivery.",
    icon: Globe2,
  },
  {
    title: "24/7 support",
    body: "Operational follow-up remains accountable.",
    icon: Headphones,
  },
];

const catalogExampleSlugs = [
  "windows-4gb-vps",
  "workflow-starter",
  "object-storage-250gb",
  "cybersecurity-basic",
  "ai-server-starter",
];

function getPlansForCategory(categorySlug) {
  return activePlans
    .filter((plan) => plan.categorySlug === categorySlug)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

function getPriceLabel(plan) {
  if (!plan) {
    return "Contact sales";
  }

  if (plan.displayPriceLabel) {
    return plan.displayPriceLabel;
  }

  if (plan.contactSalesOnly || plan.isCustom || plan.monthlyPrice == null) {
    return "Contact sales";
  }

  return `${formatCurrency(plan.monthlyPrice)}/mo`;
}

function getStartingPlan(plans) {
  return [...plans]
    .filter((plan) => !plan.contactSalesOnly && !plan.isCustom && Number.isFinite(Number(plan.monthlyPrice)))
    .sort((a, b) => Number(a.monthlyPrice) - Number(b.monthlyPrice))[0];
}

function getFamilySummary(family) {
  const plans = family.categorySlugs.flatMap(getPlansForCategory);
  const startingPlan = getStartingPlan(plans);
  return { plans, startingPlan };
}

function getPlanBySlug(slug) {
  return activePlans.find((plan) => plan.slug === slug);
}

function SectionIntro({ eyebrow, title, description, align = "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#ff7a1a]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p> : null}
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[1080px] lg:ml-auto">
      <div className="pointer-events-none absolute inset-x-10 bottom-16 h-28 rounded-full bg-orange-200/35 blur-3xl" />
      <Image
        src="/hero.png"
        alt="ElevenOrbits managed services dashboard with server, AI automation, VoIP, CDN storage, and cybersecurity service cards"
        width={1448}
        height={1086}
        priority
        sizes="(min-width: 1280px) 56vw, (min-width: 1024px) 52vw, 100vw"
        className="relative z-10 h-auto w-full object-contain drop-shadow-[0_42px_80px_rgba(15,23,42,0.16)]"
      />
      <div className="relative z-20 mx-auto mt-2 grid max-w-[860px] gap-2 sm:grid-cols-3">
        {[
          ["Orders", "Configuration context"],
          ["Billing", "Wallet and card fallback"],
          ["Support", "Managed follow-up"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_24px_70px_-58px_rgba(15,23,42,0.78)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#ff7a1a]">{label}</p>
            <p className="mt-1 text-sm font-extrabold text-slate-950">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fb_100%)]">
      <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-55" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(circle_at_28%_16%,rgba(255,122,26,0.16),transparent_34%),radial-gradient(circle_at_78%_22%,rgba(0,105,166,0.13),transparent_32%)]" />
      <div className="relative mx-auto grid max-w-[1580px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.74fr_1.26fr] lg:items-center lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-orange-800 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a1a]" />
            Behind the systems businesses use every day
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-[64px] lg:leading-[1.02]">
            We manage the technology layer behind SMB and corporate operations.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            ElevenOrbits operates the cloud, voice, AI, security, billing, and support systems companies rely on every day, with one accountable service record from order to renewal.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={getSignupPath()} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#ff7a1a] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#ea690d]">
              Open customer portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:bg-slate-50">
              Review catalog pricing
            </Link>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function PromoTilesSection() {
  return (
    <section className="relative z-10 border-b border-slate-200 bg-[#f7f9fb]">
      <div className="mx-auto grid max-w-[1320px] gap-4 px-4 py-10 sm:px-6 lg:-mt-10 lg:grid-cols-2 lg:px-8">
        {promoTiles.map((tile) => {
          const Icon = tile.icon;

          return (
            <Link key={tile.title} href={tile.href} className={`group relative min-h-[260px] overflow-hidden rounded-2xl bg-gradient-to-br ${tile.theme} p-6 text-white shadow-[0_36px_120px_-78px_rgba(15,23,42,0.98)] ring-1 ring-white/50`}>
              <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/16 blur-3xl" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
              <div className="relative flex items-start justify-between gap-5">
                <div className="max-w-xl">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/60 bg-white/90 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_20px_55px_-38px_rgba(0,0,0,0.75)] backdrop-blur">
                    <Icon className={`h-7 w-7 ${tile.iconTone}`} strokeWidth={1.8} />
                  </span>
                  <h2 className="mt-8 text-2xl font-extrabold tracking-tight">{tile.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/75">{tile.body}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </span>
              </div>
              <span className="relative mt-8 inline-flex rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm font-extrabold">{tile.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <SectionIntro
            eyebrow="Managed Proof"
            title="Customers succeed when every service keeps its operating record."
            description="The homepage focuses on the operational model behind each service, not disconnected feature claims."
          />
          <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_56%,#eff6ff_100%)] p-5 shadow-[0_30px_110px_-86px_rgba(15,23,42,0.88)]">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Order", "Plan, configuration, invoice"],
                ["Operate", "Provisioning and credentials"],
                ["Support", "Tickets and renewals"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/80 bg-white/80 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#ff7a1a]">{label}</p>
                  <p className="mt-2 text-sm font-extrabold leading-5 text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {proofCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="eo-premium-card rounded-2xl border border-slate-200 bg-[#fbfcfd] p-6 shadow-[0_24px_80px_-70px_rgba(15,23,42,0.85)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#ff7a1a] ring-1 ring-orange-100">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function JourneyVisual({ step }) {
  const Icon = step.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_52%,#eff6ff_100%)] p-5 shadow-[0_30px_100px_-82px_rgba(15,23,42,0.95)]">
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#ff7a1a]/16 blur-3xl" />
      <div className="relative rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Icon className="h-5 w-5" />
          </span>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-orange-700">
            Managed
          </span>
        </div>
        <div className="mt-5 grid gap-3">
          {step.bullets.map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-slate-500 ring-1 ring-slate-200">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-extrabold text-slate-800">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JourneySection() {
  return (
    <section className="border-b border-slate-200 bg-[#f7f9fb]">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8">
        <SectionIntro align="center" eyebrow="From Idea To Online" title="A quicker path from request to managed operation." />
        <div className="mt-12 grid gap-14">
          {journeySteps.map((step) => (
            <div key={step.title} className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className={step.imageSide === "right" ? "lg:order-2" : ""}>
                <JourneyVisual step={step} />
              </div>
              <div className="max-w-xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#ff7a1a]">{step.eyebrow}</p>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{step.title}</h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">{step.body}</p>
                <Link href={step.href} className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#0069a6] transition hover:text-[#004d7a]">
                  {step.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricsBand() {
  const metrics = [
    { value: `${serviceFamilies.length}`, label: "Operating lanes" },
    { value: `${activeCategories.length}`, label: "Service lines" },
    { value: `${activePlans.length}`, label: "Active catalog plans" },
    { value: "Owned", label: "Managed service model" },
  ];

  return (
    <section className="relative overflow-hidden border-y border-slate-800 bg-[linear-gradient(135deg,#070b16_0%,#10172a_54%,#070b16_100%)] text-white">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,122,26,0.2),transparent_64%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />
      <div className="relative w-full px-4 py-16 sm:px-6 lg:px-8 2xl:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-orange-300">More power and control</p>
              <h2 className="mt-4 max-w-xl text-3xl font-extrabold tracking-tight sm:text-5xl">Managed service depth without scattered ownership.</h2>
              <div className="mt-7 grid gap-3">
                {operatingStandards.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-white/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="relative min-h-32 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.075] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  <p className="text-3xl font-extrabold text-white">{metric.value}</p>
                  <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/45">{metric.label}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AIHighlightSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#f7f9fb]">
      <div className="relative mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_36px_120px_-92px_rgba(15,23,42,0.95)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_62%,#f8fafc_100%)] p-7 lg:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-orange-200/55 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#ff7a1a]">Human-led, AI-managed</p>
              <h2 className="mt-4 max-w-xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">AI services without abandoned experiments.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">AI servers, automation, and model access stay attached to support, billing, and deployment context.</p>
              <Link href="/ai-services" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-800">
                View AI services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="grid gap-0 divide-y divide-slate-200 bg-[#fbfcfd] p-4 lg:p-5">
            {aiHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="grid gap-4 py-5 first:pt-2 last:pb-2 sm:grid-cols-[72px_1fr] sm:items-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-[0_24px_70px_-52px_rgba(15,23,42,0.85)]">
                    <Icon className={`h-7 w-7 ${item.tone}`} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
function ServiceAreaPills({ items = [], tone = "border-slate-200 bg-white/70 text-slate-700" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.slice(0, 3).map((item) => (
        <span key={item} className={`rounded-lg border px-3 py-1.5 text-[11px] font-extrabold ${tone}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function ServiceAreaArt({ name }) {
  if (name === "Managed Cloud") {
    return (
      <div className="pointer-events-none absolute bottom-8 right-2 hidden h-72 w-72 opacity-90 md:block">
        <div className="absolute bottom-8 right-5 h-24 w-40 rotate-[-16deg] rounded-[2rem] border border-orange-200 bg-white/80 shadow-[0_34px_70px_-46px_rgba(15,23,42,0.55)]" />
        <div className="absolute bottom-24 right-16 h-28 w-28 rounded-full bg-[linear-gradient(145deg,#ffffff,#e8e2d8)] shadow-[0_30px_70px_-44px_rgba(15,23,42,0.52)]" />
        <div className="absolute bottom-28 right-[7.75rem] h-20 w-20 rounded-full bg-[linear-gradient(145deg,#ffffff,#eee8df)]" />
        <div className="absolute bottom-[5.25rem] right-4 h-20 w-20 rounded-full bg-[linear-gradient(145deg,#ffffff,#e7ded2)]" />
        <div className="absolute bottom-4 right-20 h-3 w-28 rounded-full bg-orange-200/70 blur-md" />
      </div>
    );
  }

  if (name === "Call Centers") {
    return (
      <div className="pointer-events-none absolute right-5 top-8 hidden h-40 w-64 opacity-70 md:block">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(37,99,235,0.42) 1.2px, transparent 1.2px)",
            backgroundSize: "10px 10px",
          }}
        />
        <div className="absolute right-10 top-8 h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_0_10px_rgba(59,130,246,0.12)]" />
        <div className="absolute right-[7.5rem] top-20 h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_0_10px_rgba(59,130,246,0.12)]" />
      </div>
    );
  }

  if (name === "AI Services") {
    return (
      <div className="pointer-events-none absolute bottom-8 right-8 hidden h-36 w-36 opacity-80 md:block">
        <div className="absolute left-12 top-4 h-16 w-16 rotate-45 rounded-xl bg-violet-300/40 shadow-[0_28px_60px_-40px_rgba(109,40,217,0.9)]" />
        <div className="absolute left-4 top-20 h-14 w-14 rotate-45 rounded-xl bg-violet-500/28" />
        <div className="absolute left-20 top-20 h-14 w-14 rotate-45 rounded-xl bg-sky-300/32" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute bottom-4 right-0 hidden h-44 w-44 opacity-80 md:block">
      <div className="absolute bottom-7 right-8 h-28 w-28 rounded-[2rem] border border-emerald-200 bg-emerald-100/55 shadow-[0_28px_70px_-44px_rgba(6,95,70,0.65)]" />
      <div className="absolute bottom-12 right-12 h-20 w-20 rounded-[1.6rem] border border-emerald-300 bg-white/80" />
      <ShieldCheck className="absolute bottom-[4.5rem] right-[4.5rem] h-9 w-9 text-emerald-700" strokeWidth={1.7} />
    </div>
  );
}

function FeaturedServiceCard({ lane }) {
  const Icon = lane.icon;

  return (
    <article className={`relative min-h-[620px] overflow-hidden rounded-[1.7rem] border border-orange-200 bg-gradient-to-br ${lane.panelClassName} p-7 shadow-[0_38px_120px_-88px_rgba(15,23,42,0.92)]`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
      <ServiceAreaArt name={lane.name} />
      <div className="relative flex h-full flex-col">
        <span className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${lane.iconClassName}`}>
          <Icon className="h-8 w-8" strokeWidth={1.65} />
        </span>
        <div className="mt-10">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#ff7a1a]">{lane.number} {lane.eyebrow}</p>
          <h3 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950">{lane.name}</h3>
          <p className="mt-5 max-w-sm text-sm font-medium leading-7 text-slate-600">{lane.promise}</p>
        </div>
        <div className="mt-9 max-w-xs">
          <ServiceAreaPills items={lane.includes} tone={lane.chip} />
        </div>
        <Link href={lane.subjectHref} className="mt-auto inline-flex w-fit items-center gap-4 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-extrabold text-slate-950 transition hover:border-orange-200 hover:bg-white">
          Explore lane
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function ServiceAreaCard({ lane, wide = false }) {
  const Icon = lane.icon;

  return (
    <article className={`relative overflow-hidden rounded-[1.45rem] border border-slate-200 bg-gradient-to-br ${lane.panelClassName} p-6 shadow-[0_30px_95px_-82px_rgba(15,23,42,0.9)] ${wide ? "min-h-[255px]" : "min-h-[338px]"}`}>
      <ServiceAreaArt name={lane.name} />
      <div className={`relative grid h-full gap-5 ${wide ? "md:grid-cols-[76px_minmax(0,1fr)]" : ""}`}>
        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${lane.iconClassName}`}>
          <Icon className="h-7 w-7" strokeWidth={1.7} />
        </span>
        <div>
          <p className={`text-[11px] font-extrabold uppercase tracking-[0.2em] ${lane.accent}`}>{lane.number} {lane.eyebrow}</p>
          <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{lane.name}</h3>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">{lane.promise}</p>
          <div className="mt-6">
            <ServiceAreaPills items={lane.includes} tone={lane.chip} />
          </div>
          <Link href={lane.subjectHref} className="mt-7 inline-flex items-center gap-4 text-sm font-extrabold text-slate-950 transition hover:text-[#ff7a1a]">
            Explore lane
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function OperatingLanesSection() {
  const lanes = serviceFamilies.map((family) => {
    const details = subjectDetails[family.name] || {};
    const { startingPlan } = getFamilySummary(family);

    return {
      ...family,
      ...details,
      icon: details.icon || CloudCog,
      subjectHref: `/${family.pageSlug}`,
      orderHref: startingPlan ? getPurchasePath(startingPlan) : "/contact",
      includes: family.includes,
    };
  });
  const cloudLane = lanes.find((lane) => lane.name === "Managed Cloud") || lanes[0];
  const callLane = lanes.find((lane) => lane.name === "Call Centers");
  const aiLane = lanes.find((lane) => lane.name === "AI Services");
  const securityLane = lanes.find((lane) => lane.name === "Cybersecurity");

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full border border-slate-200/70 opacity-60" />
      <div className="grid w-full gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(320px,0.32fr)_minmax(0,0.68fr)] lg:px-8 2xl:px-10">
        <div className="lg:pt-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#0069a6]">Our service areas</p>
          <h2 className="mt-6 text-5xl font-extrabold leading-[0.98] tracking-tight text-slate-950 lg:text-6xl">
            Enterprise-grade operations.
            <span className="block">Built for what is next.</span>
          </h2>
          <div className="mt-8 h-px w-20 bg-[#ff7a1a]" />
          <p className="mt-8 max-w-md text-base leading-8 text-slate-600">
            Integrated solutions across cloud, voice, AI, and security, designed to keep business operations secure, efficient, and accountable.
          </p>

          <div className="mt-10 grid gap-5 border-y border-slate-200 py-7 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {serviceAreaStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div key={stat.title}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 shadow-sm">
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </span>
                  <p className="mt-4 text-sm font-extrabold text-slate-950">{stat.title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{stat.body}</p>
                </div>
              );
            })}
          </div>

          <Link href="/contact" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white shadow-[0_20px_55px_-36px_rgba(15,23,42,0.9)] transition hover:bg-slate-800">
            Talk to an expert
            <ArrowRight className="ml-3 h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          {cloudLane ? <FeaturedServiceCard lane={cloudLane} /> : null}
          <div className="grid gap-4">
            {callLane ? <ServiceAreaCard lane={callLane} wide /> : null}
            <div className="grid gap-4 md:grid-cols-2">
              {aiLane ? <ServiceAreaCard lane={aiLane} /> : null}
              {securityLane ? <ServiceAreaCard lane={securityLane} /> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingPreviewSection() {
  const examples = catalogExampleSlugs.map(getPlanBySlug).filter(Boolean);

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionIntro
            eyebrow="Pricing Preview"
            title="Get managed-service pricing while you compare."
            description="These examples come from the same local product catalog used by checkout. The full pricing page shows all contract options and service lanes."
          />
          <Link href="/pricing" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-800">
            Full pricing catalog
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {examples.map((plan) => {
            const brand = getCategoryBrand(plan.categorySlug);
            return (
              <Link key={plan.slug} href={getPurchasePath(plan)} className="group eo-premium-card rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 shadow-sm transition hover:border-slate-300 hover:bg-white">
                <ServiceLogo brand={brand} imageClassName="h-9 w-9" className="[&>span:first-child]:h-10 [&>span:first-child]:w-10" />
                <p className="mt-5 min-h-10 text-sm font-extrabold leading-5 text-slate-950">{plan.name}</p>
                <p className="mt-3 text-lg font-extrabold text-[#ff7a1a]">{getPriceLabel(plan)}</p>
                <span className="mt-4 inline-flex items-center text-xs font-extrabold text-slate-500 transition group-hover:text-slate-950">
                  Configure
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#080b18] text-white">
      <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-[0.06]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(135deg,transparent_0%,rgba(255,122,26,0.2)_100%)]" />
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-orange-300">Not sure which service to choose?</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">Start with the portal or route the request to sales.</h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65">
            Create an account for structured orders and trial requests, or contact the team for scoped managed work.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={getSignupPath()} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#ff7a1a] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#e66a12]">
            Create account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-white/15">
            Talk to sales
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="overflow-x-clip bg-white text-slate-900">
      <HeroSection />
      <PromoTilesSection />
      <ProofSection />
      <JourneySection />
      <MetricsBand />
      <AIHighlightSection />
      <TechStackShowcase compact />
      <OperatingLanesSection />
      <PricingPreviewSection />
      <FinalCtaSection />
    </div>
  );
}
