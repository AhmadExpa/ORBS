"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileSignature,
  LifeBuoy,
  Plus,
  Receipt,
  Server,
  Wallet,
} from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge, cn } from "@/lib/ui";
import { formatCurrency, getMonthlyRecurringAmount, isActiveSubscription } from "@/lib/shared";
import { useActionToast } from "@/components/shared/feedback-layer";
import { Topbar } from "@/components/shared/topbar";
import { PageLoader } from "@/components/shared/page-loader";
import { DashboardSpendChart } from "@/components/portal/dashboard-spend-chart";
import { isContractSubmittedForPortal } from "@/components/portal/contract-gate";
import { useCustomerQuery } from "@/lib/api/hooks";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "Pending";
}

function daysUntil(value) {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

function relativeTime(value) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function renewalLabel(value) {
  const days = daysUntil(value);
  if (days == null) return "No date set";
  if (days < 0) return "Overdue";
  if (days === 0) return "Renews today";
  if (days === 1) return "Renews tomorrow";
  return `Renews in ${days} days`;
}

function KpiCard({ icon: Icon, label, value, helper, tone = "neutral", href }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-600",
    blue: "bg-brand-50 text-brand-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-accent-50 text-accent-600",
    rose: "bg-rose-50 text-rose-600",
  };
  const body = (
    <Card className={cn("h-full p-5 transition-shadow", href && "hover:shadow-card-hover")}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
        {href ? <ArrowUpRight className="h-4 w-4 text-slate-300" /> : null}
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs font-medium text-slate-400">{helper}</p> : null}
    </Card>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function PortalDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useActionToast();
  const [reviewMessage, setReviewMessage] = useState("");
  const paymentStatus = searchParams.get("payment");

  const { data, isLoading } = useCustomerQuery({ queryKey: ["portal-subscriptions"], path: "/subscriptions" });
  const profileQuery = useCustomerQuery({ queryKey: ["portal-profile"], path: "/profile/me" });
  const invoicesQuery = useCustomerQuery({ queryKey: ["portal-invoices"], path: "/invoices" });
  const paymentsQuery = useCustomerQuery({ queryKey: ["portal-payments"], path: "/payments/submissions" });
  const ticketsQuery = useCustomerQuery({ queryKey: ["portal-tickets"], path: "/tickets" });
  const contractQuery = useCustomerQuery({ queryKey: ["portal-contract-current"], path: "/contracts/current" });

  const subscriptions = data?.subscriptions || [];
  const profile = profileQuery.data?.user;
  const invoices = invoicesQuery.data?.invoices || [];
  const submissions = paymentsQuery.data?.submissions || [];
  const tickets = ticketsQuery.data?.tickets || [];

  const currentServices = subscriptions.filter(isActiveSubscription);
  const monthlyRecurring = getMonthlyRecurringAmount(subscriptions);
  const walletBalance = Number(profile?.accountBalance || 0);
  const openTickets = tickets.filter((item) => ["open", "pending"].includes(item.status));
  const outstandingInvoices = invoices.filter((item) => item.status !== "paid");
  const outstandingTotal = outstandingInvoices.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const upcomingRenewals = currentServices
    .filter((item) => item.renewalDate && daysUntil(item.renewalDate) != null && daysUntil(item.renewalDate) >= 0)
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
    .slice(0, 4);
  const nextRenewal = upcomingRenewals[0];

  const contractStatus = contractQuery.data?.contract?.status || contractQuery.data?.status || "NOT_STARTED";
  const contractApproved = contractStatus === "APPROVED";

  const activity = [
    ...submissions.map((item) => ({
      id: `pay-${item._id}`,
      type: "payment",
      title: item.submissionType === "wallet_topup" ? "Wallet top-up" : item.invoiceCode || "Payment",
      status: item.status,
      at: item.submittedAt,
    })),
    ...tickets.map((item) => ({
      id: `ticket-${item._id}`,
      type: "ticket",
      title: item.subject || "Support ticket",
      status: item.status,
      at: item.createdAt,
    })),
  ]
    .filter((item) => item.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6);

  const firstName = String(profile?.name || profile?.company || "").trim().split(" ")[0];
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const dashboardLoading =
    isLoading || profileQuery.isLoading || invoicesQuery.isLoading || paymentsQuery.isLoading || ticketsQuery.isLoading;
  const hasDashboardData = Boolean(
    data || profileQuery.data || invoicesQuery.data || paymentsQuery.data || ticketsQuery.data,
  );
  const showInitialLoader = dashboardLoading && !hasDashboardData;

  const topbarActions = (
    <>
      <Link href="/portal/services">
        <Button>
          <Plus className="h-4 w-4" />
          Order an app
        </Button>
      </Link>
      <Link href="/portal/payments">
        <Button variant="ghost">
          <Wallet className="h-4 w-4" />
          Top up wallet
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
        subtitle="Your services, billing, and support activity at a glance."
        actions={topbarActions}
      />
      {showInitialLoader ? (
        <PageLoader title="Loading your dashboard" subtitle="Gathering your services, payments, and support activity…" />
      ) : (
        <div className="mx-auto w-full max-w-[1680px] space-y-6 p-6 md:p-8" aria-busy={dashboardLoading}>
          {reviewMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900">
              {reviewMessage}
            </div>
          ) : null}

          {/* Welcome header */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-900">
                  {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">{todayLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  {formatCurrency(walletBalance)} wallet
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
                  <CalendarClock className="h-4 w-4 text-brand-500" />
                  {nextRenewal ? renewalLabel(nextRenewal.renewalDate) : "No upcoming renewals"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={CreditCard}
              tone="blue"
              label="Monthly recurring"
              value={formatCurrency(monthlyRecurring)}
              helper="Billed this calendar month"
            />
            <KpiCard
              icon={Server}
              tone="green"
              label="Active services"
              value={currentServices.length}
              helper={`${subscriptions.length} total subscription${subscriptions.length === 1 ? "" : "s"}`}
              href="/portal/services"
            />
            <KpiCard
              icon={Wallet}
              tone="neutral"
              label="Wallet balance"
              value={formatCurrency(walletBalance)}
              helper="Available portal credit"
              href="/portal/payments"
            />
            <KpiCard
              icon={Receipt}
              tone={outstandingTotal > 0 ? "rose" : "amber"}
              label="Outstanding"
              value={formatCurrency(outstandingTotal)}
              helper={`${outstandingInvoices.length} unpaid invoice${outstandingInvoices.length === 1 ? "" : "s"}`}
              href="/portal/invoices"
            />
          </div>

          {/* Chart + renewals */}
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Payments</CardTitle>
                    <CardDescription>Processed payments over the last 6 months</CardDescription>
                  </div>
                  <Link href="/portal/payments" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
                    View activity
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <DashboardSpendChart submissions={submissions} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming renewals</CardTitle>
                <CardDescription>Services renewing soon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingRenewals.length ? (
                  upcomingRenewals.map((item) => (
                    <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white p-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.productPlanId?.name || "Managed service"}</p>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          {renewalLabel(item.renewalDate)} · {item.billingCycle?.replaceAll("_", " ") || "monthly"}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-slate-900">
                        {formatCurrency(Number(item.metadata?.billingAmount || 0))}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-line bg-slate-50 p-5 text-sm font-medium text-slate-500">
                    No upcoming renewals scheduled.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Services + activity */}
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
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Payments and support, newest first</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {activity.length ? (
                  activity.map((item) => {
                    const Icon = item.type === "payment" ? CreditCard : LifeBuoy;
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="text-xs font-medium text-slate-400">{relativeTime(item.at)}</p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-line bg-slate-50 p-5 text-sm font-medium text-slate-500">
                    No recent activity yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status strip */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <LifeBuoy className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Support</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {openTickets.length
                        ? `${openTickets.length} open ticket${openTickets.length === 1 ? "" : "s"} in progress`
                        : "No open tickets — you're all caught up"}
                    </p>
                  </div>
                </div>
                <Link href="/portal/support" className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Open
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      contractApproved ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
                    )}
                  >
                    {contractApproved ? <CheckCircle2 className="h-5 w-5" /> : <FileSignature className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Service agreement</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {contractApproved
                        ? "Approved — your account is fully active"
                        : isContractSubmittedForPortal(contractStatus)
                          ? "Submitted — awaiting admin review"
                          : "Action needed — sign your agreement"}
                    </p>
                  </div>
                </div>
                <Link href="/portal/contracts" className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  View
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
