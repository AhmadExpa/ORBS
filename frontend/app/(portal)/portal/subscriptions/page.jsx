"use client";

import Link from "next/link";
import { Button, StatusBadge } from "@/lib/ui";
import { PortalDataPage } from "@/components/portal/data-page";

export default function PortalSubscriptionsPage() {
  return (
    <PortalDataPage
      title="Subscriptions"
      subtitle="Track billing cycle, renewal dates, and the wallet-driven automatic deduction status for all subscriptions."
      path="/subscriptions"
      queryKey={["portal-subscriptions"]}
      dataKey="subscriptions"
      emptyTitle="No subscriptions found"
      emptyDescription="Subscriptions appear after you create an order."
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
        { key: "renewalDate", label: "Renewal", render: (row) => (row.renewalDate ? new Date(row.renewalDate).toLocaleDateString() : "Pending") },
      ]}
      children={
        <>
          <Link href="/portal/services">
            <Button>Order Another Service</Button>
          </Link>
          <Link href="/portal/payments">
            <Button variant="ghost">Top Up Wallet</Button>
          </Link>
        </>
      }
    />
  );
}
