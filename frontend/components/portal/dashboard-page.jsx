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
import { formatCurrency, getBillingCycleLabel, getMonthlyRecurringAmount, isActiveSubscription } from "@/lib/shared";
import { useActionToast } from "@/components/shared/feedback-layer";
import { Topbar } from "@/components/shared/topbar";
import { PageLoader } from "@/components/shared/page-loader";
import { DashboardSpendChart } from "@/components/portal/dashboard-spend-chart";
import { isContractSubmittedForPortal } from "@/components/portal/contract-gate";
import { PortalActivityPanel } from "@/components/portal/activity-panel";
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
    neutral: { icon: "text-slate-500", bg: "bg-slate-50 border-slate-100" },
    blue: { icon: "text-sky-600", bg: "bg-sky-50 border-sky-100" },
    green: { icon: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    amber: { icon: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    rose: { icon: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
  };
  const toneStyle = tones[tone] || tones.neutral;

  const body = (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
      href && "cursor-pointer"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 tabular-nums">{value}</p>
        </div>
        <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl border transition-colors", toneStyle.bg)}>
          <Icon className={cn("h-6 w-6", toneStyle.icon)} />
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-400">{helper || "\u00A0"}</p>
        {href ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-slate-900 group-hover:text-white">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
    </div>
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
  const activityQuery = useCustomerQuery({ queryKey: ["portal-activity"], path: "/profile/activity" });

  const subscriptions = data?.subscriptions || [];
  const profile = profileQuery.data?.user;
  const invoices = invoicesQuery.data?.invoices || [];
  const submissions = paymentsQuery.data?.submissions || [];
  const tickets = ticketsQuery.data?.tickets || [];
  const remoteActivity = activityQuery.data?.activities || [];

  const currentServices = subscriptions.filter(isActiveSubscription);
  const monthlyRecurring = getMonthlyRecurringAmount(subscriptions);
  const walletBalance = Number(profile?.accountBalance || 0);
  const openTickets = tickets.filter((item) => ["open", "pending"].includes(item.status));
  const outstandingInvoices = invoices.filter((item) => ["pending", "rejected"].includes(item.status));
  const outstandingTotal = outstandingInvoices.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const upcomingRenewals = currentServices
    .filter((item) => item.renewalDate && daysUntil(item.renewalDate) != null && daysUntil(item.renewalDate) >= 0)
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
    .slice(0, 4);
  const nextRenewal = upcomingRenewals[0];

  const contractStatus = contractQuery.data?.contract?.status || contractQuery.data?.status || "NOT_STARTED";
  const contractApproved = contractStatus === "APPROVED";

  const fallbackActivity = [
    ...submissions.map((item) => ({
      id: `pay-${item._id}`,
      type: "payment",
      title: item.submissionType === "wallet_topup" ? "Wallet top-up" : item.invoiceCode || "Payment",
      description: item.status?.replaceAll("_", " ") || "Payment update",
      status: item.status,
      at: item.submittedAt,
      href: "/portal/payments",
    })),
    ...tickets.map((item) => ({
      id: `ticket-${item._id}`,
      type: "ticket",
      title: item.subject || "Support ticket",
      description: "Support ticket",
      status: item.status,
      at: item.createdAt,
      href: `/portal/support/${item._id}`,
    })),
  ]
    .filter((item) => item.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6);
  const activity = remoteActivity.length ? remoteActivity : fallbackActivity;

  const firstName = String(profile?.name || profile?.company || "").trim().split(" ")[0];
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const dashboardLoading =
    isLoading ||
    profileQuery.isLoading ||
    invoicesQuery.isLoading ||
    paymentsQuery.isLoading ||
    ticketsQuery.isLoading ||
    activityQuery.isLoading;
  const hasDashboardData = Boolean(
    data || profileQuery.data || invoicesQuery.data || paymentsQuery.data || ticketsQuery.data || activityQuery.data,
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
        title="Operations Dashboard"
        subtitle="Monitor services, billing, agreements, and support from one workspace."
        actions={topbarActions}
      />
      {showInitialLoader ? (
        <PageLoader title="Loading your dashboard" subtitle="Gathering your services, payments, and support activity…" />
      ) : (
        <div className="mx-auto w-full max-w-[1680px] space-y-8 p-6 md:p-8" aria-busy={dashboardLoading}>
          {reviewMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900">
              {reviewMessage}
            </div>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0b0f19] text-white shadow-lg">
            <div className="grid min-w-0 lg:grid-cols-[1.4fr_0.6fr]">
              {/* Left Side: Welcome + Main Actions */}
              <div className="relative overflow-hidden p-6 md:p-8">
                {/* Decorative background glow */}
                <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />
                <div className="pointer-events-none absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-sky-500/10 blur-[60px]" />
                
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Workspace Live
                  </span>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{todayLabel}</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl text-white">
                    {firstName ? `${firstName}, your managed workspace is ready.` : "Your managed workspace is ready."}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                    Review operational health, renewal exposure, payment coverage, and open support work without leaving the portal.
                  </p>
                  
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/portal/services">
                      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100 active:scale-95 shadow-sm">
                        <Plus className="h-4 w-4" />
                        Order an app
                      </button>
                    </Link>
                    <Link href="/portal/support">
                      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95">
                        <LifeBuoy className="h-4 w-4 text-slate-400" />
                        Open support
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Side: Quick Stats (Wallet + Next Renewal) */}
              <div className="flex flex-col justify-stretch border-t border-white/[0.08] lg:border-l lg:border-t-0 bg-white/[0.02]">
                {/* Wallet Coverage */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center border-b border-white/[0.08]">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Wallet className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Wallet coverage</p>
                      <p className="mt-1 text-2xl font-black text-white">{formatCurrency(walletBalance)}</p>
                    </div>
                  </div>
                </div>

                {/* Next Renewal */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                      <CalendarClock className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Next renewal</p>
                      <p className="mt-1 text-lg font-bold text-white">
                        {nextRenewal ? renewalLabel(nextRenewal.renewalDate) : "No upcoming renewals"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

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
                          {renewalLabel(item.renewalDate)} · {getBillingCycleLabel(item.billingCycle)}
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
                    { key: "billingCycle", label: "Cycle", render: (row) => getBillingCycleLabel(row.billingCycle) },
                    { key: "renewalDate", label: "Renews", render: (row) => formatDate(row.renewalDate) },
                    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  ]}
                  rows={currentServices.slice(0, 5)}
                  emptyMessage="You don't have any active services yet — order one to get started."
                />
              </CardContent>
            </Card>

            <PortalActivityPanel
              activities={activity}
              loading={activityQuery.isLoading}
              title="Activity control"
              description="Filter recent payments, support, service, and access events."
              maxItems={6}
              compact
            />
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
