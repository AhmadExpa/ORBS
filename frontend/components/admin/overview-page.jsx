"use client";

import { BadgeDollarSign, Package, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";

export function AdminOverviewPage() {
  const { data, isLoading } = useStaffQuery({
    queryKey: ["admin-overview"],
    path: "/admin/analytics/summary",
  });

  const recentPayments = data?.recentPayments || [];
  const recentTickets = data?.recentTickets || [];

  if (isLoading && !data) {
    return <PageLoader title="Loading overview" subtitle="Gathering analytics, billing activity, and tickets…" />;
  }

  return (
    <div>
      <Topbar title="Overview" subtitle="Customers, subscriptions, recurring revenue, and the latest billing and support activity." />
      <div className="space-y-6 p-6">
        <MetricGrid
          items={[
            { label: "Total customers", value: data?.totalUsers || 0, helper: "Registered accounts", icon: Users, tone: "blue" },
            { label: "Subscriptions", value: data?.totalSubscriptions || 0, helper: "Across all customers", icon: Package, tone: "green" },
            { label: "Monthly recurring revenue", value: formatCurrency(data?.monthlyRecurringRevenue || 0), helper: "MRR from active plans", icon: BadgeDollarSign, tone: "amber" },
            { label: "Yearly recurring revenue", value: formatCurrency(data?.yearlyRecurringRevenue || 0), helper: "Annualized run rate", icon: TrendingUp, tone: "neutral" },
          ]}
        />
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent payment activity</CardTitle>
              <CardDescription>Latest card payments, wallet top-ups, and renewal charges.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
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
              <CardTitle>Recent tickets</CardTitle>
              <CardDescription>Latest open and pending support activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
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
