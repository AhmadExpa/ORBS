"use client";

import { StatusBadge } from "@/lib/ui";
import { AdminResourcePage } from "@/components/admin/resource-page";

export default function AdminSubscriptionsPage() {
  return (
    <AdminResourcePage
      title="Subscriptions"
      subtitle="Inspect lifecycle state, customer ownership, and billing cycle."
      path="/admin/subscriptions"
      queryKey={["admin-subscriptions"]}
      sections={(data) => [
        {
          title: "All Subscriptions",
          description: "Customer subscriptions and their current activation state.",
          columns: [
            { key: "customer", label: "Customer", render: (row) => row.userId?.name || "Unknown" },
            { key: "plan", label: "Plan", render: (row) => row.productPlanId?.name || "Managed Service" },
            { key: "billingCycle", label: "Cycle" },
            { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
          ],
          rows: data?.subscriptions || [],
        },
      ]}
    />
  );
}
