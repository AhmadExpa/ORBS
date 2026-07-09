import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { featuredTechPartners } from "@/lib/marketing-content";
import { getPurchasePath, productPlanSeeds, serviceCategories, formatCurrency } from "@/lib/shared";
import { Button, cn } from "@/lib/ui";

export const metadata = {
  title: "Pricing | ElevenOrbits",
  description:
    "Managed service pricing for VPS, VDS, AI servers, Vicidial, CDN, object storage, workflow automation, AI solutions, development support, and cybersecurity.",
};

const categoryTone = {
  vps: "from-cyan-500/18 to-sky-500/8 text-cyan-200 border-cyan-300/20",
  vds: "from-blue-500/18 to-cyan-500/8 text-blue-200 border-blue-300/20",
  "ai-servers": "from-violet-500/18 to-cyan-500/8 text-violet-200 border-violet-300/20",
  vicidial: "from-emerald-500/18 to-cyan-500/8 text-emerald-200 border-emerald-300/20",
  workflows: "from-orange-500/18 to-cyan-500/8 text-orange-200 border-orange-300/20",
  "ai-solutions": "from-fuchsia-500/18 to-cyan-500/8 text-fuchsia-200 border-fuchsia-300/20",
  "development-support": "from-slate-400/18 to-cyan-500/8 text-slate-200 border-slate-300/20",
  cybersecurity: "from-red-500/18 to-cyan-500/8 text-red-200 border-red-300/20",
  cdn: "from-cyan-500/18 to-emerald-500/8 text-cyan-200 border-cyan-300/20",
  "object-storage": "from-emerald-500/18 to-cyan-500/8 text-emerald-200 border-emerald-300/20",
};

const confidenceItems = [
  {
    label: "Managed delivery",
    value: "Every paid plan includes ElevenOrbits operational ownership, ticket routing, and change handling.",
    icon: ShieldCheck,
  },
  {
    label: "Yearly advantage",
    value: "Eligible infrastructure and security plans include yearly savings where configured.",
    icon: Clock3,
  },
  {
    label: "Partner ecosystem",
    value: "The service catalog is backed by proven infrastructure, security, cloud, AI, and communications vendors.",
    icon: Layers3,
  },
];

function getPlansForCategory(categorySlug) {
  return productPlanSeeds
    .filter((plan) => plan.categorySlug === categorySlug)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

function getStartingPrice(plans) {
  const pricedPlans = plans.filter((plan) => !plan.contactSalesOnly && Number(plan.monthlyPrice) > 0);
  if (!pricedPlans.length) {
    return "Custom";
  }

  const lowest = pricedPlans.reduce((min, plan) => (plan.monthlyPrice < min.monthlyPrice ? plan : min), pricedPlans[0]);
  return `${formatCurrency(lowest.monthlyPrice)}/mo`;
}

function getBillingLabel(plan) {
  if (plan.contactSalesOnly) {
    return "Custom engagement";
  }

  return `Billing: ${plan.billingCycles.join(" / ")}`;
}

function PlanRow({ plan }) {
  const primaryFeatures = plan.features.slice(0, 3);
  const price = plan.contactSalesOnly ? plan.displayPriceLabel : `${formatCurrency(plan.monthlyPrice)}/mo`;

  return (
    <div className="grid gap-5 px-5 py-6 md:grid-cols-[minmax(0,1.1fr)_170px_minmax(0,1.25fr)_190px] md:items-center lg:px-7">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">{plan.name}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{plan.description}</p>
      </div>

      <div>
        <p className="text-3xl font-semibold tracking-tight text-slate-950">{price}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{getBillingLabel(plan)}</p>
      </div>

      <div className="space-y-3">
        {primaryFeatures.map((feature) => (
          <div key={feature} className="flex gap-2 text-sm leading-5 text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <span>{feature}</span>
          </div>
        ))}
        {plan.techStack?.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {plan.techStack.slice(0, 4).map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <Link href={getPurchasePath(plan)} className="w-full md:w-auto">
        <Button className="w-full rounded-md">{plan.contactSalesOnly ? "Contact Sales" : "Choose Plan"}</Button>
      </Link>
    </div>
  );
}

export default function PricingPage() {
  const activeCategories = serviceCategories
    .map((category) => ({ category, plans: getPlansForCategory(category.slug) }))
    .filter((item) => item.plans.length);

  return (
    <main className="bg-slate-50">
      <section className="relative overflow-hidden bg-[#04101f] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(14,165,233,0.28),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(249,115,22,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#07192e_48%,#020617_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:items-end lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300">Pricing</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
              Managed service pricing with clear delivery ownership.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
              Compare managed hosting, dedicated servers, AI infrastructure, CDN, object storage, Vicidial operations, automation, support, and cybersecurity plans. Pricing can be adjusted from the admin dashboard after deployment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_16px_36px_-22px_rgba(255,255,255,0.6)] transition hover:bg-slate-100">
                Talk to Sales
              </Link>
              <Link href="/tech-stack" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-cyan-300/40 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/10">
                View Tech Stack
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="border-l border-white/10 pl-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">What is included</p>
            <div className="mt-5 grid gap-5">
              {confidenceItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-cyan-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Service catalog</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Choose the service lane that matches the work.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            Each lane keeps pricing, support coverage, and technology stack visible before checkout so customers know what they are buying and what the ElevenOrbits team will operate.
          </p>
        </div>

        <div className="mt-9 space-y-8">
          {activeCategories.map(({ category, plans }, categoryIndex) => (
            <section key={category.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-52px_rgba(15,23,42,0.75)]">
              <div className={cn("border-b bg-gradient-to-br from-slate-950 to-slate-900 px-5 py-6 text-white lg:px-7", categoryTone[category.slug])}>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-current">Service Lane {String(categoryIndex + 1).padStart(2, "0")}</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{category.name}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">{category.description}</p>
                  </div>
                  <div className="lg:text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Starting at</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{getStartingPrice(plans)}</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-200">
                {plans.map((plan) => (
                  <PlanRow key={plan.slug} plan={plan} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-8 border-y border-slate-200 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-sky-600">
                <Sparkles className="h-4 w-4" />
                Partner-backed operations
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Built around a practical technology ecosystem.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                The pricing catalog connects to the same stack used across cybersecurity, cloud continuity, endpoint management, helpdesk, AI enablement, and UCaaS services.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              {featuredTechPartners.map((partner) => (
                <span key={partner} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                  {partner}
                </span>
              ))}
              <Link href="/tech-stack" className="inline-flex items-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                Full tech stack
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
