import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Headphones,
  LockKeyhole,
  PackageCheck,
  Wallet,
} from "lucide-react";
import { formatCurrency, getPurchasePath, getSignupPath, productPlanSeeds, serviceCategories, serviceFamilies } from "@/lib/shared";
import { ServiceLogo, ServiceLogoCluster, getCategoryBrand } from "./service-branding";
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
  },
  {
    title: "AI and automation delivery",
    body: "AI servers, n8n workflows, model access, private deployment planning, and rollout support are managed together.",
    href: "/ai-services",
    label: "Explore AI",
    categorySlugs: ["ai-servers", "workflows", "ai-solutions"],
    theme: "from-slate-950 to-[#142238]",
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

const aiHighlights = [
  ["AI Servers", "GPU-ready environments for managed model workloads.", "ai-servers"],
  ["n8n Workflows", "Community Edition automation on managed infrastructure.", "workflows"],
  ["AI Solutions", "Model/API access, implementation guidance, and rollout support.", "ai-solutions"],
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

function uniqueItems(items) {
  return [...new Set(items.filter(Boolean))];
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

function MiniPortalCard({ label, value, icon: Icon, className = "" }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white/95 p-3 shadow-[0_24px_70px_-56px_rgba(15,23,42,0.9)] ${className}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#ff7a1a] ring-1 ring-orange-100">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{label}</span>
          <span className="mt-1 block truncate text-sm font-extrabold text-slate-950">{value}</span>
        </span>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[980px] lg:ml-auto">
      <div className="pointer-events-none absolute inset-x-6 bottom-4 h-24 rounded-full bg-orange-200/35 blur-3xl" />
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white/80 p-3 shadow-[0_42px_130px_-88px_rgba(15,23,42,0.95)]">
        <div className="mb-3 flex items-center justify-between rounded-md border border-slate-200 bg-[#f8fafc] px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff7a1a]" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Customer portal preview</span>
        </div>
        <Image
          src="/hero.png"
          alt="ElevenOrbits managed services dashboard with server, AI automation, VoIP, CDN storage, and cybersecurity service cards"
          width={1448}
          height={1086}
          priority
          sizes="(min-width: 1280px) 54vw, (min-width: 1024px) 50vw, 100vw"
          className="relative h-auto w-full object-contain"
        />
      </div>
      <MiniPortalCard label="Orders" value="Context preserved" icon={ClipboardCheck} className="absolute left-0 top-12 hidden w-56 sm:block" />
      <MiniPortalCard label="Renewals" value="Wallet first" icon={Wallet} className="absolute bottom-10 right-2 hidden w-52 sm:block" />
      <MiniPortalCard label="Support" value="Ticketed follow-up" icon={Headphones} className="absolute right-12 top-24 hidden w-56 lg:block" />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#f7f9fb]">
      <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-orange-50/90 via-white/50 to-transparent" />
      <div className="relative mx-auto grid max-w-[1560px] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.76fr_1.24fr] lg:items-center lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-orange-800 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a1a]" />
            Managed infrastructure with operating ownership
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-[64px] lg:leading-[1.02]">
            Launch managed systems without losing billing, support, or service context.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            ElevenOrbits runs managed cloud, AI services, call-center operations, cybersecurity, and customer portal workflows through one accountable service model.
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

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              [serviceFamilies.length, "operating lanes"],
              [activeCategories.length, "service lines"],
              [activePlans.length, "active plans"],
            ].map(([value, label]) => (
              <div key={label} className="border-l border-slate-300 bg-white/75 px-4 py-3 shadow-[0_20px_70px_-62px_rgba(15,23,42,0.8)]">
                <p className="text-2xl font-extrabold text-slate-950">{value}</p>
                <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function PromoTilesSection() {
  return (
    <section className="relative z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1180px] gap-4 px-4 py-8 sm:px-6 lg:-mt-8 lg:grid-cols-2 lg:px-8">
        {promoTiles.map((tile) => (
          <Link key={tile.title} href={tile.href} className={`group overflow-hidden rounded-lg bg-gradient-to-br ${tile.theme} p-5 text-white shadow-[0_32px_100px_-72px_rgba(15,23,42,0.95)]`}>
            <div className="flex items-start justify-between gap-5">
              <div className="max-w-xl">
                <ServiceLogoCluster categorySlugs={tile.categorySlugs} max={4} className="gap-2" />
                <h2 className="mt-6 text-2xl font-extrabold tracking-tight">{tile.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/75">{tile.body}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-1" />
            </div>
            <span className="mt-6 inline-flex text-sm font-extrabold">{tile.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section className="border-b border-slate-200 bg-[#f8fafc]">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <SectionIntro
          align="center"
          eyebrow="Managed Proof"
          title="Customers succeed when every service keeps its operating record."
          description="The homepage focuses on the operational model behind each service, not disconnected feature claims."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {proofCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-70px_rgba(15,23,42,0.85)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-[#ff7a1a] ring-1 ring-orange-100">
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
    <div className="relative rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_52%,#eff6ff_100%)] p-5 shadow-[0_30px_100px_-82px_rgba(15,23,42,0.95)]">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Icon className="h-5 w-5" />
          </span>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-orange-700">
            Managed
          </span>
        </div>
        <div className="mt-5 grid gap-3">
          {step.bullets.map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-md border border-slate-200 bg-[#f8fafc] px-3 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-xs font-extrabold text-slate-500 ring-1 ring-slate-200">
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
    <section className="border-b border-slate-200 bg-white">
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
    <section className="relative overflow-hidden border-b border-slate-800 bg-[#080b18] text-white">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(circle_at_center,rgba(255,122,26,0.28),transparent_62%)]" />
      <div className="relative mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-orange-300">More Power And Control</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">Managed service depth without scattered ownership.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <p className="text-3xl font-extrabold text-white">{metric.value}</p>
                <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/50">{metric.label}</p>
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
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-orange-50/70 to-transparent" />
      <div className="relative mx-auto max-w-[1280px] px-4 py-16 text-center sm:px-6 lg:px-8">
        <SectionIntro
          align="center"
          eyebrow="Human-led, AI-managed"
          title="AI services without abandoned experiments."
          description="AI servers, automation, and model access stay attached to support, billing, and deployment context."
        />
        <div className="mx-auto mt-10 max-w-4xl rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#f5f3ff_0%,#ffffff_48%,#fff7ed_100%)] p-6 shadow-[0_34px_110px_-82px_rgba(15,23,42,0.9)]">
          <div className="grid gap-4 md:grid-cols-3">
            {aiHighlights.map(([title, body, slug]) => (
              <div key={title} className="rounded-lg border border-white/80 bg-white/80 p-4 text-left">
                <ServiceLogo brand={getCategoryBrand(slug)} imageClassName="h-8 w-8" className="[&>span:first-child]:h-10 [&>span:first-child]:w-10" />
                <h3 className="mt-5 text-lg font-extrabold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OperatingLanesSection() {
  return (
    <section className="border-b border-slate-200 bg-[#f8fafc]">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionIntro
            eyebrow="Operating Lanes"
            title="Four entry points, backed by the same managed record."
            description="New visitors can understand the main ElevenOrbits service areas before entering plan selection, trials, invoices, or add-ons."
          />
          <Link href="/services" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50">
            All service details
          </Link>
        </div>

        <div className="mt-10 overflow-x-auto pb-3 [scrollbar-width:thin]">
          <div className="grid min-w-[1280px] grid-cols-4 gap-4">
            {serviceFamilies.map((family) => {
              const details = subjectDetails[family.name] || {};
              const primaryCategorySlug = details.primaryCategorySlug || family.categorySlugs[0];
              const primaryBrand = getCategoryBrand(primaryCategorySlug);
              const serviceLineBrands = uniqueItems([primaryCategorySlug, ...family.categorySlugs]).slice(0, 5).map(getCategoryBrand);
              const { startingPlan } = getFamilySummary(family);
              const subjectHref = `/${family.pageSlug}`;
              const orderHref = startingPlan ? getPurchasePath(startingPlan) : "/contact";

              return (
                <article key={family.name} className={`group relative flex min-h-[430px] flex-col overflow-hidden rounded-lg border p-5 shadow-[0_34px_110px_-82px_rgba(15,23,42,0.88)] transition hover:-translate-y-1 hover:shadow-[0_46px_130px_-84px_rgba(15,23,42,0.98)] ${details.background || "border-slate-200 bg-white"}`}>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff7a1a] via-slate-950 to-transparent" />
                  <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-white/70 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 left-8 h-40 w-40 rounded-full bg-slate-950/[0.04] blur-3xl" />
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0">
                      <p className={`text-[11px] font-extrabold uppercase tracking-[0.2em] ${details.accent || "text-[#ff7a1a]"}`}>{details.eyebrow || "Managed service"}</p>
                      <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">{family.name}</h3>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-3">
                      <span className="text-xs font-extrabold text-slate-400">{details.number || "00"}</span>
                      <span className={`flex h-14 w-14 items-center justify-center rounded-lg border ${details.iconShell || "border-slate-200 bg-white"}`}>
                        <ServiceLogo brand={primaryBrand} imageClassName="h-9 w-9" className="[&>span:first-child]:h-10 [&>span:first-child]:w-10" />
                      </span>
                    </div>
                  </div>

                  <p className="mt-5 text-sm font-medium leading-7 text-slate-700">{details.promise || family.description}</p>

                  <div className="mt-6 border-y border-slate-950/[0.08] py-5">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">What we manage</p>
                    <p className="mt-3 text-sm font-extrabold leading-7 text-slate-950">{details.managedLine || family.description}</p>
                  </div>

                  <div className="mt-5">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Service lines</p>
                    <ServiceLogoCluster brands={serviceLineBrands} showLabels max={4} className="mt-3 gap-2" />
                  </div>

                  <div className="mt-auto border-t border-slate-200 pt-5">
                    <div className="flex flex-wrap gap-2">
                      {family.includes.slice(0, 3).map((item) => (
                        <span key={item} className={`rounded-md border px-2.5 py-1 text-[11px] font-extrabold ${details.chip || "border-slate-200 bg-slate-100 text-slate-600"}`}>
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link href={subjectHref} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-3 py-2 text-sm font-extrabold text-white transition hover:bg-slate-800">
                        View lane
                      </Link>
                      <Link href={orderHref} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50">
                        Start order
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
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
              <Link key={plan.slug} href={getPurchasePath(plan)} className="group rounded-lg border border-slate-200 bg-[#f8fafc] p-4 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-[0_28px_90px_-72px_rgba(15,23,42,0.8)]">
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
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(135deg,transparent_0%,rgba(255,122,26,0.18)_100%)]" />
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
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
