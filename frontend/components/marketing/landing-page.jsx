import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Clock3,
  Headset,
  Mail,
  PhoneCall,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Wallet,
  Workflow,
} from "lucide-react";
import { productPlanSeeds, serviceCategories, serviceFamilies, formatCurrency } from "@/lib/shared";
import { siteConfig } from "@/lib/constants/site";
import { Button, cn } from "@/lib/ui";

const highlightSlugs = [
  "basic-managed-vps",
  "balanced-managed-vds",
  "ai-server-starter",
  "starter-vicidial-management",
  "workflow-starter",
  "cybersecurity-basic",
];

const heroSignals = [
  {
    label: "Managed lanes",
    value: "Hosting, AI systems, workflow automation, and support run under one operating standard.",
  },
  {
    label: "Commercial flow",
    value: "Orders, wallet funding, payment verification, and recurring billing stay inside the portal.",
  },
  {
    label: "Access delivery",
    value: "Credentials, login details, and server handoff are assigned by the admin team after provisioning.",
  },
  {
    label: "Change handling",
    value: "Support tickets, deployment notes, and service updates stay tied to the active subscription.",
  },
];

const operatingHighlights = [
  {
    title: "Provisioning stays managed",
    description: "Deployments are created, reviewed, and handed off through a controlled fulfillment flow instead of unmanaged raw infrastructure access.",
    icon: ServerCog,
  },
  {
    title: "Support stays contextual",
    description: "Tickets connect directly to the customer, the subscription, and the service involved, which keeps support actionable.",
    icon: Headset,
  },
  {
    title: "Automation stays governed",
    description: "AI and workflow systems are treated as operating products, not one-off experiments left without lifecycle ownership.",
    icon: Workflow,
  },
  {
    title: "Billing stays structured",
    description: "Wallet balance, saved-card fallback, manual verification, and renewal rules are all part of the same customer journey.",
    icon: Wallet,
  },
];

const governanceSignals = [
  {
    label: "Renewal routing",
    value: "Wallet balance first, saved card second, with admin visibility over payment state.",
    icon: Wallet,
  },
  {
    label: "Support orchestration",
    value: "Service issues, top-up requests, and order follow-up stay inside a single managed customer record.",
    icon: Headset,
  },
  {
    label: "Credential assignment",
    value: "Logins, passwords, IP details, and provisioning notes are added by the team after approval and setup.",
    icon: Clock3,
  },
];

const contactCards = [
  {
    key: "sales",
    title: "Sales & Scoping",
    email: siteConfig.salesEmail,
    description: "Commercial planning, enterprise proposals, and custom deployment scoping.",
  },
  {
    key: "servers",
    title: "Managed Servers",
    email: siteConfig.serversEmail,
    description: "Managed VPS, VDS, provisioning requests, migration planning, and infrastructure rollout.",
  },
  {
    key: "ai",
    title: "AI & Automation",
    email: siteConfig.aiEmail,
    description: "AI servers, agents, workflow automation, and model-backed application delivery.",
  },
  {
    key: "support",
    title: "Support",
    email: siteConfig.supportEmail,
    description: "Active customer support, operational follow-up, and service issue escalation.",
  },
];

const familyThemes = {
  Servers: {
    icon: ServerCog,
    index: "01",
    cardClassName:
      "border-orange-200 bg-[linear-gradient(180deg,#fff7f1_0%,#ffe3cb_58%,#fff7f1_100%)] text-slate-950 shadow-[0_34px_90px_-56px_rgba(255,122,26,0.4)]",
    descriptionClassName: "text-slate-700",
    chipClassName: "border-orange-200 bg-white/85 text-slate-700",
    dividerClassName: "bg-[color:var(--marketing-accent)]",
    overlayClassName: "marketing-strata opacity-90",
  },
  "Call Centers": {
    icon: PhoneCall,
    index: "02",
    cardClassName: "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfd_100%)] text-slate-950",
    descriptionClassName: "text-slate-600",
    chipClassName: "border-slate-200 bg-slate-50 text-slate-700",
    dividerClassName: "bg-slate-950",
    overlayClassName: "bg-[linear-gradient(135deg,rgba(15,23,42,0.05),transparent_62%)]",
  },
  "AI Services": {
    icon: BrainCircuit,
    index: "03",
    cardClassName: "border-sky-200 bg-[linear-gradient(180deg,#f7fbff_0%,#eff7ff_100%)] text-slate-950",
    descriptionClassName: "text-slate-600",
    chipClassName: "border-sky-200 bg-white/85 text-slate-700",
    dividerClassName: "bg-sky-600",
    overlayClassName: "bg-[linear-gradient(135deg,rgba(12,108,242,0.12),transparent_62%)]",
  },
  Cybersecurity: {
    icon: ShieldCheck,
    index: "04",
    cardClassName: "border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-slate-950",
    descriptionClassName: "text-slate-600",
    chipClassName: "border-slate-200 bg-white/80 text-slate-700",
    dividerClassName: "bg-slate-950",
    overlayClassName: "bg-[linear-gradient(135deg,rgba(15,23,42,0.08),transparent_62%)]",
  },
};

function categoryNameFor(slug) {
  return serviceCategories.find((category) => category.slug === slug)?.name || slug;
}

export function LandingPage() {
  const pricingHighlights = productPlanSeeds.filter((plan) => highlightSlugs.includes(plan.slug));
  const featuredPlans = pricingHighlights.slice(0, 3);
  const supportingPlans = pricingHighlights.slice(3);

  return (
    <div className="relative overflow-hidden pb-16">
      <div className="pointer-events-none absolute inset-0 marketing-glow opacity-90" />

      <section id="overview" className="relative scroll-mt-28 border-b border-[color:var(--marketing-line)]">
        <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-80" />
        <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_420px]">
            <div className="relative overflow-hidden rounded-[2.8rem] border border-[color:var(--marketing-line)] bg-white/82 shadow-[0_36px_90px_-58px_rgba(15,23,42,0.28)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 marketing-stage" />
              <div className="pointer-events-none absolute inset-y-0 right-[18%] hidden w-px bg-[color:var(--marketing-line)] xl:block" />
              <div className="relative p-8 md:p-10 xl:p-12">
                <div className="grid gap-8 xl:grid-cols-[150px_minmax(0,1fr)]">
                  <div className="hidden xl:flex xl:flex-col xl:justify-between">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--marketing-accent)]">
                        01
                      </p>
                      <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Company Overview</p>
                    </div>
                    <div className="space-y-4">
                      <div className="h-2 w-24 rounded-full bg-slate-950" />
                      <p className="text-sm leading-7 text-slate-500">
                        Managed infrastructure, AI systems, workflow operations, and commercial control.
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div className="max-w-5xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--marketing-accent)]">
                          ElevenOrbits Operating Systems
                        </p>
                        <h1 className="mt-6 text-[clamp(3.2rem,8vw,7.4rem)] font-semibold leading-[0.94] tracking-[-0.065em] text-slate-950">
                          Managed hosting,
                          <span className="block">AI infrastructure,</span>
                          <span className="block text-[color:var(--marketing-accent)]">and workflow delivery.</span>
                        </h1>
                      </div>

                      <div className="max-w-xs rounded-[2rem] border border-slate-200/90 bg-white/88 p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.28)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Portal-Driven Service Model
                        </p>
                        <p className="mt-4 text-sm leading-7 text-slate-600">
                          Signup starts the relationship. Orders, billing, support, renewals, and fulfillment continue inside one controlled platform.
                        </p>
                      </div>
                    </div>

                    <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
                      ElevenOrbits is designed for businesses that want real operational ownership behind their infrastructure. We combine managed hosting,
                      AI deployment, support routing, billing control, and structured delivery into one professional operating layer.
                    </p>

                    <div className="mt-9 flex flex-wrap gap-3">
                      <Link href="/signup">
                        <Button className="min-w-[170px] justify-center bg-slate-950 border-slate-950 hover:bg-black">
                          Get Started
                        </Button>
                      </Link>
                      <Link href="/#pricing">
                        <Button variant="ghost" className="min-w-[170px] justify-center bg-white/90">
                          Review Pricing
                        </Button>
                      </Link>
                      <a href={`mailto:${siteConfig.salesEmail}`}>
                        <Button variant="ghost" className="min-w-[170px] justify-center bg-white/90">
                          Email Sales
                        </Button>
                      </a>
                    </div>

                    <div className="mt-10 border-t border-[color:var(--marketing-line)] pt-6">
                      <div className="flex flex-wrap gap-2.5">
                        {serviceCategories.map((category) => (
                          <span
                            key={category.slug}
                            className="rounded-full border border-slate-200 bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.2)]"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="relative overflow-hidden rounded-[2.8rem] border border-orange-200 bg-[linear-gradient(180deg,#fff7f1_0%,#fffdf9_100%)] shadow-[0_28px_80px_-52px_rgba(255,122,26,0.3)]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,122,26,0.12),transparent_58%)]" />
                <div className="relative border-b border-orange-200 px-7 py-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--marketing-accent)]">
                    Executive Note
                  </p>
                </div>
                <div className="relative px-7 py-8">
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                    The product is not just compute. It is the operating control around it.
                  </p>
                  <p className="mt-5 text-sm leading-7 text-slate-600">
                    ElevenOrbits keeps provisioning, payment verification, support, credential assignment, and service continuity inside one accountable delivery model.
                  </p>
                  <p className="mt-6 text-sm font-semibold text-slate-950">ElevenOrbits Team</p>
                </div>
              </div>

              <div className="rounded-[2.8rem] border border-[color:var(--marketing-line)] bg-white/90 p-6 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.26)] backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Operating Signals</p>
                  <Sparkles className="h-5 w-5 text-[color:var(--marketing-accent)]" />
                </div>
                <div className="mt-5 space-y-3">
                  {heroSignals.map((item) => (
                    <div key={item.label} className="rounded-[1.4rem] border border-slate-200 bg-slate-50/90 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[color:var(--marketing-line)]">
          <div className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-px border-x border-[color:var(--marketing-line)] bg-[color:var(--marketing-line)] md:grid-cols-2 xl:grid-cols-4">
              {operatingHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="bg-white/80 px-6 py-7 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--marketing-panel-warm)] text-[color:var(--marketing-accent)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="text-base font-semibold text-slate-950">{item.title}</p>
                    </div>
                    <p className="mt-5 text-sm leading-7 text-slate-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="relative scroll-mt-28 border-b border-[color:var(--marketing-line)]">
        <div className="pointer-events-none absolute inset-0 marketing-grid opacity-45" />
        <div className="mx-auto max-w-[1520px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--marketing-accent)]">02 / Services</p>
              <h2 className="text-4xl font-semibold leading-[0.96] tracking-[-0.05em] text-slate-950 md:text-6xl">
                Service families
                <span className="block">built around real operating work.</span>
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                Each service lane is framed around the way customers actually buy, run, secure, and support their systems over time.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[2.6rem] border border-[color:var(--marketing-line)] bg-[color:var(--marketing-line)] xl:grid-cols-4">
              {serviceFamilies.map((family) => {
                const theme = familyThemes[family.name];
                const Icon = theme.icon;

                return (
                  <Link
                    key={family.name}
                    href={`/services/${family.categorySlugs[0]}`}
                    className={cn(
                      "group relative flex min-h-[470px] flex-col overflow-hidden px-7 py-8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-54px_rgba(15,23,42,0.28)]",
                      theme.cardClassName,
                    )}
                  >
                    <div className={cn("pointer-events-none absolute inset-0 opacity-70 transition duration-300 group-hover:opacity-100", theme.overlayClassName)} />
                    <div className="relative flex h-full flex-col">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">{theme.index}</p>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="mt-10">
                        <p className="max-w-[13rem] text-4xl font-semibold leading-[1.02] tracking-[-0.045em]">{family.name}</p>
                        <p className={cn("mt-5 text-sm leading-7", theme.descriptionClassName)}>{family.description}</p>
                      </div>

                      <div className={cn("mt-8 h-1.5 w-16 rounded-full", theme.dividerClassName)} />

                      <div className="mt-8 space-y-6">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">Includes</p>
                          <p className={cn("mt-3 text-base font-semibold leading-7", theme.descriptionClassName)}>
                            {family.includes.join(", ")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {family.techHighlights.map((item) => (
                            <span
                              key={item}
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
                                theme.chipClassName,
                              )}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto flex items-center gap-2 pt-10 text-sm font-semibold">
                        Explore services
                        <ArrowRight className="h-4 w-4 transition duration-200 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="managed" className="relative scroll-mt-28 border-b border-[color:var(--marketing-line)]">
        <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-70" />
        <div className="mx-auto max-w-[1520px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--marketing-accent)]">
                03 / Why ElevenOrbits
              </p>
              <p className="text-sm leading-7 text-slate-600">
                The value is the operating layer around the service: provisioning, billing structure, support ownership, and controlled change execution.
              </p>
            </div>

            <div className="space-y-8">
              <h2 className="max-w-5xl text-[clamp(3rem,7vw,6.8rem)] font-semibold leading-[0.95] tracking-[-0.07em] text-slate-950">
                Why teams choose
                <span className="block">a managed operating layer.</span>
              </h2>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
                <div className="overflow-hidden rounded-[2.6rem] border border-[color:var(--marketing-line)] bg-white/88 shadow-[0_34px_90px_-58px_rgba(15,23,42,0.28)] backdrop-blur">
                  <div className="grid gap-px bg-[color:var(--marketing-line)] md:grid-cols-3">
                    {[
                      {
                        title: "Structured delivery",
                        description: "Orders and service requests turn into accountable provisioning workflows with customer notes, tracked approvals, and controlled fulfillment.",
                        icon: ServerCog,
                      },
                      {
                        title: "Unified service ownership",
                        description: "Infrastructure, AI services, workflow systems, and support escalation remain visible under one operational umbrella.",
                        icon: Workflow,
                      },
                      {
                        title: "Professional customer handling",
                        description: "Billing, tickets, wallet funding, and saved payment methods fit into the same customer record instead of disconnected tools.",
                        icon: Headset,
                      },
                    ].map((item, index) => {
                      const Icon = item.icon;

                      return (
                        <div key={item.title} className="bg-white px-7 py-8">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">0{index + 1}</p>
                          <span className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                            <Icon className="h-5 w-5" />
                          </span>
                          <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
                          <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-[color:var(--marketing-line)] bg-[linear-gradient(180deg,#fffaf6_0%,#ffffff_100%)] p-7 md:p-8">
                    <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--marketing-accent)]">
                          Customer Journey
                        </p>
                        <p className="mt-4 text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-slate-950">
                          Create the order. We take the delivery forward.
                        </p>
                        <p className="mt-4 text-sm leading-7 text-slate-600">
                          Customers choose the plan, configure the monthly add-ons, review pricing, and leave final notes. ElevenOrbits handles provisioning,
                          assigns access after setup, and keeps support tied to the active service.
                        </p>
                      </div>
                      <div className="grid gap-3">
                        {[
                          "Order created with plan and add-ons",
                          "Deployment notes captured before fulfillment",
                          "Credentials and IP details assigned after provisioning",
                        ].map((item) => (
                          <div key={item} className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[2.4rem] border border-sky-200 bg-[linear-gradient(180deg,#f6faff_0%,#ffffff_100%)] p-7 shadow-[0_28px_80px_-58px_rgba(12,108,242,0.24)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Governance Signals</p>
                    <div className="mt-6 space-y-4">
                      {governanceSignals.map((item) => {
                        const Icon = item.icon;

                        return (
                          <div key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                <Icon className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                                <p className="mt-2 text-sm leading-7 text-slate-600">{item.value}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[2.4rem] border border-slate-900 bg-slate-950 p-7 text-white shadow-[0_34px_90px_-62px_rgba(15,23,42,0.58)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">ElevenOrbits Standard</p>
                    <p className="mt-5 text-3xl font-semibold leading-[1.05] tracking-[-0.04em]">
                      Professional systems deserve professional operational ownership.
                    </p>
                    <p className="mt-4 text-sm leading-7 text-white/70">
                      We lead with clarity, service structure, and governance because serious business systems need more than surface-level marketing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="relative scroll-mt-28 border-b border-[color:var(--marketing-line)]">
        <div className="pointer-events-none absolute inset-0 marketing-grid opacity-45" />
        <div className="mx-auto max-w-[1520px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--marketing-accent)]">04 / Pricing</p>
              <h2 className="text-4xl font-semibold leading-[0.96] tracking-[-0.05em] text-slate-950 md:text-6xl">
                Commercial starting points
                <span className="block">for managed delivery.</span>
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                These plans establish the launch baseline while admin controls continue to govern discounts, add-ons, payment settings, and renewals.
              </p>
              <Link href="/signup">
                <Button className="min-w-[170px] justify-center bg-slate-950 border-slate-950 hover:bg-black">Open Portal</Button>
              </Link>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-3">
                {featuredPlans.map((plan, index) => (
                  <div
                    key={plan.slug}
                    className={cn(
                      "rounded-[2.4rem] border border-[color:var(--marketing-line)] p-7 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.22)]",
                      index === 0 && "border-orange-200 bg-[linear-gradient(180deg,#fff7f1_0%,#fffdf9_100%)]",
                      index === 1 && "border-slate-200 bg-white/90",
                      index === 2 && "border-sky-200 bg-[linear-gradient(180deg,#f6faff_0%,#ffffff_100%)]",
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{categoryNameFor(plan.categorySlug)}</p>
                    <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{plan.name}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{plan.description}</p>

                    <div className="mt-7 flex items-end gap-3">
                      <p className="text-5xl font-semibold tracking-[-0.05em] text-slate-950">
                        {plan.contactSalesOnly ? plan.displayPriceLabel : formatCurrency(plan.monthlyPrice)}
                      </p>
                      <p className="pb-1 text-sm text-slate-500">{plan.contactSalesOnly ? "custom" : "monthly"}</p>
                    </div>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {plan.yearlyDiscountPercent ? `${plan.yearlyDiscountPercent}% yearly savings available` : "Flexible billing options"}
                    </p>

                    <div className="mt-7 space-y-3">
                      {plan.features.slice(0, 3).map((feature) => (
                        <div key={feature} className="rounded-[1.2rem] border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700">
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {supportingPlans.map((plan) => (
                  <div
                    key={plan.slug}
                    className="rounded-[2rem] border border-[color:var(--marketing-line)] bg-white/88 p-5 shadow-[0_20px_60px_-52px_rgba(15,23,42,0.22)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {categoryNameFor(plan.categorySlug)}
                        </p>
                        <p className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{plan.name}</p>
                      </div>
                      <p className="text-lg font-semibold text-slate-950">
                        {plan.contactSalesOnly ? plan.displayPriceLabel : formatCurrency(plan.monthlyPrice)}
                      </p>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{plan.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {plan.techStack.slice(0, 2).map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="relative scroll-mt-28">
        <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-70" />
        <div className="mx-auto max-w-[1520px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="overflow-hidden rounded-[2.8rem] border border-[color:var(--marketing-line)] bg-white/88 shadow-[0_38px_96px_-64px_rgba(15,23,42,0.3)] backdrop-blur">
            <div className="grid gap-px bg-[color:var(--marketing-line)] xl:grid-cols-[1.08fr_0.92fr]">
              <div className="bg-[linear-gradient(180deg,#fffaf6_0%,#ffffff_100%)] p-8 md:p-10 xl:p-12">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--marketing-accent)]">05 / Contact</p>
                <h2 className="mt-6 text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.07em] text-slate-950">
                  Let&apos;s talk
                  <span className="block text-[color:var(--marketing-accent)]">about the next environment.</span>
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  Tell us what you need to host, automate, protect, or support. We will help shape the operating model, service path, and commercial starting
                  point that fits the work.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/signup">
                    <Button className="min-w-[170px] justify-center bg-slate-950 border-slate-950 hover:bg-black">Start Account</Button>
                  </Link>
                  <a href={`mailto:${siteConfig.salesEmail}`}>
                    <Button variant="ghost" className="min-w-[170px] justify-center bg-white/90">
                      Contact Sales
                    </Button>
                  </a>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.8rem] border border-slate-200 bg-white/88 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">General Inquiries</p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">{siteConfig.generalEmail}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">For broad questions, introductions, and company-level conversations.</p>
                  </div>
                  <div className="rounded-[1.8rem] border border-slate-200 bg-white/88 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Support Desk</p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">{siteConfig.supportEmail}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">For customer help, service follow-up, and operational issue escalation.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-px bg-[color:var(--marketing-line)] sm:grid-cols-2">
                {contactCards.map((card) => (
                  <a key={card.key} href={`mailto:${card.email}`} className="group bg-white/92 px-6 py-7 transition duration-200 hover:bg-white">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{card.title}</p>
                      <Mail className="h-4 w-4 text-[color:var(--marketing-accent)]" />
                    </div>
                    <p className="mt-6 text-lg font-semibold text-slate-950">{card.email}</p>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{card.description}</p>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                      Start conversation
                      <ArrowRight className="h-4 w-4 transition duration-200 group-hover:translate-x-1" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
