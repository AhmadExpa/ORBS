import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Cloud,
  PhoneCall,
  Server,
  ShieldCheck,
  Wrench,
  Workflow,
} from "lucide-react";
import {
  formatCurrency,
  getPurchasePath,
  getSignupPath,
  getServiceVertical,
  productPlanSeeds,
  serviceCategories,
} from "@/lib/shared";
import { getDepartmentContactByServiceSlug, siteConfig } from "@/lib/constants/site";
import { Button, cn } from "@/lib/ui";
import { ServiceLogo, ServiceLogoCluster, TechLogoPills, getBrandForName, getCategoryBrand } from "./service-branding";

const verticalIconMap = {
  "managed-servers": Server,
  "ai-services": Bot,
  "voip-services": PhoneCall,
  "cybersecurity-services": ShieldCheck,
  "edge-storage-services": Cloud,
  "self-hosted-app-services": Bot,
  "workflow-automation": Workflow,
  "managed-it-support": Wrench,
};

const verticalThemes = {
  "managed-servers": {
    shell: "border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_52%,#eff6ff_100%)]",
    accent: "text-orange-600",
    icon: "bg-orange-100 text-orange-700 ring-orange-600/10",
    bar: "bg-orange-500",
  },
  "ai-services": {
    shell: "border-sky-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_54%,#f0fdfa_100%)]",
    accent: "text-sky-700",
    icon: "bg-sky-100 text-sky-700 ring-sky-600/10",
    bar: "bg-sky-600",
  },
  "voip-services": {
    shell: "border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_54%,#eef2ff_100%)]",
    accent: "text-slate-800",
    icon: "bg-slate-100 text-slate-700 ring-slate-950/[0.06]",
    bar: "bg-slate-950",
  },
  "cybersecurity-services": {
    shell: "border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_54%,#f8fafc_100%)]",
    accent: "text-emerald-700",
    icon: "bg-emerald-100 text-emerald-700 ring-emerald-600/10",
    bar: "bg-emerald-600",
  },
  "edge-storage-services": {
    shell: "border-cyan-200 bg-[linear-gradient(135deg,#ecfeff_0%,#ffffff_54%,#f0fdf4_100%)]",
    accent: "text-cyan-700",
    icon: "bg-cyan-100 text-cyan-700 ring-cyan-600/10",
    bar: "bg-cyan-600",
  },
  "self-hosted-app-services": {
    shell: "border-indigo-200 bg-[linear-gradient(135deg,#eef2ff_0%,#ffffff_54%,#ecfeff_100%)]",
    accent: "text-indigo-700",
    icon: "bg-indigo-100 text-indigo-700 ring-indigo-600/10",
    bar: "bg-indigo-600",
  },
  "workflow-automation": {
    shell: "border-blue-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#fff7ed_100%)]",
    accent: "text-blue-700",
    icon: "bg-blue-100 text-blue-700 ring-blue-600/10",
    bar: "bg-blue-600",
  },
  "managed-it-support": {
    shell: "border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_55%,#f1f5f9_100%)]",
    accent: "text-slate-800",
    icon: "bg-slate-100 text-slate-700 ring-slate-950/[0.06]",
    bar: "bg-slate-950",
  },
};

const fallbackVerticalProof = {
  title: "Managed delivery controls",
  description: "This service lane is scoped, provisioned, documented, and supported through the ElevenOrbits portal workflow.",
  aside: "Customers get a managed service path with service notes, approval context, access handoff, and support visibility tied to the active subscription.",
  controls: ["Service scope captured before order approval", "Provisioning notes kept with the customer record", "Support tickets tied to the active service"],
};

const verticalProof = {
  "managed-servers": {
    title: "Server delivery without unmanaged handoff",
    description: "VPS and VDS work includes the operating details customers need before a production server is released.",
    aside: "Customers get server access only after provisioning, review, and credential assignment are complete.",
    controls: ["OS, panel, backup, and access requirements captured", "IP, credential, and renewal notes assigned after setup", "Support requests tied to the active server"],
  },
  "ai-services": {
    title: "AI infrastructure with operating guardrails",
    description: "AI servers, model access, and managed AI products are delivered with rollout and support context attached.",
    aside: "Customers get AI service details, deployment notes, and support channels connected to the service record.",
    controls: ["Model or API requirements captured during order intake", "Deployment guidance kept with the customer account", "Prompt operations and usage questions routed to support"],
  },
  "voip-services": {
    title: "Call operations scoped before provisioning",
    description: "VoIP and Vicidial requests capture inbound, outbound, RVM, routing, agent, DID, and compliance requirements before setup starts.",
    aside: "Customers get a call-center service path that records what traffic they run and what configuration the team must deliver.",
    controls: ["Inbound, outbound, blended, and RVM intent captured", "SIP, DID, dialer, agent, and campaign needs documented", "Tickets connected to live call-center operations"],
  },
  "cybersecurity-services": {
    title: "Security service delivery with visible scope",
    description: "Security services define the systems, controls, response expectations, and reporting path before work begins.",
    aside: "Customers get a managed security lane with clear coverage, escalation contacts, and support visibility.",
    controls: ["Asset and risk scope captured during intake", "Monitoring and response expectations documented", "Security tickets routed to the right department"],
  },
  "edge-storage-services": {
    title: "Edge delivery and O7 Bucket access controls",
    description: "CDN and O7 Bucket storage requests define domains, CORS, gated access, S3-compatible API use, and monthly storage needs.",
    aside: "Customers get a storage and edge delivery lane designed for predictable access, custom domains, and development use.",
    controls: ["Bucket, domain, and CORS requirements captured", "S3-compatible credentials generated after approval", "Fixed monthly storage pricing shown before checkout"],
  },
  "self-hosted-app-services": {
    title: "Self-hosted apps delivered as managed services",
    description: "Hermes AI, OpenClaw, and Nextcloud requests are handled with stack, access, storage, and support expectations recorded upfront.",
    aside: "Customers get app hosting that includes managed deployment context instead of a bare install with no operating owner.",
    controls: ["Application stack and access needs captured", "Storage, domain, and backup expectations documented", "Support follows the hosted app service record"],
  },
  "workflow-automation": {
    title: "Automation with ownership after launch",
    description: "Workflow requests capture triggers, systems, credentials, business rules, and failure handling before buildout.",
    aside: "Customers get workflow automation that is documented, supported, and connected to tickets after deployment.",
    controls: ["Trigger, app, and credential requirements captured", "Business rules and failure paths documented", "Change requests tracked against the active workflow"],
  },
  "managed-it-support": {
    title: "Technical support with accountable routing",
    description: "Support services keep requests, access notes, systems, and follow-up inside the customer record.",
    aside: "Customers get a managed support lane with the right service context attached to each ticket.",
    controls: ["Support scope and system access captured", "Customer notes stay available to the support team", "Ticket history remains tied to active services"],
  },
};

function absoluteUrl(path) {
  return `${siteConfig.publicUrl}${path}`;
}

function categoryNameFor(slug) {
  return serviceCategories.find((category) => category.slug === slug)?.name || slug;
}

function brandForPlan(plan) {
  const planBrand = getBrandForName(plan.name);
  return planBrand.logo ? planBrand : getCategoryBrand(plan.categorySlug);
}

function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

function buildSchema(vertical, plans) {
  const pageUrl = absoluteUrl(`/${vertical.slug}`);

  return {
    service: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: vertical.name,
      serviceType: vertical.primaryKeyword,
      description: vertical.description,
      url: pageUrl,
      areaServed: "Worldwide",
      provider: {
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.publicUrl,
        email: siteConfig.salesEmail,
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: `${vertical.name} plans`,
        itemListElement: plans.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          description: plan.description,
          url: absoluteUrl(`/services/${plan.categorySlug}`),
          price: plan.contactSalesOnly ? undefined : String(plan.monthlyPrice),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        })),
      },
    },
    faq: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: vertical.faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
    breadcrumb: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteConfig.publicUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Services",
          item: absoluteUrl("/services"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: vertical.name,
          item: pageUrl,
        },
      ],
    },
  };
}

export function ProductVerticalPage({ slug }) {
  const vertical = getServiceVertical(slug);

  if (!vertical) {
    return null;
  }

  const theme = verticalThemes[slug] || verticalThemes["managed-servers"];
  const Icon = verticalIconMap[slug] || Server;
  const plans = productPlanSeeds.filter((plan) => vertical.categorySlugs.includes(plan.categorySlug));
  const laneTechItems = [...new Set(plans.flatMap((plan) => plan.techStack || []))];
  const categories = vertical.categorySlugs
    .map((categorySlug) => serviceCategories.find((category) => category.slug === categorySlug))
    .filter(Boolean);
  const departmentContact = getDepartmentContactByServiceSlug(vertical.categorySlugs[0]);
  const proof = verticalProof[slug] || fallbackVerticalProof;
  const schema = buildSchema(vertical, plans);

  return (
    <main className="overflow-hidden">
      <JsonLd data={schema.service} />
      <JsonLd data={schema.faq} />
      <JsonLd data={schema.breadcrumb} />

      <section className="relative border-b border-slate-200/80">
        <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-55" />
        <div className="relative mx-auto max-w-[1520px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className={cn("eo-premium-card eo-reveal-up overflow-hidden rounded-lg border p-6 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.38)] md:p-9 lg:p-11", theme.shell)}>
            <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
              <div className="max-w-5xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-md ring-1", theme.icon)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className={cn("text-xs font-semibold uppercase tracking-[0.22em]", theme.accent)}>{vertical.eyebrow}</p>
                </div>

                <h1 className="mt-7 text-[clamp(2.7rem,7vw,6.4rem)] font-semibold leading-[0.96] tracking-[-0.06em] text-slate-950">
                  {vertical.title}
                </h1>
                <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">{vertical.description}</p>
                <ServiceLogoCluster categorySlugs={vertical.categorySlugs} techItems={laneTechItems} max={7} showLabels className="mt-7" />

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={getSignupPath()}>
                    <Button className="min-w-[170px] justify-center">
                      Start With {vertical.shortName}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href={`mailto:${departmentContact.email}`}>
                    <Button variant="ghost" className="min-w-[170px] justify-center bg-white/90">
                      Email {departmentContact.title}
                    </Button>
                  </a>
                </div>
              </div>

              <aside className="eo-reveal-soft rounded-lg border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.32)]" style={{ "--eo-delay": "130ms" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Built For</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {vertical.audience.map((item) => (
                    <span key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-6 border-t border-slate-950/[0.08] pt-5">
                  <p className="text-sm leading-7 text-slate-600">{proof.aside}</p>
                  <ServiceLogoCluster categorySlugs={vertical.categorySlugs} techItems={laneTechItems} max={5} className="mt-5" />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-slate-50/60">
        <div className="mx-auto grid max-w-[1520px] gap-8 px-4 py-14 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:items-center">
          <div className="eo-reveal-up">
            <p className={cn("text-xs font-semibold uppercase tracking-[0.24em]", theme.accent)}>Service Controls</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-slate-950 md:text-5xl">{proof.title}</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">{proof.description}</p>
            <ServiceLogoCluster categorySlugs={vertical.categorySlugs} techItems={laneTechItems} max={6} showLabels className="mt-7" />
          </div>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            {proof.controls.map((item, index) => (
              <div
                key={item}
                className="eo-premium-card eo-reveal-soft rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_42px_-36px_rgba(15,23,42,0.35)]"
                style={{ "--eo-delay": `${index * 55}ms` }}
              >
                <CheckCircle2 className={cn("h-5 w-5", theme.accent)} />
                <p className="mt-4 text-sm font-medium leading-7 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-[1520px] gap-8 px-4 py-14 sm:px-6 lg:px-8 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.24em]", theme.accent)}>Operating Outcomes</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-slate-950 md:text-5xl">
              What customers get from this service lane.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {vertical.outcomes.map((item, index) => (
              <div
                key={item}
                className="eo-premium-card eo-reveal-soft rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_42px_-36px_rgba(15,23,42,0.35)]"
                style={{ "--eo-delay": `${index * 45}ms` }}
              >
                <CheckCircle2 className={cn("h-5 w-5", theme.accent)} />
                <p className="mt-4 text-sm font-medium leading-7 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-slate-50/70">
        <div className="mx-auto grid max-w-[1520px] gap-8 px-4 py-14 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={cn("text-xs font-semibold uppercase tracking-[0.24em]", theme.accent)}>Plans And Apps</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-slate-950 md:text-5xl">
                  Services inside {vertical.name}.
                </h2>
              </div>
              <Link href="/services" className="hidden items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 md:inline-flex">
                All services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {plans.map((plan, index) => (
                <article
                  key={plan.slug}
                  className="eo-premium-card eo-reveal-soft rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.35)]"
                  style={{ "--eo-delay": `${Math.min(index * 45, 220)}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{categoryNameFor(plan.categorySlug)}</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-0.015em] text-slate-950">{plan.name}</h3>
                    </div>
                    <ServiceLogo brand={brandForPlan(plan)} imageClassName="h-7 w-8" className="[&>span:first-child]:h-11 [&>span:first-child]:w-11" />
                    <p className="shrink-0 text-sm font-semibold text-slate-950">
                      {plan.contactSalesOnly ? plan.displayPriceLabel : `${formatCurrency(plan.monthlyPrice)}/mo`}
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{plan.description}</p>
                  <TechLogoPills items={plan.techStack} limit={4} className="mt-5" />
                  <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-950/[0.07] pt-4">
                    <Link href={`/services/${plan.categorySlug}`} className="text-sm font-semibold text-slate-600 transition hover:text-slate-950">
                      Service details
                    </Link>
                    <Link href={getPurchasePath(plan)}>
                      <Button variant="ghost" className="min-h-10 rounded-md px-4 py-2">
                        {plan.contactSalesOnly ? "Contact" : "Configure"}
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="eo-premium-card eo-reveal-soft rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.35)]">
              <p className={cn("text-xs font-semibold uppercase tracking-[0.22em]", theme.accent)}>How It Works</p>
              <ol className="mt-5 space-y-4">
                {vertical.process.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white", theme.bar)}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="pt-1 text-sm font-medium leading-6 text-slate-700">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="eo-premium-card eo-reveal-soft rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.35)]" style={{ "--eo-delay": "80ms" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Related Detail Pages</p>
              <div className="mt-4 space-y-2">
                {categories.map((category) => {
                  const brand = getCategoryBrand(category.slug);

                  return (
                    <Link
                      key={category.slug}
                      href={`/services/${category.slug}`}
                      className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
                    >
                      <span className="flex items-center gap-2">
                        <ServiceLogo brand={brand} imageClassName="h-5 w-6" className="[&>span:first-child]:h-7 [&>span:first-child]:w-7 [&>span:first-child]:rounded-lg [&>span:first-child]:shadow-none" />
                        {category.name}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-[1520px] gap-8 px-4 py-14 sm:px-6 lg:px-8 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.24em]", theme.accent)}>Answers</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-slate-950 md:text-5xl">
              Questions customers ask before choosing {vertical.shortName}.
            </h2>
          </div>
          <div className="grid gap-4">
            {vertical.faqs.map((item, index) => (
              <article
                key={item.question}
                className="eo-premium-card eo-reveal-soft rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_42px_-36px_rgba(15,23,42,0.35)]"
                style={{ "--eo-delay": `${index * 45}ms` }}
              >
                <h3 className="text-lg font-semibold tracking-[-0.01em] text-slate-950">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Next Step</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] md:text-5xl">
              Bring {vertical.name.toLowerCase()} into your ElevenOrbits operating flow.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={getSignupPath()}>
              <Button className="bg-white text-slate-950 hover:bg-slate-100">Create Account</Button>
            </Link>
            <Link href="/services">
              <Button variant="ghost" className="border-white/15 bg-white/10 text-white ring-white/10 hover:bg-white/15 hover:text-white">
                Compare Services
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
