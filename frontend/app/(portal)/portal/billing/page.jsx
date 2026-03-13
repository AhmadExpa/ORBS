"use client";

import { formatCurrency } from "@/lib/shared";
import { PortalDataPage } from "@/components/portal/data-page";

export default function PortalBillingPage() {
  return (
    <PortalDataPage
      title="Billing"
      subtitle="Review invoice states and billing totals tied to your services."
      path="/invoices"
      queryKey={["portal-billing"]}
      dataKey="invoices"
      emptyTitle="No billing records yet"
      emptyDescription="Invoices appear after you create an order."
      columns={[
        { key: "invoiceNumber", label: "Invoice" },
        { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
        { key: "status", label: "Status" },
        { key: "issuedAt", label: "Issued", render: (row) => new Date(row.issuedAt).toLocaleDateString() },
      ]}
    />
  );
}
