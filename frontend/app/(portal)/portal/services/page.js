"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge } from "@/lib/ui";
import { Topbar } from "@/components/shared/topbar";
import { useCustomerQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";
import { serviceFamilies, formatCurrency } from "@/lib/shared";

export default function PortalServicesPage() {
  const subscriptionsQuery = useCustomerQuery({
    queryKey: ["portal-services"],
    path: "/subscriptions",
  });
  const catalogQuery = useQuery({
    queryKey: ["portal-service-catalog"],
    queryFn: () => apiFetch("/catalog/plans"),
  });

  const subscriptions = subscriptionsQuery.data?.subscriptions || [];
  const plans = catalogQuery.data?.plans || [];

  return (
    <div>
      <Topbar
        title="Services"
        subtitle="Review service families, included technologies, and your active managed subscriptions."
        actions={
          <Link href="/portal/payments">
            <Button variant="ghost">Top Up Wallet</Button>
          </Link>
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-5 xl:grid-cols-2">
          {serviceFamilies.map((family) => {
            const familyPlans = plans.filter((plan) => family.categorySlugs.includes(plan.categoryId?.slug));

            return (
              <Card key={family.name}>
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
                    <p className="text-sm font-semibold text-slate-500">Core Tech Stack</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {family.techHighlights.map((item) => (
                        <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {familyPlans.slice(0, 3).map((plan) => (
                      <div key={plan._id} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-900">{plan.name}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {plan.contactSalesOnly ? plan.displayPriceLabel : `${formatCurrency(plan.monthlyPrice)} / month`}
                            </p>
                          </div>
                          <Link href={plan.contactSalesOnly ? "/#contact" : `/portal/order/${plan.slug}`}>
                            <Button>{plan.contactSalesOnly ? "Contact Sales" : "Configure"}</Button>
                          </Link>
                        </div>
                        {plan.techStack?.length ? (
                          <p className="mt-3 text-sm text-slate-600">Tech stack: {plan.techStack.join(", ")}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Managed Services</CardTitle>
            <CardDescription>Subscriptions currently attached to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  key: "service",
                  label: "Service",
                  render: (row) => (
                    <Link className="font-semibold text-sky-700" href={`/portal/services/${row._id}`}>
                      {row.productPlanId?.name || "Managed Service"}
                    </Link>
                  ),
                },
                { key: "category", label: "Category", render: (row) => row.productPlanId?.categoryId?.name || "Unknown" },
                { key: "billingCycle", label: "Cycle" },
                { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
              ]}
              rows={subscriptions}
              emptyMessage={subscriptionsQuery.isLoading ? "Loading services..." : "Order a service to create your first subscription."}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
