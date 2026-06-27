"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { siteConfig } from "@/lib/constants/site";
import { formatCurrency } from "@/lib/shared";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge } from "@/lib/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";
import { ContractApprovalLock, isContractApprovedForPayments } from "@/components/portal/contract-approval-lock";

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
  const router = useRouter();
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
  const contractQuery = useCustomerQuery({
    queryKey: ["portal-invoices-contract"],
    path: "/contracts/current",
  });

  const invoices = invoicesQuery.data?.invoices || [];
  const user = profileQuery.data?.user;
  const contractStatus = contractQuery.data?.contract?.status || contractQuery.data?.status || "NOT_STARTED";
  const contractApproved = isContractApprovedForPayments(contractStatus);
  const walletBalance = Number(user?.accountBalance || 0);
  const outstandingInvoices = invoices.filter((invoice) => isWalletPayable(invoice));
  const outstandingTotal = outstandingInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const walletPayableCount = contractApproved ? outstandingInvoices.filter((invoice) => walletBalance >= Number(invoice.amount || 0)).length : 0;

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
      if (error.redirectUrl) {
        router.push(error.redirectUrl);
      }
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

      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Wallet balance</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{formatCurrency(walletBalance)}</p>
            <p className="mt-2 text-sm text-slate-500">Available immediately for any unpaid invoice it fully covers.</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Outstanding total</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{formatCurrency(outstandingTotal)}</p>
            <p className="mt-2 text-sm text-slate-500">Pending and rejected invoices that still need payment.</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Payable from wallet now</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{walletPayableCount}</p>
            <p className="mt-2 text-sm text-slate-500">Invoices your current balance can settle in one click.</p>
          </Card>
        </div>

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
              {!contractApproved ? (
                <div className="mb-4">
                  <ContractApprovalLock description="Invoices can be reviewed and downloaded now, but wallet payment unlocks only after an ElevenOrbits administrator approves your signed agreement." />
                </div>
              ) : null}
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
                      const canPayFromWallet = contractApproved && isWalletPayable(row) && walletBalance >= rowAmount;
                      const isPaying = payingInvoiceId === row._id;
                      const isDownloading = downloadingInvoiceId === row._id;

                      let walletLabel = "Unavailable";
                      if (isPaying) {
                        walletLabel = "Paying...";
                      } else if (!contractApproved && isWalletPayable(row)) {
                        walletLabel = "Approval required";
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
