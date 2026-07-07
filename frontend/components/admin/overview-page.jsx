"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, BadgeDollarSign, FileSignature, Package, Receipt, TicketCheck, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";

function AttentionCard({ icon: Icon, label, value, hint, href, tone }) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    brand: "bg-brand-50 text-brand-600",
  };
  return (
    <Link href={href} className="block">
      <Card className="group h-full p-5 transition-shadow hover:shadow-card-hover">
        <div className="flex items-start justify-between gap-3">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
            <Icon className="h-4 w-4" />
          </span>
          <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
        </div>
        <p className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-slate-900 tabular-nums">{value}</p>
        <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-slate-400">{hint}</p> : null}
      </Card>
    </Link>
  );
}

export function AdminOverviewPage() {
  const { data, isLoading } = useStaffQuery({ queryKey: ["admin-overview"], path: "/admin/analytics/summary" });

  const recentPayments = data?.recentPayments || [];
  const recentTickets = data?.recentTickets || [];
  const attention = data?.attention || {};

  if (isLoading && !data) {
    return <PageLoader title="Loading overview" subtitle="Gathering analytics, billing, and support activity…" />;
  }

  return (
    <div>
      <Topbar title="Overview" subtitle="Customers, recurring revenue, and everything that needs your attention today." />
      <div className="space-y-8 p-6 md:p-8">
        {/* Needs attention */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Needs attention</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AttentionCard
              icon={FileSignature}
              tone="amber"
              label="Contracts awaiting review"
              value={attention.pendingContracts || 0}
              hint="Signed agreements pending approval"
              href="/eo-admin/contracts"
            />
            <AttentionCard
              icon={TicketCheck}
              tone="brand"
              label="Open support tickets"
              value={attention.openTickets || 0}
              hint="Open or waiting on the team"
              href="/eo-admin/tickets"
            />
            <AttentionCard
              icon={AlertTriangle}
              tone="rose"
              label="Disputed payments"
              value={attention.disputedPayments || 0}
              hint="Card disputes and chargebacks"
              href="/eo-admin/disputes"
            />
            <AttentionCard
              icon={Receipt}
              tone="rose"
              label="Unpaid invoices"
              value={attention.unpaidInvoices || 0}
              hint={`${formatCurrency(attention.unpaidInvoiceTotal || 0)} outstanding`}
              href="/eo-admin/invoices"
            />
          </div>
        </section>

        {/* KPIs */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Business at a glance</h2>
          <MetricGrid
            items={[
              { label: "Total customers", value: data?.totalUsers || 0, helper: "Registered accounts", icon: Users, tone: "blue" },
              {
                label: "Active subscriptions",
                value: data?.activeSubscriptions || 0,
                helper: `${data?.totalSubscriptions || 0} total`,
                icon: Package,
                tone: "green",
              },
              {
                label: "Monthly recurring revenue",
                value: formatCurrency(data?.monthlyRecurringRevenue || 0),
                helper: "MRR from active plans",
                icon: BadgeDollarSign,
                tone: "amber",
              },
              {
                label: "Yearly recurring revenue",
                value: formatCurrency(data?.yearlyRecurringRevenue || 0),
                helper: "Annualized run rate",
                icon: TrendingUp,
                tone: "neutral",
              },
            ]}
          />
        </section>

        {/* Recent activity */}
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Recent payment activity</CardTitle>
                  <CardDescription>Latest card payments, wallet top-ups, and renewal charges.</CardDescription>
                </div>
                <Link href="/eo-admin/invoices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Invoices
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                dense
                columns={[
                  { key: "invoiceCode", label: "Reference" },
                  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  { key: "submittedAt", label: "Submitted", render: (row) => new Date(row.submittedAt).toLocaleDateString() },
                ]}
                rows={recentPayments}
                emptyMessage="No payment activity yet."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Recent tickets</CardTitle>
                  <CardDescription>Latest open and pending support activity.</CardDescription>
                </div>
                <Link href="/eo-admin/tickets" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Tickets
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                dense
                columns={[
                  { key: "subject", label: "Subject" },
                  { key: "priority", label: "Priority", render: (row) => <span className="capitalize">{row.priority || "medium"}</span> },
                  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                ]}
                rows={recentTickets}
                emptyMessage="No active tickets — the queue is clear."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
