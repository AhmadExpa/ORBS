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
import { useCustomerQuery } from "@/lib/api/hooks";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "Pending";
}

function getCurrentServices(subscriptions) {
  return subscriptions.filter((item) => !["cancelled", "expired"].includes(item.status));
}

function LoadingDataRegion({ isLoading, children }) {
  return (
    <div aria-busy={isLoading} className="relative">
      <div
        className={[
          "space-y-6 transition duration-300",
          isLoading ? "pointer-events-none select-none opacity-55 blur-[2px]" : "opacity-100 blur-0",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
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
  const pendingPayments = submissions.filter((item) => item.status === "pending_verification");
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
        title="Customer Dashboard"
        subtitle="Manage subscriptions, wallet funding, invoices, and support from one place."
        actions={
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
        }
      />
      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-6 md:p-8">
        {reviewMessage ? (
          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/90 px-5 py-4 text-sm font-semibold text-emerald-900 shadow-sm">
            {reviewMessage}
          </div>
        ) : null}

        <LoadingDataRegion isLoading={dashboardLoading}>
          <Card className="overflow-hidden">
            <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-[0_16px_36px_-22px_rgba(15,23,42,0.8)]">
                    <Server className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-500">Service snapshot</p>
                    <h2 className="truncate text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                      {latestService?.productPlanId?.name || "No active app yet"}
                    </h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="font-semibold text-slate-400">Status</p>
                    <p className="mt-1 font-semibold text-slate-950">{latestService?.status ? latestService.status.replaceAll("_", " ") : "Not started"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400">Renewal</p>
                    <p className="mt-1 font-semibold text-slate-950">{formatDate(latestService?.renewalDate)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400">Wallet</p>
                    <p className="mt-1 font-semibold text-slate-950">{formatCurrency(profile?.accountBalance || 0)}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[20px] bg-slate-950 px-5 py-4 text-white shadow-[0_22px_52px_-34px_rgba(15,23,42,0.8)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white/60">Latest payment</p>
                    <p className="mt-1 text-lg font-semibold">{latestPayment?.invoiceCode || "No payment yet"}</p>
                    <p className="mt-1 text-sm font-medium text-white/60">
                      {latestPayment ? `Submitted ${formatDate(latestPayment.submittedAt)}` : "Payments appear after submission"}
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
              { label: "Pending Payments", value: pendingPayments.length, helper: "Waiting for verification", icon: Clock, tone: "amber" },
              { label: "Outstanding Invoices", value: formatCurrency(outstandingInvoiceTotal), helper: `${openTickets.length} open ticket${openTickets.length === 1 ? "" : "s"}`, icon: Receipt, tone: "rose" },
            ]}
          />

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Active Services</CardTitle>
                    <CardDescription>Provisioning and support coverage</CardDescription>
                  </div>
                  <Link href="/portal/services" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    { key: "plan", label: "Plan", render: (row) => row.productPlanId?.name || "Managed Service" },
                    { key: "billingCycle", label: "Cycle", render: (row) => row.billingCycle?.replaceAll("_", " ") || "monthly" },
                    { key: "renewalDate", label: "Renewal", render: (row) => formatDate(row.renewalDate) },
                    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  ]}
                  rows={currentServices.slice(0, 5)}
                  emptyMessage="No services yet."
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Recent Payments</CardTitle>
                    <CardDescription>Manual payment verification status</CardDescription>
                  </div>
                  <Link href="/portal/support" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
                    <LifeBuoy className="h-4 w-4" />
                    Support
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {submissions.slice(0, 4).map((submission) => (
                  <div key={submission._id} className="rounded-[20px] border border-slate-950/[0.06] bg-white/68 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{submission.submissionType === "wallet_topup" ? "Wallet Top-up" : submission.invoiceCode}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">Submitted {formatDate(submission.submittedAt)}</p>
                      </div>
                      <StatusBadge status={submission.status} />
                    </div>
                  </div>
                ))}
                {!submissions.length ? (
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm font-medium text-slate-500">
                    No payment submissions yet.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </LoadingDataRegion>
      </div>
    </div>
  );
}
