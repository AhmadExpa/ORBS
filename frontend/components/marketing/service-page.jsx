import Link from "next/link";
import { getPurchasePath, productPlanSeeds, serviceCategories, serviceMarketingContent, formatCurrency } from "@/lib/shared";
import { getDepartmentContactByServiceSlug, siteConfig } from "@/lib/constants/site";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/lib/ui";

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

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <JsonLd data={serviceSchema} />
      <JsonLd data={breadcrumbSchema} />
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
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
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {plans.length === 0 ? (
            <Card>
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
            plans.map((plan) => (
              <Card key={plan.slug}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
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
                      <div className="mt-3 flex flex-wrap gap-2">
                        {plan.techStack.map((item) => (
                          <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <ul className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    {plan.features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{departmentContact.title}</CardTitle>
              <CardDescription>{departmentContact.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-600">
              <a className="text-base font-semibold text-sky-700" href={`mailto:${departmentContact.email}`}>
                {departmentContact.email}
              </a>
              <p>Use this address for questions related to {category.name.toLowerCase()}, scoping, onboarding, or managed service coordination.</p>
            </CardContent>
          </Card>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Managed by ElevenOrbits</CardTitle>
              <CardDescription>Support and operations stay with our team across all managed services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-600">
              <p>Customers do not self-manage infra from this portal. We handle monitoring, maintenance, and day-to-day operations.</p>
              <p>Fixed-price plans now start with account access, then configuration, card payment, and a confirmation page before the portal opens.</p>
              <p>Contact-sales plans route through the department contact flow first.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
