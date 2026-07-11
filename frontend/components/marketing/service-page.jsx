import Link from "next/link";
import { CheckCircle2, ClipboardList, LifeBuoy, Settings2 } from "lucide-react";
import { getPurchasePath, productPlanSeeds, serviceCategories, serviceMarketingContent, formatCurrency } from "@/lib/shared";
import { getDepartmentContactByServiceSlug, siteConfig } from "@/lib/constants/site";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/lib/ui";
import { ServiceLogo, ServiceLogoCluster, ServiceVisualPanel, TechLogoPills, getCategoryBrand } from "./service-branding";

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

function absoluteUrl(path) {
  return `${siteConfig.publicUrl}${path}`;
}

export function ServicePage({ slug }) {
  const category = serviceCategories.find((item) => item.slug === slug);
  const plans = productPlanSeeds.filter((plan) => plan.categorySlug === slug);
  const marketing = serviceMarketingContent[slug];
  const departmentContact = getDepartmentContactByServiceSlug(slug);
  const primaryPurchasePlan = plans.find((plan) => !plan.contactSalesOnly);
  const categoryBrand = getCategoryBrand(slug);
  const planTechItems = [...new Set(plans.flatMap((plan) => plan.techStack || []))];

  if (!category) {
    return null;
  }

  const pageUrl = absoluteUrl(`/services/${slug}`);
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: category.name,
    description: marketing?.body || category.description,
    url: pageUrl,
    areaServed: "Worldwide",
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.publicUrl,
      email: departmentContact.email,
      address: siteConfig.companyAddress,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${category.name} plans`,
      itemListElement: plans.map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        description: plan.description,
        url: pageUrl,
        price: plan.contactSalesOnly ? undefined : String(plan.monthlyPrice),
        priceCurrency: "USD",
      })),
    },
  };
  const breadcrumbSchema = {
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
        name: category.name,
        item: pageUrl,
      },
    ],
  };
  const coverageItems = [
    {
      label: "Scope captured",
      description: `${category.name} orders keep the service requirements, notes, and selected plan visible before fulfillment starts.`,
      icon: ClipboardList,
    },
    {
      label: "Managed setup",
      description: "Provisioning, access handoff, and technical setup stay with the ElevenOrbits team after approval.",
      icon: Settings2,
    },
    {
      label: "Support record",
      description: "Tickets, updates, and operational follow-up stay tied to the customer and active subscription.",
      icon: LifeBuoy,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <JsonLd data={serviceSchema} />
      <JsonLd data={breadcrumbSchema} />
      <section className="eo-premium-card eo-reveal-up rounded-lg border border-slate-200 bg-white p-8 shadow-panel">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div>
            <div className="mb-6">
              <ServiceLogo brand={categoryBrand} showLabel imageClassName="h-8 w-10" className="[&>span:first-child]:h-12 [&>span:first-child]:w-12 [&>span:first-child]:rounded-lg" />
            </div>
            <SectionHeading
              eyebrow="Service Detail"
              title={marketing?.headline || category.name}
              description={marketing?.body || category.description}
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={primaryPurchasePlan ? getPurchasePath(primaryPurchasePlan) : "/#contact"}>
                <Button>{primaryPurchasePlan ? "Start Subscription" : "Contact Sales"}</Button>
              </Link>
              <a href={`mailto:${departmentContact.email}`}>
                <Button variant="ghost">Email {departmentContact.title}</Button>
              </a>
            </div>
          </div>
          <ServiceVisualPanel
            title={`${category.name} delivery stack`}
            description="The public plan, portal order, and managed handoff all stay tied to this service lane."
            categorySlugs={[slug]}
            techItems={planTechItems}
            className="eo-float-slow"
          />
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {coverageItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="eo-premium-card eo-reveal-soft rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.32)]"
              style={{ "--eo-delay": `${index * 55}ms` }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-slate-950">{item.label}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {plans.length === 0 ? (
            <Card className="eo-premium-card eo-reveal-soft rounded-lg">
              <CardHeader>
                <CardTitle>Custom delivery</CardTitle>
                <CardDescription>This service is supported but starts as a custom engagement managed by ElevenOrbits.</CardDescription>
              </CardHeader>
              <CardContent>
                <a href={`mailto:${departmentContact.email}`}>
                  <Button>Email {departmentContact.title}</Button>
                </a>
              </CardContent>
            </Card>
          ) : (
            plans.map((plan, index) => (
              <Card
                key={plan.slug}
                className="eo-premium-card eo-reveal-soft rounded-lg"
                style={{ "--eo-delay": `${Math.min(index * 45, 220)}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <ServiceLogo brand={categoryBrand} imageClassName="h-7 w-8" className="[&>span:first-child]:h-11 [&>span:first-child]:w-11" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-3xl font-semibold text-slate-950">
                        {plan.contactSalesOnly ? plan.displayPriceLabel : formatCurrency(plan.monthlyPrice)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {plan.contactSalesOnly ? "Custom pricing" : "monthly billing available"}
                      </p>
                    </div>
                    <Link href={getPurchasePath(plan)}>
                      <Button>{plan.contactSalesOnly ? "Contact Sales" : "Configure"}</Button>
                    </Link>
                  </div>
                  {plan.techStack?.length ? (
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Tech Stack</p>
                      <TechLogoPills items={plan.techStack} limit={6} className="mt-3" />
                    </div>
                  ) : null}
                  <ul className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <div className="space-y-6">
          <Card className="eo-premium-card eo-reveal-soft h-fit rounded-lg">
            <CardHeader>
              <CardTitle>{departmentContact.title}</CardTitle>
              <CardDescription>{departmentContact.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-600">
              <a className="text-base font-semibold text-sky-700" href={`mailto:${departmentContact.email}`}>
                {departmentContact.email}
              </a>
              <p>Use this inbox for questions related to {category.name.toLowerCase()}, scoping, onboarding, or managed service coordination.</p>
              <address className="not-italic text-slate-700">{siteConfig.companyAddress}</address>
            </CardContent>
          </Card>
          <Card className="eo-premium-card eo-reveal-soft h-fit rounded-lg" style={{ "--eo-delay": "80ms" }}>
            <CardHeader>
              <CardTitle>Managed by ElevenOrbits</CardTitle>
              <CardDescription>Support and operations stay with our team across all managed services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-600">
              <p>Customers do not self-manage infra from this portal. We handle monitoring, maintenance, and day-to-day operations.</p>
              <p>Fixed-price plans now start with account access, then configuration, card payment, and a confirmation page before the portal opens.</p>
              <p>Contact-sales plans route through the department contact flow first.</p>
              <ServiceLogoCluster categorySlugs={[slug]} techItems={planTechItems} max={5} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
