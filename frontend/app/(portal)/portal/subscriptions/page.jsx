"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge } from "@/lib/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";

function canUnsubscribe(subscription) {
  return !["cancelled", "expired"].includes(subscription?.status);
}

export default function PortalSubscriptionsPage() {
  const { getToken } = useAuth();
  const { showToast } = useActionToast();
  const { data, isLoading, refetch } = useCustomerQuery({
    queryKey: ["portal-subscriptions"],
    path: "/subscriptions",
  });
  const [actionState, setActionState] = useState({ loadingId: "", error: "" });
  const subscriptions = data?.subscriptions || [];

  async function handleUnsubscribe(subscription) {
    if (!canUnsubscribe(subscription)) {
      return;
    }

    const planName = subscription.productPlanId?.name || "this service";
    const confirmed = window.confirm(`Unsubscribe from ${planName}? This will cancel the linked service in your portal.`);
    if (!confirmed) {
      return;
    }

    setActionState({ loadingId: subscription._id, error: "" });

    try {
      const token = await getToken();
      const response = await apiFetch(`/subscriptions/${subscription._id}/cancel`, {
        method: "POST",
        token,
      });

      showToast({
        type: "info",
        action: "Subscription",
        title: "Subscription cancelled",
        description: response.message || "The subscription has been cancelled.",
      });
      setActionState({ loadingId: "", error: "" });
      await refetch();
    } catch (error) {
      setActionState({ loadingId: "", error: error.message || "The subscription could not be cancelled." });
      showToast({
        type: "error",
        action: "Subscription",
        title: "Unsubscribe failed",
        description: error.message || "The subscription could not be cancelled.",
      });
    }
  }

  if (isLoading && !data) {
    return (
      <PageLoader
        title="Subscriptions"
        subtitle="Track billing cycle, renewal dates, and the wallet-driven automatic deduction status for all subscriptions."
        cardCount={2}
        lines={4}
      />
    );
  }

  return (
    <div>
      <Topbar
        title="Subscriptions"
        subtitle="Track billing cycle, renewal dates, and the wallet-driven automatic deduction status for all subscriptions."
      />
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/portal/services">
            <Button>Order Another Service</Button>
          </Link>
          <Link href="/portal/payments">
            <Button variant="ghost">Top Up Wallet</Button>
          </Link>
        </div>

        {actionState.error ? <p className="text-sm font-medium text-rose-600">{actionState.error}</p> : null}

        {subscriptions.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>
                Track billing cycle, renewal dates, and the wallet-driven automatic deduction status for all subscriptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    key: "plan",
                    label: "Plan",
                    render: (row) => (
                      <Link className="font-semibold text-sky-700" href={`/portal/services/${row._id}`}>
                        {row.productPlanId?.name || "Managed Service"}
                      </Link>
                    ),
                  },
                  { key: "billingCycle", label: "Cycle" },
                  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  {
                    key: "renewalDate",
                    label: "Renewal",
                    render: (row) => (row.renewalDate ? new Date(row.renewalDate).toLocaleDateString() : "Pending"),
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (row) =>
                      canUnsubscribe(row) ? (
                        <Button
                          className="whitespace-nowrap"
                          type="button"
                          variant="ghost"
                          disabled={actionState.loadingId === row._id}
                          onClick={() => handleUnsubscribe(row)}
                        >
                          {actionState.loadingId === row._id ? "Cancelling..." : "Unsubscribe"}
                        </Button>
                      ) : (
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Unavailable</span>
                      ),
                  },
                ]}
                rows={subscriptions}
                emptyMessage="No subscriptions found."
              />
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No subscriptions found"
            description="Subscriptions appear after you create an order."
            action={
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/portal/services">
                  <Button>Order Another Service</Button>
                </Link>
                <Link href="/portal/payments">
                  <Button variant="ghost">Top Up Wallet</Button>
                </Link>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
