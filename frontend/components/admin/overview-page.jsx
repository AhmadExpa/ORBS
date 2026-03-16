"use client";

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
    return <PageLoader title="Admin Dashboard" subtitle="Loading analytics, payments, and ticket activity..." cardCount={3} lines={4} />;
  }

  return (
    <div>
      <Topbar title="Admin Dashboard" subtitle="Monitor subscriptions, revenue, payments, tickets, and customer growth." />
      <div className="space-y-6 p-6">
        <MetricGrid
          items={[
            { label: "Total Users", value: data?.totalUsers || 0 },
            { label: "Total Subscriptions", value: data?.totalSubscriptions || 0 },
            { label: "MRR", value: formatCurrency(data?.monthlyRecurringRevenue || 0) },
            { label: "YRR", value: formatCurrency(data?.yearlyRecurringRevenue || 0) },
          ]}
        />
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payment Submissions</CardTitle>
              <CardDescription>Pending verification queue and latest review activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: "invoiceCode", label: "Reference" },
                  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  { key: "submittedAt", label: "Submitted", render: (row) => new Date(row.submittedAt).toLocaleDateString() },
                ]}
                rows={recentPayments}
                emptyMessage="No payment submissions yet."
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest open and pending ticket activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: "subject", label: "Subject" },
                  { key: "priority", label: "Priority" },
                  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                ]}
                rows={recentTickets}
                emptyMessage="No active tickets."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
