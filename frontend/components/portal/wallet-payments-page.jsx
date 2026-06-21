"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, History, Landmark, ShieldCheck, Wallet, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { resolvePublicFileUrl } from "@/lib/api/file-url";
import { useCustomerQuery } from "@/lib/api/hooks";
import { paymentProcessingMessage } from "@/lib/constants/site";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge, TextInput, cn } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";
import { PortalCardForm } from "@/components/portal/portal-card-form";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";

const walletSections = [
  { id: "overview", label: "Overview", icon: Wallet, summary: "Balance, renewals, and funding options" },
  { id: "saved-card", label: "Saved Card", icon: CreditCard, summary: "Control renewal fallback billing" },
  { id: "instant-topup", label: "Instant Top-up", icon: Zap, summary: "Fund the wallet by card immediately" },
  { id: "manual-topup", label: "Manual Payment", icon: Landmark, summary: "Submit transfer details for review" },
  { id: "activity", label: "Payment Activity", icon: History, summary: "Track submissions and charges" },
];

function submissionTypeLabel(type) {
  if (type === "wallet_topup") {
    return "Wallet Top-up";
  }

  if (type === "renewal_charge") {
    return "Automatic Renewal";
  }

  return "Subscription Payment";
}

function formatCardBrand(brand) {
  const value = String(brand || "").trim();
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "Card";
}

function getSavedCards(user) {
  const storedCards = Array.isArray(user?.savedPaymentMethods) ? user.savedPaymentMethods : [];
  const cardsById = new Map(storedCards.filter((card) => card?.id).map((card) => [String(card.id), card]));

  if (user?.defaultPaymentMethodId && !cardsById.has(String(user.defaultPaymentMethodId))) {
    cardsById.set(String(user.defaultPaymentMethodId), {
      id: user.defaultPaymentMethodId,
      brand: user.defaultPaymentMethodBrand || "",
      last4: user.defaultPaymentMethodLast4 || "",
      isPrimary: true,
    });
  }

  return [...cardsById.values()].map((card) => ({
    ...card,
    brandLabel: card.brandLabel || formatCardBrand(card.brand),
    isPrimary: String(card.id) === String(user?.defaultPaymentMethodId || "") || Boolean(card.isPrimary),
  }));
}

function getPrimaryCard(user) {
  const savedCards = getSavedCards(user);
  return savedCards.find((card) => card.isPrimary) || savedCards[0] || null;
}

function savedCardLabel(card) {
  if (!card?.last4) {
    return "No saved card on file.";
  }

  return `${card.brandLabel || formatCardBrand(card.brand)} ending in ${card.last4}`;
}

function cardExpiryLabel(card) {
  if (!card?.expMonth || !card?.expYear) {
    return "Expiry not available";
  }

  return `Expires ${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function WalletPaymentsPage() {
  const { getToken } = useAuth();
  const { showToast } = useActionToast();

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

  const [activeSection, setActiveSection] = useState("overview");
  const [instantAmount, setInstantAmount] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [invoiceCode, setInvoiceCode] = useState("");
  const [proof, setProof] = useState(null);
  const [proofInputKey, setProofInputKey] = useState(0);
  const [state, setState] = useState({
    saving: false,
    message: "",
    error: "",
  });
  const [cardManagementState, setCardManagementState] = useState({
    savingId: "",
    action: "",
    message: "",
    error: "",
  });

  const user = profileData?.user;
  const submissions = paymentsData?.submissions || [];
  const paymentSetting = paymentSettingQuery.data?.paymentSetting;
  const savedCards = getSavedCards(user);
  const primaryCard = getPrimaryCard(user);
  const pendingTopups = submissions.filter(
    (submission) => submission.submissionType === "wallet_topup" && submission.status === "pending_verification",
  ).length;
  const isLoading = profileQuery.isLoading || paymentsQuery.isLoading || paymentSettingQuery.isLoading;
  const hasSavedCard = savedCards.length > 0;
  const autoCardBillingEnabled = Boolean(primaryCard) && user?.autoCardBillingEnabled !== false;
  const qrCodeUrl = resolvePublicFileUrl(paymentSetting?.qrCodeImageUrl);
  const renewalModeLabel = autoCardBillingEnabled ? "Wallet first, primary-card fallback" : "Wallet-only top-up mode";

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
      formData.append("amount", manualAmount);
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

      setManualAmount("");
      setInvoiceCode("");
      setProof(null);
      setProofInputKey((current) => current + 1);
      setState((current) => ({
        ...current,
        saving: false,
        message: response.message || paymentProcessingMessage,
        error: "",
      }));
      showToast({
        type: "info",
        action: "Wallet Top-up",
        title: "Top-up submitted",
        description: response.message || paymentProcessingMessage,
      });
      setActiveSection("activity");
      await Promise.all([refetchPayments(), refetchProfile()]);
    } catch (error) {
      setState((current) => ({ ...current, saving: false, message: "", error: error.message }));
      showToast({
        type: "error",
        action: "Wallet Top-up",
        title: "Top-up failed",
        description: error.message,
      });
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

    if (!result.setupIntent?.id) {
      throw new Error("Stripe confirmed the card setup but did not return a setup intent ID.");
    }

    await apiFetch("/stripe/finalize", {
      method: "POST",
      token,
      body: {
        setupIntentId: result.setupIntent.id,
      },
    });

    await syncPortalPayments();
    return hasSavedCard
      ? "Your card has been saved and set as the primary card."
      : "Your card has been saved and set as the primary card. You can switch to wallet-only mode any time.";
  }

  async function handleCardTopup({ stripe, cardElement }) {
    const numericAmount = Number(instantAmount || 0);
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

    if (!result.paymentIntent?.id) {
      throw new Error("Stripe confirmed the wallet top-up but did not return a payment intent ID.");
    }

    await apiFetch("/stripe/finalize", {
      method: "POST",
      token,
      body: {
        paymentIntentId: result.paymentIntent.id,
      },
    });

    await syncPortalPayments();
    setInstantAmount("");
    setActiveSection("overview");
    return "Your wallet payment was received. The balance has been refreshed.";
  }

  async function handleMakePrimaryCard(paymentMethodId) {
    setCardManagementState({ savingId: paymentMethodId, action: "primary", message: "", error: "" });

    try {
      const token = await getToken();
      const response = await apiFetch(`/stripe/payment-methods/${paymentMethodId}/primary`, {
        method: "PATCH",
        token,
      });

      await syncPortalPayments();
      setCardManagementState({
        savingId: "",
        action: "",
        message: response.message || "Primary renewal card has been updated.",
        error: "",
      });
      showToast({
        type: "success",
        action: "Saved Card",
        title: "Primary card updated",
        description: response.message || "Primary renewal card has been updated.",
      });
    } catch (error) {
      setCardManagementState({
        savingId: "",
        action: "",
        message: "",
        error: error.message || "The primary card could not be updated.",
      });
      showToast({
        type: "error",
        action: "Saved Card",
        title: "Primary card update failed",
        description: error.message || "The primary card could not be updated.",
      });
    }
  }

  async function handleAutoBillingToggle(enabled) {
    setCardManagementState({ savingId: "auto-billing", action: enabled ? "enable" : "disable", message: "", error: "" });

    try {
      const token = await getToken();
      const response = await apiFetch("/stripe/payment-methods/auto-billing", {
        method: "PATCH",
        token,
        body: { enabled },
      });

      await syncPortalPayments();
      setCardManagementState({
        savingId: "",
        action: "",
        message: response.message || "Saved-card fallback billing preference has been updated.",
        error: "",
      });
      showToast({
        type: "success",
        action: "Saved Card",
        title: enabled ? "Card fallback enabled" : "Card fallback disabled",
        description: response.message || "Saved-card fallback billing preference has been updated.",
      });
    } catch (error) {
      setCardManagementState({
        savingId: "",
        action: "",
        message: "",
        error: error.message || "Saved-card fallback billing could not be updated.",
      });
      showToast({
        type: "error",
        action: "Saved Card",
        title: "Billing preference failed",
        description: error.message || "Saved-card fallback billing could not be updated.",
      });
    }
  }

  async function handleRemoveSavedCard(paymentMethodId) {
    setCardManagementState({ savingId: paymentMethodId, action: "remove", message: "", error: "" });

    try {
      const token = await getToken();
      const response = await apiFetch(`/stripe/payment-methods/${paymentMethodId}`, {
        method: "DELETE",
        token,
      });

      await syncPortalPayments();
      setCardManagementState({
        savingId: "",
        action: "",
        message: response.message || "Your saved card has been removed.",
        error: "",
      });
      showToast({
        type: "success",
        action: "Saved Card",
        title: "Card removed",
        description: response.message || "Your saved card has been removed.",
      });
    } catch (error) {
      setCardManagementState({
        savingId: "",
        action: "",
        message: "",
        error: error.message || "The saved card could not be removed.",
      });
      showToast({
        type: "error",
        action: "Saved Card",
        title: "Card removal failed",
        description: error.message || "The saved card could not be removed.",
      });
    }
  }

  if (isLoading && !profileData && !paymentsData) {
    return <PageLoader title="Wallet & Payments" subtitle="Loading wallet balance, payment methods, and submissions..." cardCount={3} lines={4} />;
  }

  return (
    <div>
      <Topbar
        title="Wallet & Payments"
        subtitle="Manage wallet funding, saved cards, renewal billing, and payment activity from one portal surface."
      />

      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-6 md:p-8">
        <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_28px_80px_-60px_rgba(15,23,42,0.22)]">
          <CardContent className="space-y-8 p-6 md:p-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Billing Command Center</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Control wallet funding and renewal billing from one place.</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Keep wallet balance available for renewals, add or remove a fallback card, submit manual transfer proof when needed, and review payment activity
                  without leaving the portal.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Wallet balance is checked first on every active renewal
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Available Balance</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{formatCurrency(user?.accountBalance || 0)}</p>
                <p className="mt-2 text-sm text-slate-500">Ready to be used for renewals and approved service charges.</p>
              </div>
              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending Top-ups</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{pendingTopups}</p>
                <p className="mt-2 text-sm text-slate-500">Manual submissions waiting for verification remain visible here.</p>
              </div>
              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Saved Cards</p>
                <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                  {hasSavedCard ? `${savedCards.length} saved card${savedCards.length === 1 ? "" : "s"}` : "Not added yet"}
                </p>
                <p className="mt-2 text-sm text-slate-500">{savedCardLabel(primaryCard)}</p>
              </div>
              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Renewal Mode</p>
                <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{renewalModeLabel}</p>
                <p className="mt-2 text-sm text-slate-500">Adjust the saved card section any time to control fallback billing.</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-5">
              {walletSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex min-h-[92px] flex-col justify-between rounded-[1.5rem] border px-4 py-4 text-left transition duration-200",
                      isActive
                        ? "border-slate-950 bg-slate-950 text-white shadow-[0_22px_50px_-34px_rgba(15,23,42,0.42)]"
                        : "border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="h-4 w-4" />
                      <span className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", isActive ? "text-white/65" : "text-slate-400")}>
                        Section
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{section.label}</p>
                      <p className={cn("mt-1 text-xs leading-5", isActive ? "text-white/72" : "text-slate-500")}>{section.summary}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {activeSection === "overview" ? (
          <Card className="overflow-hidden shadow-[0_24px_70px_-58px_rgba(15,23,42,0.2)]">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Choose the funding path that fits the situation and keep renewal billing under control.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
                    <Zap className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-slate-950">Instant card funding</p>
                    <p className="text-sm text-slate-500">Immediate wallet credit</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Use the instant top-up section when you want the wallet funded immediately after successful card confirmation.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
                    <Landmark className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-slate-950">Manual transfer submission</p>
                    <p className="text-sm text-slate-500">Reviewed by the admin team</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Use manual submission when you pay by QR or payment link and want the team to verify the transfer before adding the balance.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-slate-950">Saved card fallback</p>
                    <p className="text-sm text-slate-500">Optional for renewals</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  When a saved card exists, renewals still check the wallet first and only use the card if the remaining balance is not fully covered.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeSection === "saved-card" ? (
          <Card className="overflow-hidden shadow-[0_24px_70px_-58px_rgba(15,23,42,0.2)]">
            <CardHeader>
              <CardTitle>Saved Cards</CardTitle>
              <CardDescription>Save multiple cards, choose the primary renewal card, or keep renewals wallet-only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Renewal Billing Mode</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{renewalModeLabel}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      The wallet is checked first. When saved-card fallback is enabled, the primary card is charged only for any remaining renewal amount.
                    </p>
                  </div>

                  {hasSavedCard ? (
                    <Button
                      type="button"
                      variant={autoCardBillingEnabled ? "ghost" : "primary"}
                      disabled={cardManagementState.savingId === "auto-billing"}
                      onClick={() => handleAutoBillingToggle(!autoCardBillingEnabled)}
                      className="min-w-[220px] justify-center"
                    >
                      {cardManagementState.savingId === "auto-billing"
                        ? "Updating billing..."
                        : autoCardBillingEnabled
                          ? "Use Wallet Only"
                          : "Enable Card Fallback"}
                    </Button>
                  ) : null}
                </div>

                {cardManagementState.message ? <p className="mt-4 text-sm font-medium text-emerald-700">{cardManagementState.message}</p> : null}
                {cardManagementState.error ? <p className="mt-4 text-sm font-medium text-rose-600">{cardManagementState.error}</p> : null}
              </div>

              <div className="space-y-3">
                {savedCards.length ? (
                  savedCards.map((card) => {
                    const isSavingThisCard = cardManagementState.savingId === card.id;

                    return (
                      <div key={card.id} className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex min-w-0 items-center gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                              <CreditCard className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-semibold text-slate-950">{savedCardLabel(card)}</p>
                                {card.isPrimary ? (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    Primary
                                  </span>
                                ) : null}
                                {card.isPrimary && autoCardBillingEnabled ? (
                                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                    Renewal fallback
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-slate-500">{cardExpiryLabel(card)}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {!card.isPrimary ? (
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={isSavingThisCard}
                                onClick={() => handleMakePrimaryCard(card.id)}
                              >
                                {isSavingThisCard && cardManagementState.action === "primary" ? "Updating..." : "Make Primary"}
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={isSavingThisCard}
                              onClick={() => handleRemoveSavedCard(card.id)}
                            >
                              {isSavingThisCard && cardManagementState.action === "remove" ? "Removing..." : "Remove"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600">
                    No cards are saved yet. You can keep using wallet top-ups, or save a card below and decide whether it should be used for renewal fallback.
                  </div>
                )}
              </div>

              <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6">
                <PortalCardForm
                  submitLabel={hasSavedCard ? "Add Another Card" : "Save Card"}
                  pendingLabel={hasSavedCard ? "Adding card..." : "Saving card..."}
                  onSubmit={handleSaveCard}
                  successTitle={hasSavedCard ? "Saved card added" : "Saved card added"}
                  errorTitle="Saved card action failed"
                  actionLabel="Saved Card"
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeSection === "instant-topup" ? (
          <Card className="overflow-hidden shadow-[0_24px_70px_-58px_rgba(15,23,42,0.2)]">
            <CardHeader>
              <CardTitle>Instant Card Top-up</CardTitle>
              <CardDescription>Charge a card directly and post the amount to the wallet as soon as the payment is confirmed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Top-up Amount</label>
                  <TextInput type="number" min="1" value={instantAmount} onChange={(event) => setInstantAmount(event.target.value)} placeholder="100" />
                  <p className="mt-4 text-sm leading-7 text-slate-600">Use a positive amount and complete the card entry below to fund the wallet instantly.</p>
                </div>

                <div className="rounded-[1.8rem] border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Instant funding
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      No manual review delay
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    After payment confirmation, the wallet balance refreshes automatically and becomes available for orders, invoices, and subscription renewals.
                  </p>

                  <div className="mt-5 rounded-[1.5rem] border border-white/80 bg-white p-5">
                    <PortalCardForm
                      disabled={!instantAmount || Number(instantAmount) <= 0}
                      submitLabel="Top Up Wallet Now"
                      pendingLabel="Processing payment..."
                      onSubmit={handleCardTopup}
                      successTitle="Wallet funded"
                      errorTitle="Wallet top-up failed"
                      actionLabel="Wallet Top-up"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeSection === "manual-topup" ? (
          <Card className="overflow-hidden shadow-[0_24px_70px_-58px_rgba(15,23,42,0.2)]">
            <CardHeader>
              <CardTitle>Manual Payment Submission</CardTitle>
              <CardDescription>Use the configured QR or payment link, then submit the transfer details for manual verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-slate-50 p-4">
                  {qrCodeUrl ? (
                    <Image alt="Payment QR code" src={qrCodeUrl} width={240} height={240} className="h-auto w-full rounded-2xl object-cover" />
                  ) : (
                    <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 text-center text-sm text-slate-500">
                      QR code will appear here once payment settings are configured.
                    </div>
                  )}
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Transfer Instructions</p>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {paymentSetting?.instructions || "Scan the QR code, complete the transfer, and submit the payment reference below so the admin team can verify it."}
                  </p>
                  {paymentSetting?.paymentLink ? (
                    <div className="mt-5">
                      <a href={paymentSetting.paymentLink} target="_blank" rel="noreferrer">
                        <Button variant="ghost">Open Payment Link</Button>
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-5 rounded-[1.8rem] border border-slate-200 bg-white p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Top-up Amount</label>
                    <TextInput type="number" min="1" value={manualAmount} onChange={(event) => setManualAmount(event.target.value)} placeholder="100" required />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Transaction ID / Reference</label>
                    <TextInput value={invoiceCode} onChange={(event) => setInvoiceCode(event.target.value)} placeholder="Enter transfer reference" required />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Payment Proof Screenshot (optional)</label>
                  <input
                    key={proofInputKey}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setProof(event.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  />
                </div>

                {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
                {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}

                <Button className="w-full sm:w-auto" type="submit" disabled={state.saving}>
                  {state.saving ? "Submitting top-up..." : "Submit Top-up for Approval"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {activeSection === "activity" ? (
          <Card className="overflow-hidden shadow-[0_24px_70px_-58px_rgba(15,23,42,0.2)]">
            <CardHeader>
              <CardTitle>Payment Activity</CardTitle>
              <CardDescription>Track manual submissions, card charges, wallet top-ups, and automatic renewals in one place.</CardDescription>
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
        ) : null}
      </div>
    </div>
  );
}
