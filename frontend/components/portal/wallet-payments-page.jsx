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
import { PortalCardForm } from "@/components/portal/portal-card-form";

function submissionTypeLabel(type) {
  if (type === "wallet_topup") {
    return "Wallet Top-up";
  }

  if (type === "renewal_charge") {
    return "Automatic Renewal";
  }

  return "Subscription Payment";
}

function savedCardLabel(user) {
  if (!user?.defaultPaymentMethodLast4) {
    return "No saved card on file.";
  }

  const brand = user.defaultPaymentMethodBrand
    ? `${user.defaultPaymentMethodBrand.charAt(0).toUpperCase()}${user.defaultPaymentMethodBrand.slice(1)}`
    : "Card";

  return `${brand} ending in ${user.defaultPaymentMethodLast4}`;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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

  const { data: profileData, refetch: refetchProfile } = profileQuery;
  const { data: paymentsData, refetch: refetchPayments } = paymentsQuery;

  const [amount, setAmount] = useState("");
  const [invoiceCode, setInvoiceCode] = useState("");
  const [proof, setProof] = useState(null);
  const [state, setState] = useState({
    saving: false,
    message: "",
    error: "",
  });

  const user = profileData?.user;
  const submissions = paymentsData?.submissions || [];
  const paymentSetting = paymentSettingQuery.data?.paymentSetting;
  const pendingTopups = submissions.filter(
    (submission) => submission.submissionType === "wallet_topup" && submission.status === "pending_verification",
  ).length;

  async function syncPortalPayments() {
    await Promise.all([refetchPayments(), refetchProfile()]);
    await wait(1200);
    await Promise.all([refetchPayments(), refetchProfile()]);
  }

  async function handleManualSubmit(event) {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, message: "", error: "" }));

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
      setState((current) => ({
        ...current,
        saving: false,
        message: response.message || paymentProcessingMessage,
        error: "",
      }));
      await Promise.all([refetchPayments(), refetchProfile()]);
    } catch (error) {
      setState((current) => ({ ...current, saving: false, message: "", error: error.message }));
    }
  }

  async function handleSaveCard({ stripe, cardElement }) {
    const token = await getToken();
    const response = await apiFetch("/stripe/intents", {
      method: "POST",
      token,
      body: { type: "card_setup" },
    });

    const result = await stripe.confirmCardSetup(response.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: user?.name || undefined,
          email: user?.email || undefined,
        },
      },
    });

    if (result.error) {
      throw new Error(result.error.message || "The card could not be saved.");
    }

    await syncPortalPayments();
    return user?.defaultPaymentMethodLast4
      ? "Your saved card has been updated."
      : "Your card is now saved for automatic renewals.";
  }

  async function handleCardTopup({ stripe, cardElement }) {
    const numericAmount = Number(amount || 0);
    if (!numericAmount || numericAmount <= 0) {
      throw new Error("Enter a valid top-up amount before submitting the card payment.");
    }

    const token = await getToken();
    const response = await apiFetch("/stripe/intents", {
      method: "POST",
      token,
      body: {
        type: "wallet_topup",
        amount: numericAmount,
      },
    });

    const result = await stripe.confirmCardPayment(response.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: user?.name || undefined,
          email: user?.email || undefined,
        },
      },
    });

    if (result.error) {
      throw new Error(result.error.message || "The wallet top-up could not be completed.");
    }

    await syncPortalPayments();
    setAmount("");
    return "Your wallet payment was received. The balance has been refreshed.";
  }

  return (
    <div>
      <Topbar title="Wallet & Payments" subtitle="Use manual payments or direct card entry, save a card for renewals, and let subscriptions use wallet balance first with saved-card fallback second." />
      <div className="space-y-6 p-6">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Balance</CardTitle>
              <CardDescription>Manual and instant card top-ups both land here. Renewals use wallet balance first and then your saved card for any remaining amount.</CardDescription>
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
                  <p className="mt-2 text-sm font-semibold text-slate-950">Wallet first, saved-card fallback</p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Saved Card</p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">{savedCardLabel(user)}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Save a card once and the renewal engine can charge any missing amount automatically whenever the wallet does not fully cover the subscription.
                    </p>
                  </div>
                  <PortalCardForm
                    submitLabel={user?.defaultPaymentMethodLast4 ? "Update Saved Card" : "Save Card for Auto Renewals"}
                    pendingLabel={user?.defaultPaymentMethodLast4 ? "Updating card..." : "Saving card..."}
                    onSubmit={handleSaveCard}
                    note="The saved card stays available for future renewals whenever your wallet balance is short."
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Instant Card Top-up</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Top-up Amount</label>
                    <TextInput type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="100" />
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                    <p className="text-sm text-slate-500">Processing</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">Funds are posted to the wallet automatically after card payment confirmation.</p>
                  </div>
                </div>
                <div className="mt-4">
                  <PortalCardForm
                    submitLabel="Top Up Wallet Now"
                    pendingLabel="Processing payment..."
                    onSubmit={handleCardTopup}
                    note="Use the amount above, then enter your card details to fund the wallet immediately."
                  />
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

              <form onSubmit={handleManualSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
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
              <CardDescription>Wallet balance is always checked first for active subscription renewals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-600">
              <p>1. Top up manually with QR or payment link if you want admin-reviewed balance funding.</p>
              <p>2. Or use direct card entry for an instant wallet top-up with no manual review delay.</p>
              <p>3. Save a card once if you want automatic renewal fallback billing.</p>
              <p>4. On renewal dates, the system uses wallet balance first and then charges the saved card for any remaining amount.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Activity</CardTitle>
            <CardDescription>Track manual payments, card charges, wallet top-ups, and automatic renewals in one place.</CardDescription>
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
