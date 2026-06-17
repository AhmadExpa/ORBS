"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { siteConfig } from "@/lib/constants/site";
import { formatCurrency } from "@/lib/shared";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge } from "@/lib/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";

function isWalletPayable(invoice) {
  return ["pending", "rejected"].includes(invoice?.status);
}

export function InvoicesPage({
  title = "Invoices",
  subtitle = "Open and download server-generated invoice PDFs.",
  emptyTitle = "No invoices yet",
  emptyDescription = "Invoice PDFs are generated when orders are created and updated after review.",
}) {
  const { getToken } = useAuth();
  const { showToast } = useActionToast();
  const [payingInvoiceId, setPayingInvoiceId] = useState("");
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState("");
  const [regeneratingInvoices, setRegeneratingInvoices] = useState(false);

  const invoicesQuery = useCustomerQuery({
    queryKey: ["portal-invoices-page"],
    path: "/invoices",
  });
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-invoices-profile"],
    path: "/profile/me",
  });

  const invoices = invoicesQuery.data?.invoices || [];
  const user = profileQuery.data?.user;
  const walletBalance = Number(user?.accountBalance || 0);
  const outstandingInvoices = invoices.filter((invoice) => isWalletPayable(invoice));
  const outstandingTotal = outstandingInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const walletPayableCount = outstandingInvoices.filter((invoice) => walletBalance >= Number(invoice.amount || 0)).length;

  async function handleWalletPayment(invoice) {
    if (!invoice?._id || payingInvoiceId) {
      return;
    }

    setPayingInvoiceId(invoice._id);

    try {
      const token = await getToken();
      const response = await apiFetch(`/invoices/${invoice._id}/pay-with-wallet`, {
        method: "POST",
        token,
        authMode: "customer",
      });

      await Promise.all([invoicesQuery.refetch(), profileQuery.refetch()]);
      showToast({
        type: "success",
        action: "Invoice",
        title: "Invoice paid",
        description: response.message || "The invoice has been paid from your wallet balance.",
      });
    } catch (error) {
      showToast({
        type: "error",
        action: "Invoice",
        title: "Wallet payment failed",
        description: error.message || "The invoice could not be paid from wallet balance.",
      });
    } finally {
      setPayingInvoiceId("");
    }
  }

  async function handleInvoiceDownload(invoice) {
    if (!invoice?._id || downloadingInvoiceId) {
      return;
    }

    setDownloadingInvoiceId(invoice._id);

    try {
      const token = await getToken();
      const response = await fetch(`${siteConfig.apiUrl}/invoices/${invoice._id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || "Invoice download failed.");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      showToast({
        type: "error",
        action: "Invoice",
        title: "Download failed",
        description: error.message || "The invoice could not be downloaded.",
      });
    } finally {
      setDownloadingInvoiceId("");
    }
  }

  async function handleRegenerateInvoices() {
    if (regeneratingInvoices) {
      return;
    }

    setRegeneratingInvoices(true);

    try {
      const token = await getToken();
      const response = await apiFetch("/invoices/regenerate", {
        method: "POST",
        token,
        authMode: "customer",
      });

      await invoicesQuery.refetch();
      showToast({
        type: "success",
        action: "Invoice",
        title: "Invoices regenerated",
        description: `${response.regenerated || 0} invoice PDF${response.regenerated === 1 ? "" : "s"} refreshed from your billing records.`,
      });
    } catch (error) {
      showToast({
        type: "error",
        action: "Invoice",
        title: "Regeneration failed",
        description: error.message || "Invoices could not be regenerated right now.",
      });
    } finally {
      setRegeneratingInvoices(false);
    }
  }

  if ((invoicesQuery.isLoading || profileQuery.isLoading) && !invoicesQuery.data && !profileQuery.data) {
    return <PageLoader title={title} subtitle={subtitle} cardCount={3} lines={4} />;
  }

  return (
    <div>
      <Topbar title={title} subtitle={subtitle} />

      <div className="space-y-6 p-6">
        <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_24px_70px_-58px_rgba(15,23,42,0.2)]">
          <CardContent className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Wallet Balance</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{formatCurrency(walletBalance)}</p>
              <p className="mt-2 text-sm text-slate-500">Available immediately for any unpaid invoice that is fully covered.</p>
            </div>
            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Outstanding Total</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{formatCurrency(outstandingTotal)}</p>
              <p className="mt-2 text-sm text-slate-500">Includes pending and rejected invoices that still need payment.</p>
            </div>
            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Wallet Payable Now</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{walletPayableCount}</p>
              <p className="mt-2 text-sm text-slate-500">Invoices that can be settled immediately from your current top-up balance.</p>
            </div>
          </CardContent>
        </Card>

        {invoices.length ? (
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Wallet payments post immediately when the available balance fully covers the invoice amount.</CardDescription>
              </div>
              <Button type="button" variant="secondary" disabled={regeneratingInvoices} onClick={handleRegenerateInvoices}>
                {regeneratingInvoices ? "Refreshing PDFs..." : "Regenerate PDFs"}
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: "invoiceNumber", label: "Invoice" },
                  { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
                  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  { key: "issuedAt", label: "Issued", render: (row) => new Date(row.issuedAt).toLocaleDateString() },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (row) => {
                      const rowAmount = Number(row.amount || 0);
                      const shortfall = Math.max(rowAmount - walletBalance, 0);
                      const canPayFromWallet = isWalletPayable(row) && walletBalance >= rowAmount;
                      const isPaying = payingInvoiceId === row._id;
                      const isDownloading = downloadingInvoiceId === row._id;

                      let walletLabel = "Unavailable";
                      if (isPaying) {
                        walletLabel = "Paying...";
                      } else if (canPayFromWallet) {
                        walletLabel = "Pay from Wallet";
                      } else if (isWalletPayable(row)) {
                        walletLabel = `Need ${formatCurrency(shortfall)}`;
                      }

                      return (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button type="button" variant="secondary" disabled={Boolean(downloadingInvoiceId)} onClick={() => handleInvoiceDownload(row)}>
                            {isDownloading ? "Downloading..." : "Download"}
                          </Button>
                          {isWalletPayable(row) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={!canPayFromWallet || Boolean(payingInvoiceId)}
                              onClick={() => handleWalletPayment(row)}
                            >
                              {walletLabel}
                            </Button>
                          ) : null}
                        </div>
                      );
                    },
                  },
                ]}
                rows={invoices}
                emptyMessage="No invoices found."
              />
            </CardContent>
          </Card>
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    </div>
  );
}
