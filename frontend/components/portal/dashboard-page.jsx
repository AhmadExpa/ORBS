"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Box, Clock, LifeBuoy, Plus, Receipt, Server, Wallet } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { MetricGrid } from "@/components/shared/metric-grid";
import { useActionToast } from "@/components/shared/feedback-layer";
import { Topbar } from "@/components/shared/topbar";
import { PageLoader } from "@/components/shared/page-loader";
import { useCustomerQuery } from "@/lib/api/hooks";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "Pending";
}

function getCurrentServices(subscriptions) {
  return subscriptions.filter((item) => !["cancelled", "expired"].includes(item.status));
}

export function PortalDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useActionToast();
  const [reviewMessage, setReviewMessage] = useState("");
  const paymentStatus = searchParams.get("payment");
  const { data, isLoading } = useCustomerQuery({
    queryKey: ["portal-dashboard"],
    path: "/subscriptions",
  });
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-dashboard-profile"],
    path: "/profile/me",
  });
  const invoicesQuery = useCustomerQuery({
    queryKey: ["portal-invoices"],
    path: "/invoices",
  });
  const paymentsQuery = useCustomerQuery({
    queryKey: ["portal-payments"],
    path: "/payments/submissions",
  });
  const ticketsQuery = useCustomerQuery({
    queryKey: ["portal-tickets"],
    path: "/tickets",
  });

  const subscriptions = data?.subscriptions || [];
  const profile = profileQuery.data?.user;
  const invoices = invoicesQuery.data?.invoices || [];
  const submissions = paymentsQuery.data?.submissions || [];
  const tickets = ticketsQuery.data?.tickets || [];
  const currentServices = getCurrentServices(subscriptions);
  const activeSubscriptions = subscriptions.filter((item) => item.status === "active");
  const openTickets = tickets.filter((item) => ["open", "pending"].includes(item.status));
  const outstandingInvoiceTotal = invoices.filter((item) => item.status !== "paid").reduce((sum, item) => sum + item.amount, 0);
  const latestService = currentServices[0];
  const latestPayment = submissions[0];
  const dashboardLoading =
    isLoading ||
    profileQuery.isLoading ||
    invoicesQuery.isLoading ||
    paymentsQuery.isLoading ||
    ticketsQuery.isLoading;
  const hasDashboardData = Boolean(data || profileQuery.data || invoicesQuery.data || paymentsQuery.data || ticketsQuery.data);
  const showInitialLoader = dashboardLoading && !hasDashboardData;

  const topbarActions = (
    <>
      <Link href="/portal/services">
        <Button>
          <Plus className="h-4 w-4" />
          Order an App
        </Button>
      </Link>
      <Link href="/portal/payments">
        <Button variant="ghost">
          <Wallet className="h-4 w-4" />
          Top Up Balance
        </Button>
      </Link>
    </>
  );

  useEffect(() => {
    if (paymentStatus !== "under-review") {
      return;
    }

    setReviewMessage("Your payment is under review.");
    showToast({
      type: "info",
      action: "Payment Review",
      title: "Payment under review",
      description: "Your payment was received and is waiting for admin verification.",
    });

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("payment");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/portal?${nextQuery}` : "/portal", { scroll: false });
  }, [paymentStatus, router, searchParams, showToast]);

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle="Your services, wallet balance, invoices, and support activity at a glance."
        actions={topbarActions}
      />
      {showInitialLoader ? (
        <PageLoader title="Loading your dashboard" subtitle="Gathering your subscriptions, payments, invoices, and support activity…" />
      ) : (
        <div className="mx-auto w-full max-w-[1680px] space-y-6 p-6 md:p-8">
          {reviewMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900">
              {reviewMessage}
            </div>
          ) : null}

          <div aria-busy={dashboardLoading} className="space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Server className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-500">Latest service</p>
                      <h2 className="truncate text-2xl font-semibold tracking-[-0.02em] text-slate-900">
                        {latestService?.productPlanId?.name || "No active service yet"}
                      </h2>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="font-semibold text-slate-400">Status</p>
                      <p className="mt-1 font-semibold capitalize text-slate-900">{latestService?.status ? latestService.status.replaceAll("_", " ") : "Not started"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-400">Renews</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatDate(latestService?.renewalDate)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-400">Wallet</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrency(profile?.accountBalance || 0)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-900 px-5 py-4 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white/60">Latest payment</p>
                      <p className="mt-1 text-lg font-semibold">{latestPayment?.invoiceCode || "No payment yet"}</p>
                      <p className="mt-1 text-sm font-medium text-white/60">
                        {latestPayment ? `Submitted ${formatDate(latestPayment.submittedAt)}` : "Payments appear here once submitted"}
                      </p>
                    </div>
                    {latestPayment ? <StatusBadge status={latestPayment.status} className="border-white/20 bg-white/10 text-white" /> : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <MetricGrid
              items={[
                { label: "Active Apps", value: currentServices.length, helper: "Current services in your portal", icon: Box, tone: "blue" },
                { label: "Active Subscriptions", value: activeSubscriptions.length, helper: "Approved recurring services", icon: Server, tone: "green" },
                { label: "Wallet Balance", value: formatCurrency(profile?.accountBalance || 0), helper: "Available portal credit", icon: Wallet, tone: "neutral" },
              { label: "Payment Records", value: submissions.length, helper: "Card charges and wallet top-ups", icon: Clock, tone: "amber" },
                { label: "Outstanding Invoices", value: formatCurrency(outstandingInvoiceTotal), helper: `${openTickets.length} open ticket${openTickets.length === 1 ? "" : "s"}`, icon: Receipt, tone: "rose" },
              ]}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>Active services</CardTitle>
                      <CardDescription>Your running subscriptions and renewal dates</CardDescription>
                    </div>
                    <Link href="/portal/services" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
                      View all
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={[
                      { key: "plan", label: "Plan", render: (row) => row.productPlanId?.name || "Managed service" },
                      { key: "billingCycle", label: "Cycle", render: (row) => row.billingCycle?.replaceAll("_", " ") || "monthly" },
                      { key: "renewalDate", label: "Renews", render: (row) => formatDate(row.renewalDate) },
                      { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                    ]}
                    rows={currentServices.slice(0, 5)}
                    emptyMessage="You don't have any active services yet — order one to get started."
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>Recent payments</CardTitle>
                      <CardDescription>Card charges and wallet top-ups</CardDescription>
                    </div>
                    <Link href="/portal/support" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
                      <LifeBuoy className="h-4 w-4" />
                      Get support
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {submissions.slice(0, 4).map((submission) => (
                    <div key={submission._id} className="rounded-lg border border-line bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{submission.submissionType === "wallet_topup" ? "Wallet top-up" : submission.invoiceCode}</p>
                          <p className="mt-1 text-sm font-medium text-slate-500">Submitted {formatDate(submission.submittedAt)}</p>
                        </div>
                        <StatusBadge status={submission.status} />
                      </div>
                    </div>
                  ))}
                  {!submissions.length ? (
                    <div className="rounded-lg border border-dashed border-line bg-slate-50 p-5 text-sm font-medium text-slate-500">
                      No payment activity yet — your charges and top-ups will appear here.
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
