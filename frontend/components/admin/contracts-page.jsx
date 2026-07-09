"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge } from "@/lib/ui";
import { useStaffQuery } from "@/lib/api/hooks";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";

const filters = [
  { label: "All", value: "" },
  { label: "Pending signature", value: "PENDING_SIGNATURE" },
  { label: "Pending review", value: "SIGNED_PENDING_ADMIN" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Expired", value: "EXPIRED" },
];

function formatDate(value) {
  if (!value) {
    return "Not available";
  }
  return new Date(value).toLocaleString();
}

export function AdminContractsPage() {
  const [status, setStatus] = useState("");
  const contractsQuery = useStaffQuery({
    queryKey: ["admin-contracts", status],
    path: `/admin/contracts${status ? `?status=${encodeURIComponent(status)}` : ""}`,
  });

  const contracts = contractsQuery.data?.contracts || [];

  if (contractsQuery.isLoading && !contractsQuery.data) {
    return <PageLoader title="Contracts" subtitle="Loading contract review queue..." cardCount={2} lines={4} />;
  }

  return (
    <div>
      <Topbar title="Contracts" subtitle="Review signed managed service agreements before customers can purchase or activate services." />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Contract Queue</CardTitle>
              <CardDescription>Filter by signing and administrative review state.</CardDescription>
            </div>
            <Button type="button" variant="ghost" onClick={() => contractsQuery.refetch()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    status === filter.value ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                  onClick={() => setStatus(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <DataTable
              columns={[
                {
                  key: "contractNumber",
                  label: "Contract",
                  render: (row) => (
                    <Link className="font-semibold text-brand-700 hover:text-brand-600" href={`/eo-admin/contracts/${row._id}`}>
                      {row.contractNumber}
                    </Link>
                  ),
                },
                { key: "customerName", label: "Customer" },
                { key: "customerEmail", label: "Email" },
                { key: "customerType", label: "Type", render: (row) => (row.customerType === "BUSINESS" ? "Business" : "Individual") },
                { key: "businessName", label: "Business", render: (row) => row.businessName || "Not provided" },
                { key: "templateVersion", label: "Version", render: (row) => `v${row.templateVersion}` },
                { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                { key: "signedAt", label: "Signed", render: (row) => formatDate(row.signedAt) },
                { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <Link href={`/eo-admin/contracts/${row._id}`}>
                      <Button asChild variant="ghost">
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Button>
                    </Link>
                  ),
                },
              ]}
              rows={contracts}
              emptyMessage={contractsQuery.isLoading ? "Loading contracts..." : "No contracts found."}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
