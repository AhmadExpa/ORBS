import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Cloud,
  Cpu,
  Database,
  Network,
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

const categoryIconMap = {
  vps: Server,
  vds: Database,
  "ai-servers": Cpu,
  vicidial: PhoneCall,
  workflows: Workflow,
  "ai-solutions": Bot,
  "development-support": Wrench,
  cybersecurity: ShieldCheck,
  cdn: Network,
  "object-storage": Cloud,
  "hermes-ai-hosting": Bot,
  "openclaw-hosting": Bot,
  "nextcloud-hosting": Cloud,
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

function absoluteUrl(path) {
  return `${siteConfig.publicUrl}${path}`;
}

function categoryNameFor(slug) {
  return serviceCategories.find((category) => category.slug === slug)?.name || slug;
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
  const categories = vertical.categorySlugs
    .map((categorySlug) => serviceCategories.find((category) => category.slug === categorySlug))
    .filter(Boolean);
  const departmentContact = getDepartmentContactByServiceSlug(vertical.categorySlugs[0]);
  const schema = buildSchema(vertical, plans);

  return (
    <main className="overflow-hidden">
      <JsonLd data={schema.service} />
      <JsonLd data={schema.faq} />
      <JsonLd data={schema.breadcrumb} />

      <section className="relative border-b border-slate-200/80">
        <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-55" />
        <div className="relative mx-auto max-w-[1520px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className={cn("overflow-hidden rounded-lg border p-6 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.38)] md:p-9 lg:p-11", theme.shell)}>
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

              <aside className="rounded-lg border border-slate-200/80 bg-white/88 p-5 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.32)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Built For</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {vertical.audience.map((item) => (
                    <span key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-6 border-t border-slate-950/[0.08] pt-5">
                  <p className="text-sm leading-7 text-slate-600">
                    This page is part of the ElevenOrbits public product network. Login, billing, support, and private dashboards stay behind protected portal routes.
                  </p>
                </div>
              </aside>
            </div>
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
            {vertical.outcomes.map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_42px_-36px_rgba(15,23,42,0.35)]">
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
              {plans.map((plan) => (
                <article key={plan.slug} className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.35)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{categoryNameFor(plan.categorySlug)}</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-0.015em] text-slate-950">{plan.name}</h3>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-slate-950">
                      {plan.contactSalesOnly ? plan.displayPriceLabel : `${formatCurrency(plan.monthlyPrice)}/mo`}
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{plan.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {plan.techStack?.slice(0, 4).map((item) => (
                      <span key={item} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {item}
                      </span>
                    ))}
                  </div>
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
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.35)]">
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

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Related Detail Pages</p>
              <div className="mt-4 space-y-2">
                {categories.map((category) => {
                  const CategoryIcon = categoryIconMap[category.slug] || Server;

                  return (
                    <Link
                      key={category.slug}
                      href={`/services/${category.slug}`}
                      className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
                    >
                      <span className="flex items-center gap-2">
                        <CategoryIcon className="h-4 w-4" />
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
            {vertical.faqs.map((item) => (
              <article key={item.question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_42px_-36px_rgba(15,23,42,0.35)]">
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
