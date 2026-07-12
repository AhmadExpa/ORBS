import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Headset,
  Mail,
  PhoneCall,
  ServerCog,
  ShieldCheck,
  Wallet,
  Workflow,
} from "lucide-react";
import { getBillingCycleDiscountPercent, getSignupPath, productPlanSeeds, serviceCategories, serviceFamilies, formatCurrency } from "@/lib/shared";
import { siteConfig } from "@/lib/constants/site";
import { Button, cn } from "@/lib/ui";
import { ServiceLogoCluster, ServiceVisualPanel } from "./service-branding";
import { TechStackShowcase } from "./tech-stack-showcase";

const highlightSlugs = [
  "basic-managed-vps",
  "balanced-managed-vds",
  "ai-server-starter",
  "starter-vicidial-management",
  "workflow-starter",
  "cybersecurity-basic",
];

const heroBrandSlugs = [
  "vps",
  "vds",
  "vicidial",
  "workflows",
  "cdn",
  "object-storage",
  "hermes-ai-hosting",
  "openclaw-hosting",
  "nextcloud-hosting",
  "cybersecurity",
];

const heroSignals = [
  {
    label: "Managed lanes",
    value: "Hosting, AI systems, workflow automation, and support run under one operating standard.",
  },
  {
    label: "Commercial flow",
    value: "Orders, wallet funding, card payment activity, and recurring billing stay inside the portal.",
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
    description: "Wallet balance, saved-card fallback, card payments, and renewal rules are all part of the same customer journey.",
    icon: Wallet,
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
    email: siteConfig.salesEmail,
    description: "Managed VPS, VDS, provisioning requests, migration planning, and infrastructure rollout.",
  },
  {
    key: "ai",
    title: "AI & Automation",
    email: siteConfig.salesEmail,
    description: "AI servers, agents, workflow automation, and model-backed application delivery.",
  },
  {
    key: "support",
    title: "Support",
    email: siteConfig.supportEmail,
    description: "Active customer support, operational follow-up, and service issue escalation.",
  },
];

const faqItems = [
  {
    question: "Who manages the environment after the order is placed?",
    answer: "ElevenOrbits handles provisioning, delivery, monitoring, support routing, and operational follow-up after approval.",
  },
  {
    question: "How are AI systems and automation services delivered?",
    answer: "AI servers, workflow automation, and AI solutions are delivered as managed workloads with stack guidance, rollout support, and ongoing ownership.",
  },
  {
    question: "How does support work once I become a customer?",
    answer: "Support tickets stay tied to the customer and the subscription, so follow-up, context, and service history remain connected.",
  },
  {
    question: "What happens before checkout?",
    answer: "Customers create or access an account first, then configure the selected service, complete card payment, and continue to the portal after confirmation.",
  },
];

const familyThemes = {
  "Managed Cloud": {
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

function FaqSection() {
  return (
    <section id="faq" className="relative scroll-mt-24 border-t border-[color:var(--marketing-line)] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div className="min-w-0 rounded-lg border border-orange-200 bg-orange-50/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--marketing-accent)]">Customer Guidance</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Direct answers before a customer opens the portal.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Public guidance focuses on how services are bought, provisioned, billed, and supported before a customer configures the portal order.
            </p>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {faqItems.map((item, index) => (
              <div
                key={item.question}
                className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_-42px_rgba(15,23,42,0.2)]"
                style={{ "--eo-delay": `${index * 45}ms` }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--marketing-accent)]">FAQ 0{index + 1}</p>
                <h3 className="mt-4 text-lg font-semibold leading-snug text-slate-950">{item.question}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const pricingHighlights = productPlanSeeds.filter((plan) => highlightSlugs.includes(plan.slug));

  return (
    <div className="relative overflow-x-clip bg-white pb-14">
      <div className="pointer-events-none absolute inset-0 marketing-glow opacity-90" />

      <section id="overview" className="relative scroll-mt-24 border-b border-[color:var(--marketing-line)]">
        <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-80" />
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
            <div className="min-w-0 rounded-lg border border-[color:var(--marketing-line)] bg-white/90 p-6 shadow-[0_28px_80px_-58px_rgba(15,23,42,0.28)] backdrop-blur md:p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--marketing-accent)]">ElevenOrbits Operating Systems</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Managed hosting, AI infrastructure, and workflow delivery.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                ElevenOrbits gives businesses a structured operating layer for infrastructure, AI deployment, billing control, support routing, and service handoff.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <Link href={getSignupPath()} className="min-w-0">
                  <Button className="w-full justify-center bg-slate-950 border-slate-950 hover:bg-black">Get Started</Button>
                </Link>
                <Link href="/#pricing" className="min-w-0">
                  <Button variant="ghost" className="w-full justify-center bg-white">Review Pricing</Button>
                </Link>
                <a href={`mailto:${siteConfig.salesEmail}`} className="min-w-0">
                  <Button variant="ghost" className="w-full justify-center bg-white">Email Sales</Button>
                </a>
              </div>

              <div className="mt-8 border-t border-[color:var(--marketing-line)] pt-6">
                <ServiceLogoCluster categorySlugs={heroBrandSlugs} max={8} />
              </div>
            </div>

            <aside className="grid min-w-0 gap-4">
              <div className="min-w-0 rounded-lg border border-orange-200 bg-orange-50/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--marketing-accent)]">Service Model</p>
                <p className="mt-4 text-2xl font-semibold leading-tight text-slate-950">
                  The product is the operating control around the compute.
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Orders, payment activity, support, credential assignment, and service continuity stay in one accountable delivery model.
                </p>
              </div>

              <div className="min-w-0 rounded-lg border border-[color:var(--marketing-line)] bg-white p-5 shadow-[0_22px_60px_-52px_rgba(15,23,42,0.22)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Operating Signals</p>
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[color:var(--marketing-accent)]" />
                </div>
                <div className="mt-4 grid gap-3">
                  {heroSignals.map((item, index) => (
                    <div
                      key={item.label}
                      className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
                      style={{ "--eo-delay": `${260 + index * 45}ms` }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="border-t border-[color:var(--marketing-line)]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="grid min-w-0 gap-4 py-8 md:grid-cols-2 xl:grid-cols-4">
              {operatingHighlights.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="min-w-0 rounded-lg border border-[color:var(--marketing-line)] bg-white px-5 py-6" style={{ "--eo-delay": `${index * 55}ms` }}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--marketing-panel-warm)] text-[color:var(--marketing-accent)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="text-base font-semibold leading-snug text-slate-950">{item.title}</p>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="relative scroll-mt-24 border-b border-[color:var(--marketing-line)]">
        <div className="pointer-events-none absolute inset-0 marketing-grid opacity-45" />
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid min-w-0 gap-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--marketing-accent)]">Services</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Service families built around real operating work.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Each service lane is framed around the way customers actually buy, run, secure, and support their systems over time.
              </p>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {serviceFamilies.map((family, index) => {
                const theme = familyThemes[family.name];
                const Icon = theme.icon;

                return (
                  <Link
                    key={family.name}
                    href={`/${family.pageSlug || `services/${family.categorySlugs[0]}`}`}
                    className={cn(
                      "group relative flex min-w-0 flex-col overflow-hidden rounded-lg border px-5 py-6 transition duration-200 hover:shadow-[0_24px_70px_-54px_rgba(15,23,42,0.28)]",
                      theme.cardClassName,
                    )}
                    style={{ "--eo-delay": `${index * 70}ms` }}
                  >
                    <div className={cn("pointer-events-none absolute inset-0 opacity-70 transition duration-300 group-hover:opacity-100", theme.overlayClassName)} />
                    <div className="relative flex h-full flex-col">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">{theme.index}</p>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="mt-8">
                        <p className="text-2xl font-semibold leading-tight">{family.name}</p>
                        <p className={cn("mt-4 text-sm leading-7", theme.descriptionClassName)}>{family.description}</p>
                      </div>

                      <div className={cn("mt-6 h-1.5 w-14 rounded-full", theme.dividerClassName)} />

                      <div className="mt-6 space-y-5">
                        <ServiceLogoCluster categorySlugs={family.categorySlugs} max={5} />
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

                      <div className="mt-auto flex items-center gap-2 pt-8 text-sm font-semibold">
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

      <section id="managed" className="relative scroll-mt-24 border-b border-[color:var(--marketing-line)]">
        <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-70" />
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid min-w-0 gap-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--marketing-accent)]">Why ElevenOrbits</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Why teams choose a managed operating layer.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                The value is the operating layer around the service: provisioning, billing structure, support ownership, and controlled change execution.
              </p>
            </div>

            <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid min-w-0 gap-4">
                <div className="grid min-w-0 gap-4 md:grid-cols-3">
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
                      <div key={item.title} className="min-w-0 rounded-lg border border-[color:var(--marketing-line)] bg-white px-5 py-6 shadow-[0_18px_48px_-42px_rgba(15,23,42,0.18)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">0{index + 1}</p>
                        <span className="mt-6 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="mt-6 text-lg font-semibold leading-snug text-slate-950">{item.title}</h3>
                        <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="min-w-0 rounded-lg border border-orange-100 bg-[linear-gradient(180deg,#fffaf6_0%,#ffffff_100%)] p-6 shadow-[0_22px_60px_-52px_rgba(249,115,22,0.2)]">
                  <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--marketing-accent)]">
                        Customer Journey
                      </p>
                      <p className="mt-4 text-2xl font-semibold leading-tight text-slate-950">
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
                        <div key={item} className="rounded-md border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <aside className="min-w-0 space-y-5">
                <ServiceVisualPanel
                  title="Partner-backed delivery"
                  description="Visible logos represent the platforms and managed products customers see across service pages, pricing, and portal order flows."
                  categorySlugs={["vps", "cdn", "object-storage", "workflows", "vicidial", "hermes-ai-hosting"]}
                  className="eo-reveal-soft"
                />
              </aside>
            </div>
          </div>
        </div>
      </section>

      <TechStackShowcase compact />

      <section id="pricing" className="relative scroll-mt-24 border-b border-[color:var(--marketing-line)]">
        <div className="pointer-events-none absolute inset-0 marketing-grid opacity-45" />
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid min-w-0 gap-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--marketing-accent)]">Pricing</p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Commercial starting points for managed delivery.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  These plans establish the launch baseline while admin controls continue to govern discounts, add-ons, saved-card billing, and renewals.
                </p>
              </div>
              <Link href={getSignupPath()}>
                <Button className="w-full justify-center bg-slate-950 border-slate-950 hover:bg-black sm:w-auto">Open Portal</Button>
              </Link>
            </div>

            <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {pricingHighlights.map((plan, index) => (
                <div
                  key={plan.slug}
                  className={cn(
                    "min-w-0 rounded-lg border border-[color:var(--marketing-line)] p-6 shadow-[0_22px_60px_-52px_rgba(15,23,42,0.2)]",
                    index === 0 && "border-orange-200 bg-[linear-gradient(180deg,#fff7f1_0%,#fffdf9_100%)]",
                    index === 1 && "border-slate-200 bg-white/90",
                    index >= 2 && "border-sky-200 bg-[linear-gradient(180deg,#f6faff_0%,#ffffff_100%)]",
                  )}
                  style={{ "--eo-delay": `${index * 65}ms` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{categoryNameFor(plan.categorySlug)}</p>
                  <h3 className="mt-4 text-2xl font-semibold leading-tight text-slate-950">{plan.name}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{plan.description}</p>

                  <div className="mt-7 flex items-end gap-3">
                    <p className="text-4xl font-semibold text-slate-950">
                      {plan.contactSalesOnly ? plan.displayPriceLabel : formatCurrency(plan.monthlyPrice)}
                    </p>
                    <p className="pb-1 text-sm text-slate-500">{plan.contactSalesOnly ? "custom" : "monthly"}</p>
                  </div>

                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {plan.contactSalesOnly
                      ? "Scoped commercial contract"
                      : `${getBillingCycleDiscountPercent(plan, "six_month")}% six month / ${getBillingCycleDiscountPercent(plan, "yearly")}% yearly savings`}
                  </p>

                  <div className="mt-7 space-y-3">
                    {plan.features.slice(0, 3).map((feature) => (
                      <div key={feature} className="rounded-md border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700">
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="relative scroll-mt-24">
        <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-70" />
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="overflow-hidden rounded-lg border border-[color:var(--marketing-line)] bg-white shadow-[0_28px_86px_-64px_rgba(15,23,42,0.3)]">
            <div className="grid min-w-0 gap-px bg-[color:var(--marketing-line)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="min-w-0 bg-[linear-gradient(180deg,#fffaf6_0%,#ffffff_100%)] p-6 md:p-8 lg:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--marketing-accent)]">Contact</p>
                <h2 className="mt-5 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Let&apos;s talk about the next environment.
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  Tell us what you need to host, automate, protect, or support. We will help shape the operating model, service path, and commercial starting
                  point that fits the work.
                </p>

                <div className="mt-8 rounded-lg border border-slate-200 bg-white/90 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Routing Standard</p>
                  <p className="mt-3 text-xl font-semibold text-slate-950">Start with the right team.</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Sales, servers, AI and automation, and support requests route through dedicated inboxes so each conversation starts with the right context.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <Link href={getSignupPath()} className="min-w-0">
                    <Button className="w-full justify-center bg-slate-950 border-slate-950 hover:bg-black">Start Account</Button>
                  </Link>
                  <a href={`mailto:${siteConfig.salesEmail}`} className="min-w-0">
                    <Button variant="ghost" className="w-full justify-center bg-white/90">
                      Contact Sales
                    </Button>
                  </a>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white/90 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">General Inquiries</p>
                    <p className="mt-3 break-words text-base font-semibold text-slate-950">{siteConfig.generalEmail}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">For broad questions, introductions, and company-level conversations.</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white/90 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Support Desk</p>
                    <p className="mt-3 break-words text-base font-semibold text-slate-950">{siteConfig.supportEmail}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">For customer help, service follow-up, and operational issue escalation.</p>
                  </div>
                </div>
              </div>

              <div className="grid min-w-0 gap-px bg-[color:var(--marketing-line)] sm:grid-cols-2">
                {contactCards.map((card) => (
                  <a key={card.key} href={`mailto:${card.email}`} className="group bg-white/95 px-6 py-7 transition duration-200 hover:bg-white">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{card.title}</p>
                      <Mail className="h-4 w-4 text-[color:var(--marketing-accent)]" />
                    </div>
                    <p className="mt-6 break-words text-base font-semibold text-slate-950">{card.email}</p>
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

      <FaqSection />
    </div>
  );
}
