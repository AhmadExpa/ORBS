import Link from "next/link";
import { productPlanSeeds, serviceCategories, formatCurrency } from "@/lib/shared";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/lib/ui";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <SectionHeading
        eyebrow="Pricing"
        title="Seeded launch pricing for managed hosting, Vicidial, automation, AI, and support."
        description="All values are editable from the admin dashboard after deployment. Managed VPS yearly billing automatically starts at a 20% discount."
      />
      <div className="mt-10 space-y-8">
        {serviceCategories.map((category) => {
          const plans = productPlanSeeds.filter((plan) => plan.categorySlug === category.slug);
          if (!plans.length) {
            return null;
          }

          return (
            <section key={category.slug} className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{category.name}</h2>
              <div className="grid gap-5 lg:grid-cols-3">
                {plans.map((plan) => (
                  <Card key={plan.slug}>
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-3xl font-semibold text-slate-950">
                          {plan.contactSalesOnly ? plan.displayPriceLabel : formatCurrency(plan.monthlyPrice)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {plan.contactSalesOnly ? "Custom engagement" : `Billing cycles: ${plan.billingCycles.join(", ")}`}
                        </p>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-600">
                        {plan.features.slice(0, 4).map((feature) => (
                          <li key={feature}>• {feature}</li>
                        ))}
                      </ul>
                      {plan.techStack?.length ? <p className="text-sm text-slate-600">Tech stack: {plan.techStack.join(", ")}</p> : null}
                      <Link href={plan.contactSalesOnly ? "/#contact" : `/portal/order/${plan.slug}`}>
                        <Button className="w-full">{plan.contactSalesOnly ? "Contact Sales" : "Choose Plan"}</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
