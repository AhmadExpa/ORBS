"use client";

import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";
import { useCustomerQuery } from "@/lib/api/hooks";

export function ServiceDetail({ serviceId }) {
  const { data, isLoading } = useCustomerQuery({
    queryKey: ["portal-service-detail", serviceId],
    path: "/subscriptions",
  });

  const subscription = (data?.subscriptions || []).find((item) => item._id === serviceId);
  const billingAmount = Number(subscription?.metadata?.billingAmount || 0);
  const techStack = subscription?.productPlanId?.techStack || [];
  const categoryName = subscription?.productPlanId?.categoryId?.name || "Managed Service";

  if (isLoading) {
    return (
      <div>
        <Topbar title="Service Detail" subtitle="Loading service details..." />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div>
        <Topbar title="Service Detail" subtitle="Subscription not found." />
      </div>
    );
  }

  return (
    <div>
      <Topbar title={subscription.productPlanId?.name || "Managed Service"} subtitle={`${categoryName} managed and operated by ElevenOrbits.`} />
      <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Overview</CardTitle>
              <CardDescription>Operational delivery remains with ElevenOrbits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <StatusBadge status={subscription.status} />
              </div>
              <div className="flex items-center justify-between">
                <span>Category</span>
                <span className="font-semibold text-slate-900">{categoryName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Billing Cycle</span>
                <span className="font-semibold capitalize text-slate-900">{subscription.billingCycle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Renewal Date</span>
                <span className="font-semibold text-slate-900">
                  {subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : "Pending verification"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>{formatCurrency(billingAmount)} current billing amount</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              {(subscription.productPlanId?.features || []).map((feature) => (
                <p key={feature}>• {feature}</p>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Tech Stack & Renewal Wallet</CardTitle>
            <CardDescription>Renewals deduct automatically from your approved wallet balance on the due date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Renewal Amount</span>
              <span className="font-semibold text-slate-900">{formatCurrency(billingAmount)}</span>
            </div>
            {techStack.length ? (
              <div>
                <p className="text-sm font-semibold text-slate-500">Managed Tech Stack</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {techStack.map((item) => (
                    <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              If the wallet balance is too low on the renewal date, the system marks the subscription for follow-up until you top it up again.
            </div>
            <Link href="/portal/payments">
              <Button variant="ghost">Top Up Wallet</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
