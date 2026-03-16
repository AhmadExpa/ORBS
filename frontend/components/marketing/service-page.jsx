import Link from "next/link";
import { productPlanSeeds, serviceCategories, serviceMarketingContent, formatCurrency } from "@/lib/shared";
import { getDepartmentContactByServiceSlug } from "@/lib/constants/site";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/lib/ui";
import { OrbMascot } from "@/components/shared/orb-mascot";

export function ServicePage({ slug }) {
  const category = serviceCategories.find((item) => item.slug === slug);
  const plans = productPlanSeeds.filter((plan) => plan.categorySlug === slug);
  const marketing = serviceMarketingContent[slug];
  const departmentContact = getDepartmentContactByServiceSlug(slug);

  if (!category) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
        <SectionHeading
          eyebrow="Service Detail"
          title={marketing?.headline || category.name}
          description={marketing?.body || category.description}
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup">
            <Button>Start Subscription</Button>
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
                    <Link href={plan.contactSalesOnly ? "/#contact" : `/portal/order/${plan.slug}`}>
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
              <OrbMascot
                size="sm"
                eyebrow="Orbs Guide"
                title="Need AI, support, or onboarding direction?"
                description="Orbs is the ElevenOrbits character used across service guidance, FAQs, and support explanations."
                align="stack"
              />
              <p>Customers do not self-manage infra from this portal. We handle monitoring, maintenance, and day-to-day operations.</p>
              <p>Fixed-price plans move through checkout, manual payment verification, and wallet-based renewals. Contact-sales plans route through the department contact flow first.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
