"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { paymentProcessingMessage } from "@/lib/constants/site";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge, TextInput } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";

function submissionTypeLabel(type) {
  return type === "wallet_topup" ? "Wallet Top-up" : "Subscription Payment";
}

export function WalletPaymentsPage() {
  const { getToken } = useAuth();
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-profile-balance"],
    path: "/profile/me",
  });
  const paymentsQuery = useCustomerQuery({
    queryKey: ["portal-wallet-payments"],
    path: "/payments/submissions",
  });
  const paymentSettingQuery = useQuery({
    queryKey: ["active-payment-setting"],
    queryFn: () => apiFetch("/payments/settings/active"),
  });

  const [amount, setAmount] = useState("");
  const [invoiceCode, setInvoiceCode] = useState("");
  const [proof, setProof] = useState(null);
  const [state, setState] = useState({ saving: false, message: "", error: "" });

  const user = profileQuery.data?.user;
  const submissions = paymentsQuery.data?.submissions || [];
  const paymentSetting = paymentSettingQuery.data?.paymentSetting;
  const pendingTopups = submissions.filter(
    (submission) => submission.submissionType === "wallet_topup" && submission.status === "pending_verification",
  ).length;

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ saving: true, message: "", error: "" });

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("submissionType", "wallet_topup");
      formData.append("amount", amount);
      formData.append("invoiceCode", invoiceCode);
      formData.append("paymentMethodType", paymentSetting?.paymentLink ? "manual_link" : "manual_qr");
      if (proof) {
        formData.append("proof", proof);
      }

      const response = await apiFetch("/payments/submissions", {
        method: "POST",
        token,
        body: formData,
        isMultipart: true,
      });

      setAmount("");
      setInvoiceCode("");
      setProof(null);
      setState({ saving: false, message: response.message || paymentProcessingMessage, error: "" });
      await Promise.all([paymentsQuery.refetch(), profileQuery.refetch()]);
    } catch (error) {
      setState({ saving: false, message: "", error: error.message });
    }
  }

  return (
    <div>
      <Topbar title="Wallet & Payments" subtitle="Top up your balance, submit proof for review, and let subscriptions deduct automatically on renewal dates." />
      <div className="space-y-6 p-6">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Balance</CardTitle>
              <CardDescription>Approved top-ups are added here. Active subscriptions deduct from this balance automatically on renewal dates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Available Balance</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(user?.accountBalance || 0)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Pending Top-ups</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{pendingTopups}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Renewal Billing</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">Automatic wallet deduction</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Manual Top-up Payment</p>
                <div className="mt-4 grid gap-6 md:grid-cols-[220px_1fr]">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                    {paymentSetting?.qrCodeImageUrl ? (
                      <Image
                        alt="Payment QR code"
                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:4000"}${paymentSetting.qrCodeImageUrl}`}
                        width={220}
                        height={220}
                        className="h-auto w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
                        QR code will appear here
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm leading-7 text-slate-600">
                      {paymentSetting?.instructions || "Scan the QR code, pay the top-up amount, and submit your transaction reference for admin approval."}
                    </p>
                    {paymentSetting?.paymentLink ? (
                      <Link href={paymentSetting.paymentLink} target="_blank">
                        <Button variant="ghost">Unable to scan? Pay using payment link</Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Top-up Amount</label>
                    <TextInput type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="100" required />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Transaction ID / Reference</label>
                    <TextInput value={invoiceCode} onChange={(event) => setInvoiceCode(event.target.value)} placeholder="Enter transfer reference" required />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Payment Proof Screenshot (optional)</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setProof(event.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  />
                </div>
                {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
                {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
                <Button className="w-full" type="submit" disabled={state.saving}>
                  {state.saving ? "Submitting top-up..." : "Submit Top-up for Approval"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Wallet balance is used first on renewal dates for active subscriptions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-600">
              <p>1. Pay the exact top-up amount using the QR code or payment link.</p>
              <p>2. Submit the amount, transaction ID, and an optional proof screenshot from this page.</p>
              <p>3. After admin approval, the amount is added to your wallet balance.</p>
              <p>4. On subscription renewal dates, the system deducts the required amount from your wallet automatically.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Activity</CardTitle>
            <CardDescription>Track subscription payments and wallet top-up requests in one place.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "submissionType", label: "Type", render: (row) => submissionTypeLabel(row.submissionType) },
                { key: "invoiceCode", label: "Reference" },
                { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount || row.orderId?.totalAmount || 0) },
                { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                { key: "submittedAt", label: "Submitted", render: (row) => new Date(row.submittedAt).toLocaleDateString() },
              ]}
              rows={submissions}
              emptyMessage={paymentsQuery.isLoading ? "Loading activity..." : "No payment activity yet."}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
