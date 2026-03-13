import Link from "next/link";
import {
  productPlanSeeds,
  serviceCategories,
  serviceFamilies,
  serviceMarketingContent,
  formatCurrency,
} from "@/lib/shared";
import { siteConfig } from "@/lib/constants/site";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/lib/ui";

const highlightSlugs = [
  "basic-managed-vps",
  "balanced-managed-vds",
  "ai-server-starter",
  "starter-vicidial-management",
  "workflow-starter",
  "cybersecurity-basic",
];

export function LandingPage() {
  const pricingHighlights = productPlanSeeds.filter((plan) => highlightSlugs.includes(plan.slug));

  return (
    <div className="pb-16">
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
              Managed infrastructure, AI systems, and workflow automation
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                Hosting and AI services operated end-to-end by the ElevenOrbits team.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Launch managed VPS, VDS, AI servers, call-center operations, workflow automation, cybersecurity, and support services from one customer portal with manual payment verification, wallet top-ups, and ticketed support.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
              <Link href="/#pricing">
                <Button variant="ghost">View Plans</Button>
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Managed Infrastructure", value: "VPS, VDS, AI Servers" },
                { label: "AI & Automation", value: "n8n, Clawbot, DeepSeek" },
                { label: "Operations", value: "Wallet renewals, tickets, payment review" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel">
            <div className="rounded-[1.5rem] bg-hero-grid p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Managed by ElevenOrbits</p>
              <div className="mt-6 space-y-4">
                {Object.entries(serviceMarketingContent).slice(0, 4).map(([slug, item]) => (
                  <div key={slug} className="rounded-2xl border border-white/70 bg-white/80 p-4">
                    <p className="text-sm font-semibold text-slate-900">{serviceCategories.find((category) => category.slug === slug)?.name || slug}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Services"
          title="Service families are grouped around how customers actually buy and operate them."
          description="Servers, call centers, AI services, and cybersecurity are separated clearly so the portal reflects the business categories customers understand."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {serviceFamilies.map((family) => (
            <Card key={family.name} className="transition hover:-translate-y-1 hover:shadow-panel">
              <CardHeader>
                <CardTitle>{family.name}</CardTitle>
                <CardDescription>{family.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Includes</p>
                  <p className="mt-2 text-sm text-slate-700">{family.includes.join(", ")}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Core Tech</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {family.techHighlights.map((item) => (
                      <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <Link href="/signup">
                  <Button variant="ghost">Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 px-8 py-12 text-white">
          <SectionHeading
            eyebrow="Managed Infrastructure"
            title="Your servers stay under ElevenOrbits operational control."
            description="Customers never self-manage infra here. Every managed service page, order screen, and subscription panel reinforces that our team handles the servers, support depth, and ongoing maintenance."
            className="text-white"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              "Proactive maintenance and monitoring on every managed plan.",
              "Manual payment verification flow with QR and fallback payment link.",
              "Support tickets tied directly to subscriptions and services.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Pricing Highlights"
          title="Launch with seeded plans, then adjust everything from the admin dashboard."
          description="Monthly and yearly pricing, annual discounts, add-ons, custom plans, and contact-sales offers are all editable."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pricingHighlights.slice(0, 6).map((plan) => (
            <Card key={plan.slug} className="overflow-hidden">
              <CardHeader className="bg-slate-50">
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-semibold text-slate-950">
                    {plan.contactSalesOnly ? plan.displayPriceLabel : formatCurrency(plan.monthlyPrice)}
                  </p>
                  <p className="text-sm text-slate-500">{plan.contactSalesOnly ? "Custom engagement" : "per month"}</p>
                </div>
                {plan.techStack?.length ? (
                  <p className="text-sm text-slate-600">Tech stack: {plan.techStack.join(", ")}</p>
                ) : null}
                <ul className="space-y-2 text-sm text-slate-600">
                  {plan.features.slice(0, 3).map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-12 shadow-panel">
          <SectionHeading
            eyebrow="Contact"
            title="Plan the managed service with ElevenOrbits from one landing page."
            description="Use this page to review the offer, start an account, or contact the team for a scoped managed setup without jumping through separate marketing pages."
          />
          <div className="mt-6 grid gap-3 text-sm font-medium text-slate-600 md:grid-cols-3">
            <p>
              General:
              {" "}
              <a className="text-sky-700 hover:text-sky-800" href={`mailto:${siteConfig.generalEmail}`}>
                {siteConfig.generalEmail}
              </a>
            </p>
            <p>
              Sales:
              {" "}
              <a className="text-sky-700 hover:text-sky-800" href={`mailto:${siteConfig.salesEmail}`}>
                {siteConfig.salesEmail}
              </a>
            </p>
            <p>
              Support:
              {" "}
              <a className="text-sky-700 hover:text-sky-800" href={`mailto:${siteConfig.supportEmail}`}>
                {siteConfig.supportEmail}
              </a>
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost">Department Emails</Button>
            </Link>
            <a href={`mailto:${siteConfig.salesEmail}`}>
              <Button variant="ghost">Contact Sales</Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
