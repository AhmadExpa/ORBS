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

function canDeleteFromPortal(subscription) {
  return ["cancelled", "expired"].includes(subscription?.status);
}

function SubscriptionActionDialog({ action, isProcessing, onCancel, onConfirm }) {
  if (!action) {
    return null;
  }

  const planName = action.subscription?.productPlanId?.name || "this service";
  const isDeleteAction = action.type === "delete";
  const title = isDeleteAction ? "Remove Cancelled Service" : "Unsubscribe Service";
  const description = isDeleteAction
    ? `Remove ${planName} from your portal history? Billing records stay intact, but this service card will no longer appear in your portal.`
    : `Unsubscribe from ${planName}? This will cancel the linked service in your portal and stop it from remaining active.`;
  const confirmLabel = isDeleteAction ? "Delete from Portal" : "Unsubscribe";
  const processingLabel = isDeleteAction ? "Removing..." : "Unsubscribing...";
  const dismissLabel = isDeleteAction ? "Close" : "Keep Service";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <Card className="w-full max-w-lg overflow-hidden border-slate-200 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.45)]">
        <CardHeader className="bg-slate-50">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-950">{planName}</p>
            <p className="mt-2">Status: {action.subscription?.status || "Unknown"}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="ghost" disabled={isProcessing} onClick={onCancel}>
              {dismissLabel}
            </Button>
            <Button type="button" disabled={isProcessing} onClick={onConfirm}>
              {isProcessing ? processingLabel : confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PortalSubscriptionsPage() {
  const { getToken } = useAuth();
  const { showToast } = useActionToast();
  const { data, isLoading, refetch } = useCustomerQuery({
    queryKey: ["portal-subscriptions"],
    path: "/subscriptions",
  });
  const [actionState, setActionState] = useState({ loadingId: "", type: "", error: "" });
  const [pendingAction, setPendingAction] = useState(null);
  const subscriptions = data?.subscriptions || [];

  function openActionDialog(type, subscription) {
    if (type === "unsubscribe" && !canUnsubscribe(subscription)) {
      return;
    }

    if (type === "delete" && !canDeleteFromPortal(subscription)) {
      return;
    }

    setPendingAction({ type, subscription });
  }

  function closeActionDialog() {
    if (actionState.loadingId) {
      return;
    }

    setPendingAction(null);
  }

  async function handleConfirmAction() {
    if (!pendingAction?.subscription?._id) {
      return;
    }

    const { subscription, type } = pendingAction;
    const isDeleteAction = type === "delete";
    setActionState({ loadingId: subscription._id, type, error: "" });

    try {
      const token = await getToken();
      const response = await apiFetch(isDeleteAction ? `/subscriptions/${subscription._id}` : `/subscriptions/${subscription._id}/cancel`, {
        method: isDeleteAction ? "DELETE" : "POST",
        token,
      });

      showToast({
        type: "info",
        action: "Subscription",
        title: isDeleteAction ? "Service removed" : "Subscription cancelled",
        description: response.message || (isDeleteAction ? "The cancelled service has been removed from your portal." : "The subscription has been cancelled."),
      });
      setActionState({ loadingId: "", type: "", error: "" });
      setPendingAction(null);
      await refetch();
    } catch (error) {
      setActionState({
        loadingId: "",
        type: "",
        error: error.message || (isDeleteAction ? "The service could not be removed from your portal." : "The subscription could not be cancelled."),
      });
      showToast({
        type: "error",
        action: "Subscription",
        title: isDeleteAction ? "Delete failed" : "Unsubscribe failed",
        description: error.message || (isDeleteAction ? "The service could not be removed from your portal." : "The subscription could not be cancelled."),
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
                          onClick={() => openActionDialog("unsubscribe", row)}
                        >
                          {actionState.loadingId === row._id && actionState.type === "unsubscribe" ? "Cancelling..." : "Unsubscribe"}
                        </Button>
                      ) : canDeleteFromPortal(row) ? (
                        <Button
                          className="whitespace-nowrap"
                          type="button"
                          variant="ghost"
                          disabled={actionState.loadingId === row._id}
                          onClick={() => openActionDialog("delete", row)}
                        >
                          {actionState.loadingId === row._id && actionState.type === "delete" ? "Removing..." : "Delete from Portal"}
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
      <SubscriptionActionDialog
        action={pendingAction}
        isProcessing={Boolean(actionState.loadingId)}
        onCancel={closeActionDialog}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
