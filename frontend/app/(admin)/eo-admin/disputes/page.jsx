"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, FileText, ShieldAlert, XCircle } from "lucide-react";
import { resolvePublicFileUrl } from "@/lib/api/file-url";
import { useStaffQuery } from "@/lib/api/hooks";
import { formatCurrency } from "@/lib/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge } from "@/lib/ui";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function humanize(value, fallback = "Unknown") {
  const text = String(value || "").trim();
  return text ? text.replaceAll("_", " ") : fallback;
}

function isOverdue(value) {
  return value && new Date(value) < new Date();
}

function customerLabel(dispute) {
  return dispute.customer?.name || dispute.customer?.email || "Unknown customer";
}

function serviceLabel(dispute) {
  return (
    dispute.order?.productPlanId?.name ||
    dispute.subscription?.productPlanId?.name ||
    dispute.invoice?.lineItems?.[0]?.label ||
    "Managed service"
  );
}

function SummaryTile({ icon: Icon, label, value, tone = "slate" }) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone] || tones.slate}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
    </Card>
  );
}

export default function AdminDisputesPage() {
  const { data, isLoading } = useStaffQuery({ queryKey: ["admin-disputes"], path: "/admin/disputes" });
  const disputes = data?.disputes || [];
  const summary = data?.summary || {};

  if (isLoading && !data) {
    return <PageLoader title="Loading disputes" subtitle="Gathering Stripe dispute and chargeback records." />;
  }

  return (
    <div>
      <Topbar title="Disputes" subtitle="Monitor Stripe card disputes, chargebacks, affected invoices, and suspended services." />
      <div className="space-y-6 p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryTile icon={ShieldAlert} label="Total disputes" value={summary.total || 0} />
          <SummaryTile icon={AlertTriangle} label="Open cases" value={summary.open || 0} tone="amber" />
          <SummaryTile icon={Clock} label="Evidence due" value={summary.evidenceDue || 0} tone="amber" />
          <SummaryTile icon={XCircle} label="Charged back" value={summary.chargedBack || 0} tone="rose" />
          <SummaryTile icon={CheckCircle2} label="Resolved" value={summary.resolved || 0} tone="emerald" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stripe Dispute Queue</CardTitle>
            <CardDescription>Open, lost, and resolved dispute records matched to local payments and invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              dense
              columns={[
                {
                  key: "customer",
                  label: "Customer",
                  render: (row) => (
                    <div>
                      <p className="font-semibold text-slate-900">{customerLabel(row)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{row.customer?.email || "No email"}</p>
                    </div>
                  ),
                },
                {
                  key: "invoice",
                  label: "Invoice",
                  render: (row) => (
                    <div className="min-w-[160px]">
                      <p className="font-semibold text-slate-900">{row.invoice?.invoiceNumber || row.submission?.invoiceCode || "No invoice"}</p>
                      {row.invoice?.pdfUrl ? (
                        <Link className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-600" href={resolvePublicFileUrl(row.invoice.pdfUrl)} target="_blank">
                          <FileText className="h-3.5 w-3.5" />
                          PDF
                        </Link>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: "dispute",
                  label: "Dispute",
                  render: (row) => (
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-slate-900">{row.disputeId}</p>
                      <p className="mt-0.5 text-xs capitalize text-slate-500">{humanize(row.disputeReason, "No reason")}</p>
                    </div>
                  ),
                },
                {
                  key: "paymentStatus",
                  label: "Status",
                  render: (row) => (
                    <div className="space-y-1.5">
                      <StatusBadge status={row.paymentStatus} />
                      <p className="text-xs capitalize text-slate-500">{humanize(row.disputeStatus, "Open")}</p>
                    </div>
                  ),
                },
                {
                  key: "amount",
                  label: "Amount",
                  render: (row) => formatCurrency(row.disputeAmount || 0, row.disputeCurrency || "USD"),
                },
                {
                  key: "dueBy",
                  label: "Evidence",
                  render: (row) => (
                    <div>
                      <p className={isOverdue(row.dueBy) && row.paymentStatus === "disputed" ? "font-semibold text-rose-700" : "text-slate-700"}>
                        {formatDate(row.dueBy)}
                      </p>
                      {isOverdue(row.dueBy) && row.paymentStatus === "disputed" ? <p className="mt-0.5 text-xs font-semibold text-rose-600">Overdue</p> : null}
                    </div>
                  ),
                },
                {
                  key: "service",
                  label: "Service",
                  render: (row) => (
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-slate-900">{serviceLabel(row)}</p>
                      <p className="mt-0.5 text-xs capitalize text-slate-500">{humanize(row.subscription?.status || "not linked")}</p>
                    </div>
                  ),
                },
                {
                  key: "reference",
                  label: "Reference",
                  render: (row) => (
                    <div className="max-w-[240px] space-y-1 text-xs text-slate-500">
                      <p className="truncate">PI: {row.paymentIntentId || "None"}</p>
                      <p className="truncate">Charge: {row.chargeId || "None"}</p>
                    </div>
                  ),
                },
              ]}
              rows={disputes}
              emptyMessage="No Stripe disputes have been recorded."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
