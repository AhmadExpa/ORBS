"use client";

import Link from "next/link";
import { Button, StatusBadge } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { AdminResourcePage } from "@/components/admin/resource-page";
import { apiFetch } from "@/lib/api/client";

export default function AdminInvoicesPage() {
  return (
    <AdminResourcePage
      title="Invoices"
      subtitle="Review invoice records and regenerate PDFs when needed."
      path="/admin/invoices"
      queryKey={["admin-invoices"]}
      sections={(data, refetch) => [
        {
          title: "All Invoices",
          description: "Generated invoice PDFs and current payment state.",
          columns: [
            { key: "invoiceNumber", label: "Invoice" },
            { key: "customer", label: "Customer", render: (row) => row.userId?.name || "Unknown" },
            { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
            { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex items-center gap-3">
                  {row.pdfUrl ? (
                    <Link className="font-semibold text-sky-700" href={row.pdfUrl} target="_blank">
                      Download
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="text-sm font-semibold text-sky-700"
                    onClick={async () => {
                      await apiFetch(`/admin/invoices/${row._id}/regenerate`, { method: "POST" });
                      await refetch();
                    }}
                  >
                    Regenerate
                  </button>
                </div>
              ),
            },
          ],
          rows: data?.invoices || [],
        },
      ]}
    />
  );
}
