"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { getBillingCycleLabel } from "@/lib/shared";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge } from "@/lib/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";
import { DeleteReasonModal } from "@/components/portal/delete-reason-modal";

function canUnsubscribe(subscription) {
  return !["cancelled", "expired", "rejected"].includes(subscription?.status);
}

function canDeleteFromPortal(subscription) {
  return ["cancelled", "expired", "rejected"].includes(subscription?.status);
}

export default function PortalSubscriptionsPage() {
  const { getToken } = useAuth();
  const { showToast } = useActionToast();
  const { data, isLoading, refetch } = useCustomerQuery({
    queryKey: ["portal-subscriptions"],
    path: "/subscriptions",
  });
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-profile"],
    path: "/profile/me",
  });
  const [actionState, setActionState] = useState({ loadingId: "", type: "", error: "" });
  const [pendingAction, setPendingAction] = useState(null);
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const allSubscriptions = data?.subscriptions || [];
  const subscriptions = statusFilter ? allSubscriptions.filter((item) => (item.status || "") === statusFilter) : allSubscriptions;
  const pathname = usePathname();
  const isDelegate = profileQuery.data?.actorType === "delegate";
  const isAgent = pathname?.startsWith("/agent") || isDelegate;
  const columns = [
    {
      key: "plan",
      label: "Plan",
      render: (row) => (
        <Link className="font-semibold text-brand-700 hover:text-brand-600" href={isAgent ? `/agent/services/${row._id}` : `/portal/services/${row._id}`}>
          {row.productPlanId?.name || "Managed Service"}
        </Link>
      ),
    },
    { key: "billingCycle", label: "Cycle", render: (row) => getBillingCycleLabel(row.billingCycle) },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "renewalDate",
      label: "Renewal",
      render: (row) => (row.renewalDate ? new Date(row.renewalDate).toLocaleDateString() : "Pending"),
    },
    !isDelegate
      ? {
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
        }
      : null,
  ].filter(Boolean);

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

  async function handleConfirmAction(reason) {
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
        body: { reason },
      });

      showToast({
        type: "info",
        action: "Subscription",
        title: isDeleteAction ? "Service removed" : "Subscription cancelled",
        description: response.message || (isDeleteAction ? "The service record has been removed from your portal." : "The subscription has been cancelled."),
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
      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-6 md:p-8">
        {!isDelegate ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/portal/services">
              <Button>Order Another Service</Button>
            </Link>
            <Link href="/portal/payments">
              <Button variant="ghost">Top Up Wallet</Button>
            </Link>
          </div>
        ) : null}

        {actionState.error ? <p className="text-sm font-medium text-rose-600">{actionState.error}</p> : null}

        {allSubscriptions.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>
                Track billing cycle, renewal dates, and the wallet-driven automatic deduction status for all subscriptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                rows={subscriptions}
                emptyMessage={statusFilter ? "No subscriptions match this filter." : "No subscriptions found."}
              />
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No subscriptions found"
            description="Subscriptions appear after you create an order."
            action={
              !isDelegate ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/portal/services">
                  <Button>Order Another Service</Button>
                </Link>
                <Link href="/portal/payments">
                  <Button variant="ghost">Top Up Wallet</Button>
                </Link>
              </div>
              ) : null
            }
          />
        )}
      </div>
      <DeleteReasonModal
        open={Boolean(pendingAction)}
        title={pendingAction?.type === "delete" ? "Remove service record" : "Unsubscribe service"}
        subtitle={
          pendingAction?.type === "delete"
            ? `Remove ${pendingAction?.subscription?.productPlanId?.name || "this service"} from your portal history? Billing records stay intact.`
            : `Unsubscribe from ${pendingAction?.subscription?.productPlanId?.name || "this service"}? The linked service will be cancelled in your portal.`
        }
        confirmLabel={pendingAction?.type === "delete" ? "Delete from portal" : "Unsubscribe"}
        reasonLabel={pendingAction?.type === "delete" ? "Reason for deletion" : "Reason for cancellation"}
        otherLabel={pendingAction?.type === "delete" ? "Please describe the deletion reason" : "Please describe the cancellation reason"}
        isDeleting={Boolean(actionState.loadingId)}
        onClose={closeActionDialog}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
