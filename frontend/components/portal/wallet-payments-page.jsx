"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, CircleDollarSign, CreditCard, History, Plus, ReceiptText, ShieldCheck, Sparkles, Wallet, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge, TextInput, cn } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { createStripePaymentError, normalizePaymentActionError } from "@/lib/payments/stripe-errors";
import { Topbar } from "@/components/shared/topbar";
import { PortalCardForm, portalStripePromise } from "@/components/portal/portal-card-form";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { ContractApprovalLock, isContractApprovedForPayments } from "@/components/portal/contract-approval-lock";

const walletSections = [
  { id: "overview", label: "Overview", icon: Wallet, summary: "Balance, renewals, and funding options" },
  { id: "saved-card", label: "Saved Card", icon: CreditCard, summary: "Control renewal fallback billing" },
  { id: "instant-topup", label: "Instant Top-up", icon: Zap, summary: "Fund the wallet by card immediately" },
  { id: "activity", label: "Payment Activity", icon: History, summary: "Track card payments and wallet charges" },
];

const topupPresets = [25, 50, 100, 250];

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useActionToast();

  const profileQuery = useCustomerQuery({
    queryKey: ["portal-profile"],
    path: "/profile/me",
  });
  const paymentsQuery = useCustomerQuery({
    queryKey: ["portal-payments"],
    path: "/payments/submissions",
  });
  const contractQuery = useCustomerQuery({
    queryKey: ["portal-contract-current"],
    path: "/contracts/current",
  });

  const { data: profileData, refetch: refetchProfile } = profileQuery;
  const { data: paymentsData, refetch: refetchPayments } = paymentsQuery;

  const [activeSection, setActiveSection] = useState("overview");
  const [instantAmount, setInstantAmount] = useState("");
  const [savedTopupState, setSavedTopupState] = useState({ savingId: "", error: "", message: "" });
  const [blockedSavedTopupCardId, setBlockedSavedTopupCardId] = useState("");
  const [cardManagementState, setCardManagementState] = useState({
    savingId: "",
    action: "",
    message: "",
    error: "",
  });

  const user = profileData?.user;
  const contractStatus = contractQuery.data?.contract?.status || contractQuery.data?.status || "NOT_STARTED";
  const contractApproved = isContractApprovedForPayments(contractStatus);
  const submissions = paymentsData?.submissions || [];
  const savedCards = getSavedCards(user);
  const primaryCard = getPrimaryCard(user);
  const walletTopups = submissions.filter((submission) => submission.submissionType === "wallet_topup").length;
  const isLoading = profileQuery.isLoading || paymentsQuery.isLoading;
  const hasSavedCard = savedCards.length > 0;
  const autoCardBillingEnabled = Boolean(primaryCard) && user?.autoCardBillingEnabled !== false;
  const renewalModeLabel = autoCardBillingEnabled ? "Wallet first, primary-card fallback" : "Wallet-only top-up mode";
  const walletBalance = Number(user?.accountBalance || 0);
  const recentSubmissions = submissions.slice(0, 4);

  useEffect(() => {
    const requestedSection = searchParams.get("section");
    if (walletSections.some((section) => section.id === requestedSection)) {
      setActiveSection(requestedSection);
    }
  }, [searchParams]);

  async function syncPortalPayments() {
    await Promise.all([refetchPayments(), refetchProfile()]);
    await wait(1200);
    await Promise.all([refetchPayments(), refetchProfile()]);
  }

  async function handleSaveCard({ stripe, cardElement }) {
    const token = await getToken();
    let response;
    try {
      response = await apiFetch("/stripe/intents", {
        method: "POST",
        token,
        body: { type: "card_setup" },
      });
    } catch (error) {
      if (error.redirectUrl) {
        router.push(error.redirectUrl);
      }
      throw error;
    }

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

    try {
      await apiFetch("/stripe/finalize", {
        method: "POST",
        token,
        body: {
          setupIntentId: result.setupIntent.id,
        },
      });
    } catch (error) {
      if (error.redirectUrl) {
        router.push(error.redirectUrl);
      }
      throw error;
    }

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
    let response;
    try {
      response = await apiFetch("/stripe/intents", {
        method: "POST",
        token,
        body: {
          type: "wallet_topup",
          amount: numericAmount,
        },
      });
    } catch (error) {
      if (error.redirectUrl) {
        router.push(error.redirectUrl);
      }
      throw error;
    }

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
      throw createStripePaymentError(result.error, "The wallet top-up could not be completed.");
    }

    if (!result.paymentIntent?.id) {
      throw new Error("Stripe confirmed the wallet top-up but did not return a payment intent ID.");
    }

    try {
      await apiFetch("/stripe/finalize", {
        method: "POST",
        token,
        body: {
          paymentIntentId: result.paymentIntent.id,
        },
      });
    } catch (error) {
      if (error.redirectUrl) {
        router.push(error.redirectUrl);
      }
      throw error;
    }

    await syncPortalPayments();
    setInstantAmount("");
    setActiveSection("overview");
    return "Your wallet payment was received. The balance has been refreshed.";
  }

  async function handleSavedCardTopup(paymentMethodId) {
    const numericAmount = Number(instantAmount || 0);
    if (!numericAmount || numericAmount <= 0) {
      setSavedTopupState({ savingId: "", error: "Enter a valid top-up amount before charging the saved card.", message: "" });
      return;
    }

    setSavedTopupState({ savingId: paymentMethodId, error: "", message: "" });

    try {
      const token = await getToken();
      const response = await apiFetch(`/stripe/payment-methods/${paymentMethodId}/topup`, {
        method: "POST",
        token,
        body: { amount: numericAmount },
      });

      const stripe = await portalStripePromise;
      if (!stripe) {
        throw new Error("Card checkout is not available right now. Please contact support.");
      }

      const result = await stripe.confirmCardPayment(response.clientSecret, {
        payment_method: paymentMethodId,
      });

      if (result.error) {
        throw createStripePaymentError(result.error, "The saved-card top-up could not be completed.");
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
      setBlockedSavedTopupCardId("");
      setActiveSection("overview");
      setSavedTopupState({
        savingId: "",
        error: "",
        message: response.message || "Your saved card was charged and the wallet balance has been refreshed.",
      });
      showToast({
        type: "success",
        action: "Wallet Top-up",
        title: "Wallet funded",
        description: response.message || "Your saved card was charged and the wallet balance has been refreshed.",
      });
    } catch (error) {
      const normalizedError = normalizePaymentActionError(error);
      if (normalizedError.preventSameCardRetry) {
        setBlockedSavedTopupCardId(paymentMethodId);
      }
      if (normalizedError.redirectUrl) {
        router.push(normalizedError.redirectUrl);
      }
      setSavedTopupState({
        savingId: "",
        error: normalizedError.message || "The saved-card top-up could not be completed.",
        message: "",
      });
      showToast({
        type: "error",
        action: "Wallet Top-up",
        title: "Saved-card top-up failed",
        description: normalizedError.message || "The saved-card top-up could not be completed.",
      });
    }
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
    return <PageLoader title="Wallet & Payments" subtitle="Loading wallet balance, saved cards, and payment activity..." cardCount={3} lines={4} />;
  }

  return (
    <div className="min-h-full">
      <Topbar
        title="Wallet & payments"
        subtitle="One balance for top-ups, renewals, and every approved ElevenOrbits service."
        actions={
          <Button type="button" onClick={() => setActiveSection("instant-topup")}>
            <Plus className="h-4 w-4" />
            Add funds
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-[1680px] space-y-6 p-4 sm:p-6 md:p-8">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-panel sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-brand-600/20 blur-3xl" />

            <div className="relative flex h-full min-h-[290px] flex-col justify-between gap-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                  <Wallet className="h-4 w-4 text-accent-400" />
                  ElevenOrbits wallet
                </span>
                <span className="inline-flex items-center gap-2 text-sm text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready to use
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-400">Available balance</p>
                <p className="mt-2 text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">{formatCurrency(walletBalance)}</p>
                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
                  Your wallet is used first for renewals and approved service charges. Add exactly what you need, whenever you need it.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={() => setActiveSection("instant-topup")} className="min-w-[150px]">
                  <Plus className="h-4 w-4" />
                  Top up wallet
                </Button>
                <Button type="button" variant="ghost" onClick={() => setActiveSection("activity")} className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                  View activity
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="flex h-full flex-col p-0">
              <div className="border-b border-line p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Payment setup</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Everything connected</p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                </div>
              </div>

              <div className="divide-y divide-line px-5 sm:px-6">
                <button type="button" onClick={() => setActiveSection("saved-card")} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">{savedCards.length} saved card{savedCards.length === 1 ? "" : "s"}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{savedCardLabel(primaryCard)}</span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>

                <button type="button" onClick={() => setActiveSection("saved-card")} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">Renewal mode</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{renewalModeLabel}</span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>

                <button type="button" onClick={() => setActiveSection("activity")} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <ReceiptText className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{walletTopups} wallet top-up{walletTopups === 1 ? "" : "s"}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{submissions.length} total payment record{submissions.length === 1 ? "" : "s"}</span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              </div>
            </CardContent>
          </Card>
        </section>

        <nav aria-label="Wallet views" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {walletSections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeSection;

            return (
              <button
                key={section.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "group flex min-h-[92px] items-center gap-4 rounded-xl border p-4 text-left transition-all",
                  isActive
                    ? "border-accent-300 bg-accent-50 shadow-card-hover"
                    : "border-line bg-white hover:border-slate-300 hover:shadow-card-hover",
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isActive ? "bg-accent-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm font-semibold", isActive ? "text-accent-700" : "text-slate-900")}>{section.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{section.summary}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {activeSection === "overview" ? (
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-col gap-4 border-b-0 pb-0 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Quick funding</CardTitle>
                    <CardDescription className="mt-1">Choose an amount and continue to the secure card form.</CardDescription>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                    <Zap className="h-5 w-5" />
                  </span>
                </CardHeader>
                <CardContent className="space-y-6 p-5 sm:p-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {topupPresets.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setInstantAmount(String(amount))}
                        className={cn(
                          "rounded-xl border px-4 py-4 text-left transition-colors",
                          Number(instantAmount) === amount
                            ? "border-accent-400 bg-accent-50 text-accent-700"
                            : "border-line bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white",
                        )}
                      >
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Add</span>
                        <span className="mt-1 block text-xl font-semibold">{formatCurrency(amount)}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-4 rounded-xl border border-line bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Selected amount</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{formatCurrency(Number(instantAmount || 0))}</p>
                    </div>
                    <Button type="button" disabled={!instantAmount || Number(instantAmount) <= 0} onClick={() => setActiveSection("instant-topup")}>
                      Continue to payment
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1f2937] via-slate-900 to-slate-950 p-6 text-white shadow-panel sm:p-7">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-accent-500/15" />
                <div className="relative flex min-h-[245px] flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <CreditCard className="h-5 w-5 text-accent-400" />
                    </span>
                    {primaryCard ? <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">Primary card</span> : null}
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">Renewal fallback</p>
                    <p className="mt-2 text-xl font-semibold">{primaryCard ? savedCardLabel(primaryCard) : "No card selected"}</p>
                    <p className="mt-2 text-sm text-slate-400">{primaryCard ? cardExpiryLabel(primaryCard) : "Add a card only if you want automatic renewal fallback."}</p>
                  </div>

                  <button type="button" onClick={() => setActiveSection("saved-card")} className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-white">
                    {primaryCard ? "Manage saved cards" : "Add a saved card"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Recent activity</CardTitle>
                  <CardDescription className="mt-1">Your latest wallet and payment movements.</CardDescription>
                </div>
                <Button type="button" variant="ghost" onClick={() => setActiveSection("activity")}>
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {recentSubmissions.length ? (
                  <div className="divide-y divide-line">
                    {recentSubmissions.map((submission) => (
                      <div key={submission._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <ReceiptText className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{submissionTypeLabel(submission.submissionType)}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {submission.invoiceCode || "Wallet payment"} · {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 pl-[52px] sm:pl-0">
                          <StatusBadge status={submission.status} />
                          <p className="min-w-24 text-right text-sm font-semibold text-slate-950">
                            {formatCurrency(submission.amount || submission.orderId?.totalAmount || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center px-6 py-12 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <History className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-slate-900">No payment activity yet</p>
                    <p className="mt-1 text-sm text-slate-500">Your first completed top-up will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeSection === "saved-card" ? (
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Saved cards</CardTitle>
                    <CardDescription className="mt-1">Choose the primary card used when your wallet cannot cover a renewal.</CardDescription>
                  </div>
                  {hasSavedCard ? (
                    <Button
                      type="button"
                      variant={autoCardBillingEnabled ? "ghost" : "primary"}
                      disabled={cardManagementState.savingId === "auto-billing"}
                      onClick={() => handleAutoBillingToggle(!autoCardBillingEnabled)}
                    >
                      {cardManagementState.savingId === "auto-billing"
                        ? "Updating..."
                        : autoCardBillingEnabled
                          ? "Use wallet only"
                          : "Enable card fallback"}
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">Wallet always comes first</p>
                      <p className="mt-1 text-sm leading-6 text-emerald-700">{renewalModeLabel}. A saved card only covers a remaining renewal shortfall.</p>
                    </div>
                  </div>

                  {cardManagementState.message ? <p className="text-sm font-medium text-emerald-700">{cardManagementState.message}</p> : null}
                  {cardManagementState.error ? <p className="text-sm font-medium text-rose-600">{cardManagementState.error}</p> : null}

                  {savedCards.length ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {savedCards.map((card, index) => {
                        const isSavingThisCard = cardManagementState.savingId === card.id;

                        return (
                          <div key={card.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-card">
                            <div className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl", index % 2 === 0 ? "bg-accent-500/30" : "bg-brand-500/30")} />
                            <div className="relative flex min-h-[180px] flex-col justify-between gap-6">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold">{card.brandLabel || formatCardBrand(card.brand)}</span>
                                <div className="flex flex-wrap justify-end gap-2">
                                  {card.isPrimary ? <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold">Primary</span> : null}
                                  {card.isPrimary && autoCardBillingEnabled ? <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">Fallback on</span> : null}
                                </div>
                              </div>

                              <div>
                                <p className="text-xl font-semibold tracking-[0.14em]">•••• •••• •••• {card.last4 || "••••"}</p>
                                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-400">{cardExpiryLabel(card)}</p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {!card.isPrimary ? (
                                  <button
                                    type="button"
                                    disabled={isSavingThisCard}
                                    onClick={() => handleMakePrimaryCard(card.id)}
                                    className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
                                  >
                                    {isSavingThisCard && cardManagementState.action === "primary" ? "Updating..." : "Make primary"}
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  disabled={isSavingThisCard}
                                  onClick={() => handleRemoveSavedCard(card.id)}
                                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                  {isSavingThisCard && cardManagementState.action === "remove" ? "Removing..." : "Remove"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                      <CreditCard className="h-6 w-6 text-slate-400" />
                      <p className="mt-3 text-sm font-semibold text-slate-900">No saved cards</p>
                      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">You can keep using one-time top-ups without saving a card.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>{hasSavedCard ? "Add another card" : "Save a card"}</CardTitle>
                  <CardDescription>Optional. Saved cards make future top-ups and renewal fallback faster.</CardDescription>
                </CardHeader>
                <CardContent>
                  {contractApproved ? (
                    <PortalCardForm
                      submitLabel={hasSavedCard ? "Add card" : "Save card"}
                      pendingLabel={hasSavedCard ? "Adding card..." : "Saving card..."}
                      onSubmit={handleSaveCard}
                      successTitle="Saved card added"
                      errorTitle="Saved card action failed"
                      actionLabel="Saved Card"
                    />
                  ) : (
                    <ContractApprovalLock description="Saved-card setup is available after an ElevenOrbits administrator approves your signed agreement." />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {activeSection === "instant-topup" ? (
          <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="h-fit overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle>Choose amount</CardTitle>
                    <CardDescription className="mt-1">Funds appear after the card charge succeeds.</CardDescription>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                    <CircleDollarSign className="h-5 w-5" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label htmlFor="wallet-topup-amount" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Top-up amount</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-slate-400">$</span>
                    <TextInput
                      id="wallet-topup-amount"
                      type="number"
                      min="1"
                      step="0.01"
                      value={instantAmount}
                      onChange={(event) => setInstantAmount(event.target.value)}
                      placeholder="0.00"
                      className="h-16 rounded-xl pl-9 text-2xl font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {topupPresets.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setInstantAmount(String(amount))}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                        Number(instantAmount) === amount
                          ? "border-accent-400 bg-accent-50 text-accent-700"
                          : "border-line bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>

                <div className="rounded-xl bg-slate-950 p-4 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-400">Wallet after top-up</span>
                    <span className="text-lg font-semibold">{formatCurrency(walletBalance + Number(instantAmount || 0))}</span>
                  </div>
                </div>

                <p className="text-xs leading-5 text-slate-500">Enter any positive amount. The card is validated before the payment is submitted.</p>
              </CardContent>
            </Card>

            <div className="space-y-5">
              {primaryCard ? (
                <Card>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                          <CreditCard className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">Top up with {savedCardLabel(primaryCard)}</p>
                            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">Fastest</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{cardExpiryLabel(primaryCard)} · No card details to re-enter</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        disabled={
                          !instantAmount ||
                          Number(instantAmount) <= 0 ||
                          savedTopupState.savingId === primaryCard.id ||
                          blockedSavedTopupCardId === primaryCard.id ||
                          !contractApproved
                        }
                        onClick={() => handleSavedCardTopup(primaryCard.id)}
                        className="min-w-[190px]"
                      >
                        {savedTopupState.savingId === primaryCard.id
                          ? "Charging card..."
                          : blockedSavedTopupCardId === primaryCard.id
                            ? "Choose another card"
                            : `Add ${formatCurrency(Number(instantAmount || 0))}`}
                      </Button>
                    </div>
                    {savedTopupState.error ? <p className="mt-4 text-sm font-medium text-rose-600">{savedTopupState.error}</p> : null}
                    {savedTopupState.message ? <p className="mt-4 text-sm font-medium text-emerald-700">{savedTopupState.message}</p> : null}
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{primaryCard ? "Use a different card" : "Pay with a card"}</CardTitle>
                      <CardDescription className="mt-1">One-time payment. This card will not be saved automatically.</CardDescription>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Instant credit</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {contractApproved ? (
                    <PortalCardForm
                      disabled={!instantAmount || Number(instantAmount) <= 0}
                      submitLabel={`Add ${formatCurrency(Number(instantAmount || 0))} to Wallet`}
                      pendingLabel="Processing payment..."
                      onSubmit={handleCardTopup}
                      successTitle="Wallet funded"
                      errorTitle="Wallet top-up failed"
                      actionLabel="Wallet Top-up"
                    />
                  ) : (
                    <ContractApprovalLock description="Wallet card top-ups unlock after an ElevenOrbits administrator approves your signed agreement." />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {activeSection === "activity" ? (
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Payment activity</CardTitle>
                <CardDescription className="mt-1">Track card payments, wallet top-ups, and automatic renewals in one place.</CardDescription>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-line bg-slate-50 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-card">
                  <History className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-slate-500">Total records</p>
                  <p className="text-sm font-semibold text-slate-900">{submissions.length}</p>
                </div>
              </div>
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
      </main>
    </div>
  );
}
