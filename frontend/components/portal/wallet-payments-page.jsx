"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { paymentProcessingMessage } from "@/lib/constants/site";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge, TextInput } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";

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
    return "No saved Stripe card on file.";
  }

  const brand = user.defaultPaymentMethodBrand
    ? `${user.defaultPaymentMethodBrand.charAt(0).toUpperCase()}${user.defaultPaymentMethodBrand.slice(1)}`
    : "Card";

  return `${brand} ending in ${user.defaultPaymentMethodLast4}`;
}

function stripeResultMessage(type, status) {
  if (status === "cancel") {
    if (type === "card_setup") {
      return "Stripe card setup was cancelled.";
    }

    if (type === "wallet_topup") {
      return "Stripe wallet top-up was cancelled.";
    }

    return "Stripe checkout was cancelled.";
  }

  if (type === "card_setup") {
    return "Your card is now saved for wallet fallback renewals.";
  }

  if (type === "wallet_topup") {
    return "Stripe wallet top-up completed successfully.";
  }

  return "Stripe payment completed successfully.";
}

export function WalletPaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    stripeAction: "",
    message: "",
    error: "",
  });

  const user = profileData?.user;
  const submissions = paymentsData?.submissions || [];
  const paymentSetting = paymentSettingQuery.data?.paymentSetting;
  const pendingTopups = submissions.filter(
    (submission) => submission.submissionType === "wallet_topup" && submission.status === "pending_verification",
  ).length;

  useEffect(() => {
    const stripeStatus = searchParams.get("stripe");
    const stripeType = searchParams.get("type");

    if (!stripeStatus || !stripeType) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("stripe");
    nextParams.delete("type");

    if (stripeStatus === "success") {
      setState((current) => ({
        ...current,
        message: stripeResultMessage(stripeType, stripeStatus),
        error: "",
      }));
      void Promise.all([refetchPayments(), refetchProfile()]);
    } else {
      setState((current) => ({
        ...current,
        message: "",
        error: stripeResultMessage(stripeType, stripeStatus),
      }));
    }

    router.replace(nextParams.toString() ? `/portal/payments?${nextParams.toString()}` : "/portal/payments", {
      scroll: false,
    });
  }, [refetchPayments, refetchProfile, router, searchParams]);

  async function handleSubmit(event) {
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

  async function handleStripeCheckout(type) {
    if (type === "wallet_topup" && (!amount || Number(amount) <= 0)) {
      setState((current) => ({
        ...current,
        message: "",
        error: "Enter a valid top-up amount before starting Stripe checkout.",
      }));
      return;
    }

    setState((current) => ({
      ...current,
      stripeAction: type,
      message: "",
      error: "",
    }));

    try {
      const token = await getToken();
      const response = await apiFetch("/stripe/checkout-sessions", {
        method: "POST",
        token,
        body: type === "wallet_topup" ? { type, amount } : { type },
      });

      window.location.assign(response.url);
    } catch (error) {
      setState((current) => ({
        ...current,
        stripeAction: "",
        message: "",
        error: error.message,
      }));
    }
  }

  return (
    <div>
      <Topbar title="Wallet & Payments" subtitle="Use manual payments or Stripe, save a card for renewals, and let subscriptions use wallet first with card fallback second." />
      <div className="space-y-6 p-6">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Balance</CardTitle>
              <CardDescription>Manual and Stripe top-ups both land here. Renewals use wallet balance first and then your saved Stripe card for any remaining amount.</CardDescription>
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
                  <p className="mt-2 text-sm font-semibold text-slate-950">Wallet first, Stripe fallback</p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Stripe Automatic Payments</p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">{savedCardLabel(user)}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Save a Stripe card once and the renewal engine can charge the missing amount automatically whenever the wallet does not fully cover the subscription.
                    </p>
                  </div>
                  <Button
                    type="button"
                    disabled={state.saving || Boolean(state.stripeAction)}
                    onClick={() => handleStripeCheckout("card_setup")}
                  >
                    {state.stripeAction === "card_setup"
                      ? "Opening Stripe..."
                      : user?.defaultPaymentMethodLast4
                        ? "Update Saved Card"
                        : "Add Card for Auto Renewals"}
                  </Button>
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
                <div className="grid gap-3 md:grid-cols-2">
                  <Button className="w-full" type="submit" disabled={state.saving || Boolean(state.stripeAction)}>
                    {state.saving ? "Submitting top-up..." : "Submit Top-up for Approval"}
                  </Button>
                  <Button
                    className="w-full justify-center"
                    type="button"
                    variant="ghost"
                    disabled={state.saving || Boolean(state.stripeAction)}
                    onClick={() => handleStripeCheckout("wallet_topup")}
                  >
                    {state.stripeAction === "wallet_topup" ? "Opening Stripe..." : "Top Up with Stripe"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Wallet balance is always checked first for active subscription renewals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-600">
              <p>1. Top up manually with QR / payment link if you want admin-reviewed balance funding.</p>
              <p>2. Or use Stripe for an instant wallet top-up with no manual review delay.</p>
              <p>3. Save a Stripe card once if you want automatic renewal fallback billing.</p>
              <p>4. On renewal dates, the system uses wallet balance first and then charges the saved card for any remaining amount.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Activity</CardTitle>
            <CardDescription>Track manual payments, Stripe charges, wallet top-ups, and automatic renewals in one place.</CardDescription>
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
