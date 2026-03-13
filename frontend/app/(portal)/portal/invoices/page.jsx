"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/shared";
import { PortalDataPage } from "@/components/portal/data-page";

export default function PortalInvoicesPage() {
  return (
    <PortalDataPage
      title="Invoices"
      subtitle="Open and download server-generated invoice PDFs."
      path="/invoices"
      queryKey={["portal-invoices-page"]}
      dataKey="invoices"
      emptyTitle="No invoices yet"
      emptyDescription="Invoice PDFs are generated when orders are created and updated after review."
      columns={[
        { key: "invoiceNumber", label: "Invoice" },
        { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
        { key: "status", label: "Status" },
        {
          key: "pdfUrl",
          label: "PDF",
          render: (row) => (row.pdfUrl ? <Link className="font-semibold text-sky-700" href={row.pdfUrl} target="_blank">Download</Link> : "Pending"),
        },
      ]}
    />
  );
}
