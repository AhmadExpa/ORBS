import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  FileSignature,
  Headphones,
  LockKeyhole,
  PackageCheck,
  Receipt,
  ShieldCheck,
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
  },
  "Call Centers": {
    number: "02",
    eyebrow: "Voice operations",
    primaryCategorySlug: "vicidial",
    promise: "Dialer operations, SIP routing, queue support, and service coordination for teams that need context preserved.",
  },
  "AI Services": {
    number: "03",
    eyebrow: "AI enablement",
    primaryCategorySlug: "ai-servers",
    promise: "GPU-ready servers, n8n workflow operations, model integrations, and private AI rollout support.",
  },
  Cybersecurity: {
    number: "04",
    eyebrow: "Security operations",
    primaryCategorySlug: "cybersecurity",
    promise: "Hardening, monitoring guidance, response readiness, and policy follow-up for hosted systems.",
  },
};

const portalPillars = [
  {
    title: "Contracts stay visible",
    body: "Agreement status, completion flow, and account approval sit inside the customer workspace.",
    icon: FileSignature,
  },
  {
    title: "Wallet-first billing",
    body: "Renewals check wallet balance before using a saved card fallback when card billing is enabled.",
    icon: Wallet,
  },
  {
    title: "Provisioning has context",
    body: "Service notes, credentials, access records, and support tickets stay attached to the managed service.",
    icon: ClipboardCheck,
  },
  {
    title: "Support is accountable",
    body: "Customer and agent portals separate ownership from delegated service visibility.",
    icon: Headphones,
  },
];

const deliverySteps = [
  {
    label: "Select",
    title: "Start from a main operating lane.",
    body: "Choose Managed Cloud, AI Services, Call Centers, or Cybersecurity before entering plan-level order details.",
  },
  {
    label: "Approve",
    title: "Billing and contracts are handled in the portal.",
    body: "Orders, invoices, wallet funding, saved cards, and contract status remain visible to the customer.",
  },
  {
    label: "Operate",
    title: "Provisioning and support stay on the service record.",
    body: "The managed record holds handoff notes, credentials, ticket history, and renewal context.",
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

function uniqueItems(items) {
  return [...new Set(items.filter(Boolean))];
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[960px] lg:ml-auto">
      <div className="pointer-events-none absolute inset-x-8 bottom-6 h-20 rounded-full bg-orange-200/30 blur-3xl" />
      <Image
        src="/hero.png"
        alt="ElevenOrbits managed services dashboard with server, AI automation, VoIP, CDN storage, and cybersecurity service cards"
        width={1448}
        height={1086}
        priority
        sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 52vw, 100vw"
        className="relative h-auto w-full object-contain"
      />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#f7f9fb]">
      <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-orange-50/85 via-white/40 to-transparent" />
      <div className="relative mx-auto grid max-w-[1560px] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-orange-800 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a1a]" />
            Managed infrastructure with operating ownership
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-[62px] lg:leading-[1.03]">
            Managed systems, billing, contracts, and support in one customer portal.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-650 sm:text-lg">
            ElevenOrbits runs managed cloud, AI services, call-center operations, and cybersecurity through a service model where the customer sees the order, renewal, access, and support record.
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
              <div key={label} className="border-l border-slate-300 bg-white/70 px-4 py-3 shadow-[0_20px_70px_-62px_rgba(15,23,42,0.8)]">
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

function OperatingLanesSection() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#ff7a1a]">Operating Lanes</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Four entry points, backed by the same managed record.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The homepage stays focused on the real service families. Detailed plan selection, trials, invoices, and add-ons remain inside the order and pricing flows.
            </p>
          </div>
          <Link href="/services" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50">
            All service details
          </Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {serviceFamilies.map((family) => {
            const details = subjectDetails[family.name] || {};
            const primaryCategorySlug = details.primaryCategorySlug || family.categorySlugs[0];
            const primaryBrand = getCategoryBrand(primaryCategorySlug);
            const serviceLineBrands = uniqueItems([primaryCategorySlug, ...family.categorySlugs]).slice(0, 5).map(getCategoryBrand);
            const { plans, startingPlan } = getFamilySummary(family);
            const subjectHref = `/${family.pageSlug}`;
            const orderHref = startingPlan ? getPurchasePath(startingPlan) : "/contact";
            const displayPlans = plans.slice(0, 3);

            return (
              <article key={family.name} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-[#fbfcfd] p-6 shadow-[0_28px_90px_-78px_rgba(15,23,42,0.85)] transition hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-[0_36px_110px_-76px_rgba(15,23,42,0.9)]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#ff7a1a] via-slate-950 to-transparent" />
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#ff7a1a]">{details.eyebrow || "Managed service"}</p>
                    <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">{family.name}</h3>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{details.promise || family.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <span className="text-xs font-extrabold text-slate-400">{details.number || "00"}</span>
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-white">
                      <ServiceLogo brand={primaryBrand} imageClassName="h-9 w-9" className="[&>span:first-child]:h-10 [&>span:first-child]:w-10" />
                    </span>
                  </div>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Service lines</p>
                    <ServiceLogoCluster brands={serviceLineBrands} showLabels max={5} className="mt-3 gap-3" />
                  </div>
                  <div className="grid gap-2">
                    {displayPlans.map((plan) => (
                      <div key={plan.slug} className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                        <span className="min-w-0 truncate text-sm font-bold text-slate-800">{plan.name}</span>
                        <span className="shrink-0 text-sm font-extrabold text-slate-950">{getPriceLabel(plan)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
                  <div className="flex flex-wrap gap-2">
                    {family.includes.slice(0, 4).map((item) => (
                      <span key={item} className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-600">
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Link href={subjectHref} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-slate-800">
                      View lane
                    </Link>
                    <Link href={orderHref} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50">
                      Start order
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PortalModelSection() {
  return (
    <section className="border-b border-slate-800 bg-[#070b16] text-white">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-orange-300">Customer Portal</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">The operational record is the product experience.</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/65">
            A managed service should not disappear after checkout. The portal keeps order flow, contract status, billing, provisioning, access, and support connected.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {portalPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="rounded-lg border border-white/10 bg-white/[0.055] p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-950">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-extrabold">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/65">{pillar.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CatalogExamplesSection() {
  const examples = catalogExampleSlugs.map(getPlanBySlug).filter(Boolean);

  return (
    <section className="border-b border-slate-200 bg-[#f8fafc]">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#ff7a1a]">Catalog Accuracy</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Pricing examples come from the same product catalog as checkout.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The homepage does not invent separate marketing prices. These examples are pulled from the active local plan data.
            </p>
          </div>
          <Link href="/pricing" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-800">
            Full pricing catalog
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {examples.map((plan) => {
            const brand = getCategoryBrand(plan.categorySlug);
            return (
              <Link key={plan.slug} href={getPurchasePath(plan)} className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_28px_90px_-72px_rgba(15,23,42,0.8)]">
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

function DeliveryProcessSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#ff7a1a]">Managed Flow</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">A cleaner path from order to ongoing support.</h2>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {deliverySteps.map((step) => (
            <div key={step.label} className="rounded-lg border border-slate-200 bg-[#fbfcfd] p-6">
              <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">{step.label}</span>
              <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-950">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          {[
            ["Contract visibility", FileSignature],
            ["Billing history", Receipt],
            ["Credential records", LockKeyhole],
            ["Service status", PackageCheck],
            ["Security review", ShieldCheck],
          ].map(([label, Icon]) => (
            <span key={label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
              <Icon className="h-4 w-4 text-[#ff7a1a]" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="overflow-x-clip bg-white text-slate-900">
      <HeroSection />
      <OperatingLanesSection />
      <PortalModelSection />
      <CatalogExamplesSection />
      <TechStackShowcase compact />
      <DeliveryProcessSection />
    </div>
  );
}
