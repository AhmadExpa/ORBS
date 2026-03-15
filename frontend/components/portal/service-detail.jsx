"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";
import { useCustomerQuery } from "@/lib/api/hooks";

const SERVER_CATEGORY_SLUGS = new Set(["vps", "vds"]);

function isServerSubscription(subscription) {
  return SERVER_CATEGORY_SLUGS.has(subscription?.productPlanId?.categoryId?.slug);
}

function hasAssignedCredentials(subscription) {
  const access = subscription?.serviceAccess || {};
  return Boolean(access.username || access.password || access.ipAddress);
}

export function ServiceDetail({ serviceId }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { data, isLoading } = useCustomerQuery({
    queryKey: ["portal-service-detail", serviceId],
    path: "/subscriptions",
  });

  const subscription = (data?.subscriptions || []).find((item) => item._id === serviceId);
  const billingAmount = Number(subscription?.metadata?.billingAmount || 0);
  const techStack = subscription?.productPlanId?.techStack || [];
  const categoryName = subscription?.productPlanId?.categoryId?.name || "Managed Service";
  const serviceAccess = subscription?.serviceAccess || {};
  const sharedDetails = subscription?.sharedDetails || [];
  const isServer = isServerSubscription(subscription);
  const credentialsAssigned = hasAssignedCredentials(subscription);

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
      <Topbar
        title={subscription.productPlanId?.name || "Managed Service"}
        subtitle={isServer ? "Server access and renewal details for this deployment." : `${categoryName} managed and operated by ElevenOrbits.`}
      />
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
          {isServer ? (
            <Card>
              <CardHeader>
                <CardTitle>Server Access</CardTitle>
                <CardDescription>Credentials assigned by the admin team appear here for your VPS or VDS.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                {credentialsAssigned ? (
                  <>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="text-slate-500">IP Address</span>
                      <span className="font-semibold text-slate-900">{serviceAccess.ipAddress || "Not assigned"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="text-slate-500">Username</span>
                      <span className="font-semibold text-slate-900">{serviceAccess.username || "Not assigned"}</span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Password</span>
                        <Button type="button" variant="ghost" onClick={() => setIsPasswordVisible((current) => !current)}>
                          {isPasswordVisible ? "Hide" : "Show"}
                        </Button>
                      </div>
                      <p className="mt-3 break-all font-semibold text-slate-900">
                        {serviceAccess.password ? (isPasswordVisible ? serviceAccess.password : "••••••••••••") : "Not assigned"}
                      </p>
                    </div>
                    {serviceAccess.assignedAt ? (
                      <p className="text-xs text-slate-500">Last updated {new Date(serviceAccess.assignedAt).toLocaleString()}.</p>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                    Server credentials have not been assigned yet. Contact the admin team if you need access.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
          {sharedDetails.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Shared Details</CardTitle>
                <CardDescription>Information assigned by the admin team for this subscription.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                {sharedDetails.map((detail, index) => (
                  <div key={`${detail.label}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-slate-500">{detail.label}</span>
                    <span className="font-semibold text-right text-slate-900">{detail.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
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
              <CardTitle>{isServer ? "Deployment Details & Renewal Wallet" : "Tech Stack & Renewal Wallet"}</CardTitle>
            <CardDescription>Renewals use wallet balance first and saved-card fallback second when card billing is available.</CardDescription>
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
              If the wallet does not fully cover the renewal on its due date, the system uses your saved card for the remaining amount. If no card is saved or the charge fails, the subscription is flagged for follow-up.
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
