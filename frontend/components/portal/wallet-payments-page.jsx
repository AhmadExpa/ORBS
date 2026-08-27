"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, CreditCard, History, Plus, ReceiptText, RefreshCw, Search, ShieldCheck, Wallet, X, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge, TextInput, cn } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import {
  createEmptyPaymentBillingDetails,
  getPaymentBillingDetailsValidationError,
  normalizePaymentBillingDetails,
  toStripeBillingDetails,
} from "@/lib/payments/billing-details";
import { createStripePaymentError, getStripePaymentErrorMessage, normalizePaymentActionError } from "@/lib/payments/stripe-errors";
import { buildBillingDetailsFromProfile } from "@/lib/payments/profile-billing-details";
import { Topbar } from "@/components/shared/topbar";
import {
  CARD_VERIFICATION_MODE_STANDARD,
  PortalCardForm,
  portalStripePromise,
} from "@/components/portal/portal-card-form";
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
  if (type === "wallet_auto_topup") {
    return "Monthly Wallet Top-up";
  }

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
      is3DS: false,
    });
  }

  return [...cardsById.values()].map((card) => ({
    ...card,
    brandLabel: card.brandLabel || formatCardBrand(card.brand),
    isPrimary: String(card.id) === String(user?.defaultPaymentMethodId || "") || Boolean(card.isPrimary),
    is3DS: card.is3DS === true,
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

function formatActivityDate(value, withTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

function transactionStatusLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") return "Completed";
  if (normalized === "failed" || normalized === "rejected") return "Declined";
  if (normalized === "requires_action") return "Action required";
  if (normalized === "processing" || normalized === "pending_verification") return "Processing";
  if (normalized === "charged_back") return "Charged back";
  if (normalized === "cancelled") return "Canceled";
  return normalized ? normalized.replaceAll("_", " ") : "Pending";
}

function transactionStatusDetail(submission) {
  const normalized = String(submission?.status || "").toLowerCase();
  if (normalized === "approved") return "Funds received by ElevenOrbits";
  if (normalized === "failed" || normalized === "rejected") {
    return submission?.customerMessage || getStripePaymentErrorMessage({ ...submission, status: normalized }, "The payment was declined and was not completed.");
  }
  if (normalized === "requires_action") return "Complete the bank verification shown in this portal.";
  if (normalized === "processing" || normalized === "pending_verification") return "Stripe is still confirming this payment.";
  if (normalized === "refunded") return "The payment was returned to the customer.";
  if (normalized === "disputed" || normalized === "charged_back") return "This payment is under dispute review.";
  if (normalized === "cancelled") return "This payment attempt was canceled before completion.";
  return "Payment record available";
}

function transactionFilterMatches(submission, filter) {
  const status = String(submission?.status || "").toLowerCase();
  if (filter === "successful") return status === "approved";
  if (filter === "pending") return ["processing", "pending_verification", "requires_action"].includes(status);
  if (filter === "attention") return ["failed", "rejected", "refunded", "disputed", "charged_back", "cancelled"].includes(status);
  return true;
}

function transactionReference(submission) {
  const reference = String(submission?.invoiceCode || submission?.gatewayPaymentId || submission?._id || "");
  if (reference.length <= 18) return reference;
  return `…${reference.slice(-16)}`;
}

function formatScheduleDate(value) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createPaymentRequestId() {
  return globalThis.crypto?.randomUUID?.() || `payment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  const cardVerificationMode = CARD_VERIFICATION_MODE_STANDARD;
  const cardSetupVerificationMode = CARD_VERIFICATION_MODE_STANDARD;
  const [topupBillingDetails, setTopupBillingDetails] = useState(createEmptyPaymentBillingDetails);
  const [newCardBillingDetails, setNewCardBillingDetails] = useState(createEmptyPaymentBillingDetails);
  const [saveCardForFutureUse, setSaveCardForFutureUse] = useState(false);
  const [savedTopupState, setSavedTopupState] = useState({ savingId: "", error: "", message: "" });
  const [blockedSavedTopupCardId, setBlockedSavedTopupCardId] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [activitySearch, setActivitySearch] = useState("");
  const [selectedTransactionId, setSelectedTransactionId] = useState("");
  const cardSetupRequestIdRef = useRef("");
  const newCardTopupRequestIdRef = useRef("");
  const savedCardTopupRequestIdsRef = useRef({});
  const reconciliationStartedRef = useRef(false);
  const checkoutPrefillAppliedRef = useRef(false);
  const [cardManagementState, setCardManagementState] = useState({
    savingId: "",
    action: "",
    message: "",
    error: "",
  });
  const [autoTopupForm, setAutoTopupForm] = useState({ amount: "", dayOfMonth: "1" });
  const [autoTopupState, setAutoTopupState] = useState({ isSaving: false, message: "", error: "" });

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
  const walletAutoTopup = {
    enabled: Boolean(user?.walletAutoTopupEnabled),
    amount: Number(user?.walletAutoTopupAmount || 0),
    dayOfMonth: Number(user?.walletAutoTopupDayOfMonth || 1),
    nextRunAt: user?.walletAutoTopupNextRunAt || "",
    lastRunAt: user?.walletAutoTopupLastRunAt || "",
    lastStatus: user?.walletAutoTopupLastStatus || "",
    lastMessage: user?.walletAutoTopupLastMessage || "",
  };
  const recentSubmissions = submissions.slice(0, 4);
  const normalizedActivitySearch = activitySearch.trim().toLowerCase();
  const filteredSubmissions = submissions.filter((submission) => {
    if (!transactionFilterMatches(submission, activityFilter)) {
      return false;
    }

    if (!normalizedActivitySearch) {
      return true;
    }

    const searchable = [
      submissionTypeLabel(submission.submissionType),
      submission.invoiceCode,
      submission.gatewayPaymentId,
      submission.cardBrand,
      submission.cardLast4,
      submission.status,
      submission.customerMessage,
    ].join(" ").toLowerCase();
    return searchable.includes(normalizedActivitySearch);
  });
  const transactionCounts = {
    all: submissions.length,
    successful: submissions.filter((submission) => String(submission.status || "").toLowerCase() === "approved").length,
    pending: submissions.filter((submission) => transactionFilterMatches(submission, "pending")).length,
    attention: submissions.filter((submission) => transactionFilterMatches(submission, "attention")).length,
  };
  const selectedTransaction = submissions.find((submission) => String(submission._id) === String(selectedTransactionId));
  const requestedAmount = Number(searchParams.get("amount") || 0);
  const requestedReturnUrl = searchParams.get("return_url") || "";
  const returnUrl = requestedReturnUrl.startsWith("/") && !requestedReturnUrl.startsWith("//")
    ? requestedReturnUrl
    : "";

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    setNewCardBillingDetails((current) => {
      if (Object.values(current).some(Boolean)) {
        return current;
      }

      return buildBillingDetailsFromProfile(user);
    });
  }, [user?._id]);

  useEffect(() => {
    const requestedSection = searchParams.get("section");
    if (walletSections.some((section) => section.id === requestedSection)) {
      setActiveSection(requestedSection);
    }
  }, [searchParams]);

  useEffect(() => {
    if (checkoutPrefillAppliedRef.current || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return;
    }

    checkoutPrefillAppliedRef.current = true;
    setInstantAmount(requestedAmount.toFixed(2));
  }, [requestedAmount]);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    setAutoTopupForm({
      amount: user.walletAutoTopupAmount ? Number(user.walletAutoTopupAmount).toFixed(2) : "",
      dayOfMonth: String(Number(user.walletAutoTopupDayOfMonth || 1)),
    });
  }, [user?._id, user?.walletAutoTopupAmount, user?.walletAutoTopupDayOfMonth]);

  useEffect(() => {
    if (!user?._id || !contractApproved || reconciliationStartedRef.current) {
      return;
    }

    reconciliationStartedRef.current = true;
    let isActive = true;

    async function reconcileSuccessfulPayments() {
      try {
        const token = await getToken({ skipCache: true });
        const result = await apiFetch("/stripe/reconcile", {
          method: "POST",
          token,
        });

        if (!isActive) {
          return;
        }

        if (result.reconciled > 0) {
          await Promise.all([refetchPayments(), refetchProfile()]);
          showToast({
            type: "success",
            action: "Wallet Top-up",
            title: "Payment synchronized",
            description: result.reconciled === 1
              ? "A successful Stripe payment was recovered and added to your wallet."
              : `${result.reconciled} successful Stripe payments were recovered and added to your wallet.`,
          });
        }
      } catch {
        // The signed Stripe webhook remains the primary recovery path. A later page load retries reconciliation.
        reconciliationStartedRef.current = false;
      }
    }

    reconcileSuccessfulPayments();
    return () => {
      isActive = false;
    };
  }, [contractApproved, getToken, refetchPayments, refetchProfile, showToast, user?._id]);

  async function syncPortalPayments() {
    await Promise.all([refetchPayments(), refetchProfile()]);
    await wait(1200);
    await Promise.all([refetchPayments(), refetchProfile()]);
  }

  async function finalizeConfirmedStripeResource(body) {
    let lastError;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const token = await getToken({ skipCache: true });
        const response = await apiFetch("/stripe/finalize", {
          method: "POST",
          token,
          body,
        });
        return { completed: true, response };
      } catch (error) {
        lastError = error;
        if (attempt === 0) {
          await wait(500);
        }
      }
    }

    return { completed: false, error: lastError };
  }

  async function syncPortalPaymentsSafely() {
    try {
      await syncPortalPayments();
      return true;
    } catch {
      return false;
    }
  }

  async function recordFailedPaymentIntent(paymentIntentId) {
    if (!paymentIntentId) {
      return;
    }

    try {
      const token = await getToken({ skipCache: true });
      await apiFetch("/stripe/attempt-status", {
        method: "POST",
        token,
        body: { paymentIntentId },
      });
      await syncPortalPaymentsSafely();
    } catch {
      // The signed Stripe webhook remains the recovery path if this status sync is delayed.
    }
  }

  async function handleSaveCard({ stripe, cardElement, billingDetails }) {
    const token = await getToken();
    const requestId = cardSetupRequestIdRef.current || createPaymentRequestId();
    cardSetupRequestIdRef.current = requestId;
    let response;
    try {
      response = await apiFetch("/stripe/intents", {
        method: "POST",
        token,
        body: { type: "card_setup", billingDetails, cardVerificationMode: cardSetupVerificationMode, requestId },
      });
    } catch (error) {
      if (String(error.redirectUrl || "").startsWith("/")) {
        router.push(error.redirectUrl);
      }
      throw error;
    }

    const stripeBillingDetails = toStripeBillingDetails(billingDetails);
    const result = await stripe.confirmCardSetup(response.clientSecret, {
      payment_method: {
        card: cardElement,
        ...(Object.keys(stripeBillingDetails).length ? { billing_details: stripeBillingDetails } : {}),
      },
    });

    if (result.error) {
      cardSetupRequestIdRef.current = "";
      throw createStripePaymentError(result.error, "The card could not be saved.");
    }

    if (!result.setupIntent?.id) {
      throw new Error("Stripe confirmed the card setup but did not return a setup intent ID.");
    }

    const finalization = await finalizeConfirmedStripeResource({
      setupIntentId: result.setupIntent.id,
    });
    await syncPortalPaymentsSafely();

    if (!finalization.completed) {
      cardSetupRequestIdRef.current = "";
      return "Stripe verified the card. Its saved-card status is synchronizing automatically; do not submit it again.";
    }

    cardSetupRequestIdRef.current = "";

    return hasSavedCard
      ? "Your card has been saved and set as the primary card."
      : "Your card has been saved and set as the primary card. You can switch to wallet-only mode any time.";
  }

  async function handleNewCardTopup({ stripe, cardElement, billingDetails, saveCardForFutureUse: shouldSaveCard }) {
    const numericAmount = Number(instantAmount || 0);
    if (!numericAmount || numericAmount <= 0) {
      throw new Error("Enter a valid top-up amount before charging the card.");
    }

    try {
      const requestId = newCardTopupRequestIdRef.current || createPaymentRequestId();
      newCardTopupRequestIdRef.current = requestId;
      const token = await getToken();
      const response = await apiFetch("/stripe/intents", {
        method: "POST",
        token,
        body: {
          type: "wallet_topup",
          amount: numericAmount,
          billingDetails,
          cardVerificationMode,
          saveCardForFutureUse: shouldSaveCard,
          requestId,
        },
      });

      const stripeBillingDetails = toStripeBillingDetails(billingDetails);
      const result = await stripe.confirmCardPayment(response.clientSecret, {
        payment_method: {
          card: cardElement,
          ...(Object.keys(stripeBillingDetails).length ? { billing_details: stripeBillingDetails } : {}),
        },
      });

      if (result.error) {
        await recordFailedPaymentIntent(result.error.payment_intent?.id);
        newCardTopupRequestIdRef.current = "";
        throw createStripePaymentError(result.error, "The wallet top-up could not be completed.");
      }

      if (!result.paymentIntent?.id) {
        throw new Error("Stripe confirmed the wallet top-up but did not return a payment intent ID.");
      }

      const finalization = await finalizeConfirmedStripeResource({
        paymentIntentId: result.paymentIntent.id,
      });
      await syncPortalPaymentsSafely();
      setInstantAmount("");
      setNewCardBillingDetails(createEmptyPaymentBillingDetails());
      setSaveCardForFutureUse(false);
      newCardTopupRequestIdRef.current = "";
      setBlockedSavedTopupCardId("");
      setActiveSection("overview");

      const message = finalization.completed
        ? response.message || "Your card was charged and the wallet balance has been refreshed."
        : "Your card was charged successfully. The wallet credit is synchronizing automatically—do not submit this payment again.";

      if (finalization.completed && returnUrl) {
        router.push(returnUrl);
      }

      return message;
    } catch (error) {
      if (String(error.redirectUrl || "").startsWith("/")) {
        router.push(error.redirectUrl);
      }
      throw error;
    }
  }

  async function handleSavedCardTopup(paymentMethodId) {
    const numericAmount = Number(instantAmount || 0);
    if (!numericAmount || numericAmount <= 0) {
      setSavedTopupState({ savingId: "", error: "Enter a valid top-up amount before charging the saved card.", message: "" });
      return;
    }

    const billingError = getPaymentBillingDetailsValidationError(topupBillingDetails);
    if (billingError) {
      setSavedTopupState({ savingId: "", error: billingError, message: "" });
      return;
    }

    setSavedTopupState({ savingId: paymentMethodId, error: "", message: "" });

    try {
      const requestKey = `${paymentMethodId}:${numericAmount.toFixed(2)}`;
      const requestId = savedCardTopupRequestIdsRef.current[requestKey] || createPaymentRequestId();
      savedCardTopupRequestIdsRef.current[requestKey] = requestId;
      const token = await getToken();
      const response = await apiFetch(`/stripe/payment-methods/${paymentMethodId}/topup`, {
        method: "POST",
        token,
        body: {
          amount: numericAmount,
          billingDetails: normalizePaymentBillingDetails(topupBillingDetails),
          cardVerificationMode,
          requestId,
        },
      });

      const stripe = await portalStripePromise;
      if (!stripe) {
        throw new Error("Card checkout is not available right now. Please contact support.");
      }

      const result = await stripe.confirmCardPayment(response.clientSecret, {
        payment_method: paymentMethodId,
      });

      if (result.error) {
        await recordFailedPaymentIntent(result.error.payment_intent?.id);
        delete savedCardTopupRequestIdsRef.current[requestKey];
        throw createStripePaymentError(result.error, "The saved-card top-up could not be completed.");
      }

      if (!result.paymentIntent?.id) {
        throw new Error("Stripe confirmed the wallet top-up but did not return a payment intent ID.");
      }

      const finalization = await finalizeConfirmedStripeResource({
        paymentIntentId: result.paymentIntent.id,
      });
      await syncPortalPaymentsSafely();
      setInstantAmount("");
      setTopupBillingDetails(createEmptyPaymentBillingDetails());
      setBlockedSavedTopupCardId("");
      setActiveSection("overview");
      setSavedTopupState({
        savingId: "",
        error: "",
        message: finalization.completed
          ? response.message || "Your saved card was charged and the wallet balance has been refreshed."
          : "Your card was charged successfully. The wallet credit is synchronizing automatically—do not submit this payment again.",
      });
      delete savedCardTopupRequestIdsRef.current[requestKey];
      showToast({
        type: "success",
        action: "Wallet Top-up",
        title: finalization.completed ? "Wallet funded" : "Payment approved",
        description: finalization.completed
          ? response.message || "Your saved card was charged and the wallet balance has been refreshed."
          : "The wallet credit is synchronizing automatically. Do not submit the payment again.",
      });
      if (finalization.completed && returnUrl) {
        router.push(returnUrl);
      }
    } catch (error) {
      const normalizedError = normalizePaymentActionError(error);
      if (normalizedError.preventSameCardRetry) {
        setBlockedSavedTopupCardId(paymentMethodId);
      }
      if (String(normalizedError.redirectUrl || "").startsWith("/")) {
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

  async function handleWalletAutoTopupSave(event) {
    event.preventDefault();

    const amount = Number(autoTopupForm.amount || 0);
    const dayOfMonth = Math.trunc(Number(autoTopupForm.dayOfMonth || 0));

    if (!amount || amount < 1) {
      setAutoTopupState({ isSaving: false, message: "", error: "Enter a monthly top-up amount of at least $1.00." });
      return;
    }

    if (dayOfMonth < 1 || dayOfMonth > 31) {
      setAutoTopupState({ isSaving: false, message: "", error: "Choose a monthly billing date from 1 to 31." });
      return;
    }

    setAutoTopupState({ isSaving: true, message: "", error: "" });

    try {
      const token = await getToken();
      const response = await apiFetch("/stripe/wallet-auto-topup", {
        method: "PATCH",
        token,
        body: {
          enabled: true,
          amount,
          dayOfMonth,
        },
      });

      await syncPortalPayments();
      setAutoTopupState({
        isSaving: false,
        message: response.message || "Monthly wallet auto top-up has been scheduled.",
        error: "",
      });
      showToast({
        type: "success",
        action: "Wallet Auto Top-up",
        title: "Monthly top-up scheduled",
        description: response.message || "Monthly wallet auto top-up has been scheduled.",
      });
    } catch (error) {
      setAutoTopupState({
        isSaving: false,
        message: "",
        error: error.message || "Monthly wallet auto top-up could not be saved.",
      });
      showToast({
        type: "error",
        action: "Wallet Auto Top-up",
        title: "Schedule failed",
        description: error.message || "Monthly wallet auto top-up could not be saved.",
      });
    }
  }

  async function handleWalletAutoTopupDisable() {
    setAutoTopupState({ isSaving: true, message: "", error: "" });

    try {
      const token = await getToken();
      const response = await apiFetch("/stripe/wallet-auto-topup", {
        method: "PATCH",
        token,
        body: { enabled: false },
      });

      await syncPortalPayments();
      setAutoTopupState({
        isSaving: false,
        message: response.message || "Monthly wallet auto top-up has been disabled.",
        error: "",
      });
      showToast({
        type: "success",
        action: "Wallet Auto Top-up",
        title: "Monthly top-up disabled",
        description: response.message || "Monthly wallet auto top-up has been disabled.",
      });
    } catch (error) {
      setAutoTopupState({
        isSaving: false,
        message: "",
        error: error.message || "Monthly wallet auto top-up could not be disabled.",
      });
      showToast({
        type: "error",
        action: "Wallet Auto Top-up",
        title: "Update failed",
        description: error.message || "Monthly wallet auto top-up could not be disabled.",
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
        subtitle="One balance for order invoices, top-ups, renewals, and ElevenOrbits services."
        actions={
          <Button type="button" onClick={() => setActiveSection("instant-topup")}>
            <Plus className="h-4 w-4" />
            Add funds
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-[1680px] space-y-6 p-4 sm:p-6 md:p-8">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-panel sm:p-8">
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
                <p className="mt-2 break-words text-[clamp(2.35rem,12vw,3.75rem)] font-semibold tracking-[-0.05em]">{formatCurrency(walletBalance)}</p>
                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
                  Use wallet funds to pay a new order invoice in full or cover future renewals. Add exactly what you need, whenever you need it.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Button type="button" onClick={() => setActiveSection("instant-topup")} className="w-full sm:w-auto sm:min-w-[150px]">
                  <Plus className="h-4 w-4" />
                  Top up wallet
                </Button>
                <Button type="button" variant="ghost" onClick={() => setActiveSection("activity")} className="w-full border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white sm:w-auto">
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
                      <RefreshCw className="h-4 w-4" />
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
                          <StatusBadge status={submission.status} label={transactionStatusLabel(submission.status)} />
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

                  <form onSubmit={handleWalletAutoTopupSave} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-accent-600 ring-1 ring-slate-200">
                          <RefreshCw className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">Monthly wallet auto top-up</p>
                            {walletAutoTopup.enabled ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Active</span> : null}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Charge the primary saved card once each month and add the verified payment to your wallet.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 lg:text-right">
                        <span className="block font-semibold text-slate-950">Next run</span>
                        {formatScheduleDate(walletAutoTopup.nextRunAt)}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                      <div>
                        <label htmlFor="wallet-auto-topup-amount" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Monthly amount</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
                          <TextInput
                            id="wallet-auto-topup-amount"
                            type="number"
                            min="1"
                            step="0.01"
                            value={autoTopupForm.amount}
                            onChange={(event) => setAutoTopupForm((current) => ({ ...current, amount: event.target.value }))}
                            placeholder="50.00"
                            className="pl-8"
                            disabled={autoTopupState.isSaving}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="wallet-auto-topup-day" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Billing date</label>
                        <TextInput
                          id="wallet-auto-topup-day"
                          type="number"
                          min="1"
                          max="31"
                          step="1"
                          value={autoTopupForm.dayOfMonth}
                          onChange={(event) => setAutoTopupForm((current) => ({ ...current, dayOfMonth: event.target.value }))}
                          placeholder="1"
                          disabled={autoTopupState.isSaving}
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-500 sm:grid-cols-2">
                      <p>If a month has fewer days, the charge runs on that month's final day.</p>
                      <p>Each scheduled attempt is verified through Stripe and emailed to your account address.</p>
                    </div>

                    {walletAutoTopup.lastStatus ? (
                      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-950">Last check: {formatScheduleDate(walletAutoTopup.lastRunAt)}</p>
                          {walletAutoTopup.lastMessage ? <p className="mt-1 text-xs leading-5 text-slate-500">{walletAutoTopup.lastMessage}</p> : null}
                        </div>
                        <StatusBadge status={walletAutoTopup.lastStatus} />
                      </div>
                    ) : null}

                    {!primaryCard ? <p className="mt-4 text-sm font-medium text-amber-700">Save a primary card before enabling monthly wallet auto top-up.</p> : null}
                    {primaryCard && !contractApproved ? <p className="mt-4 text-sm font-medium text-amber-700">Monthly wallet auto top-up unlocks after your signed agreement is approved.</p> : null}
                    {autoTopupState.error ? <p className="mt-4 text-sm font-medium text-rose-600">{autoTopupState.error}</p> : null}
                    {autoTopupState.message ? <p className="mt-4 text-sm font-medium text-emerald-700">{autoTopupState.message}</p> : null}

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button type="submit" disabled={!primaryCard || !contractApproved || autoTopupState.isSaving}>
                        {autoTopupState.isSaving
                          ? "Saving..."
                          : walletAutoTopup.enabled
                            ? "Update monthly top-up"
                            : "Enable monthly top-up"}
                      </Button>
                      {walletAutoTopup.enabled ? (
                        <Button type="button" variant="ghost" disabled={autoTopupState.isSaving} onClick={handleWalletAutoTopupDisable}>
                          Disable monthly top-up
                        </Button>
                      ) : null}
                    </div>
                  </form>

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
                                  {card.is3DS ? <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] font-semibold text-sky-300">3D Secure</span> : null}
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
                <CardContent className="space-y-5">
                  {contractApproved ? (
                    <>
                      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                        <p className="font-semibold">Adaptive bank authentication</p>
                        <p className="mt-1 text-xs leading-5 text-sky-800">Stripe requests 3D Secure only when the bank, regulation, or risk checks require it. Cards without 3D Secure support remain eligible.</p>
                      </div>
                      <PortalCardForm
                        submitLabel={hasSavedCard ? "Add card" : "Save card"}
                        pendingLabel={hasSavedCard ? "Adding card..." : "Saving card..."}
                        note="Enter your card number, expiry, CVC, and postcode."
                        onSubmit={handleSaveCard}
                        showBillingDetails={false}
                        successTitle="Saved card added"
                        errorTitle="Saved card action failed"
                        actionLabel="Saved Card"
                      />
                    </>
                  ) : (
                    <ContractApprovalLock description="Saved-card setup is available after an ElevenOrbits administrator approves your signed agreement." />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {activeSection === "instant-topup" ? (
          <div className="space-y-5">
            {returnUrl ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-accent-200 bg-accent-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Top up for your order invoice</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Add the remaining balance here. After funding, you can return to checkout and pay the invoice from your wallet.
                  </p>
                </div>
                <Link href={returnUrl} className="inline-flex shrink-0">
                  <Button variant="ghost">
                    Return to checkout
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : null}

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

                <p className="text-xs leading-5 text-slate-500">Enter any positive amount and pay securely. Your bank decides whether the 3D Secure check uses an OTP, banking-app approval, or a frictionless flow.</p>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                <p className="font-semibold">Secure payment in this portal</p>
                <p className="mt-1 text-xs leading-5 text-sky-800">Enter your card here. Stripe.js keeps you in the ElevenOrbits portal while handling any required 3D Secure bank challenge.</p>
              </div>

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
                          <p className="mt-1 text-xs text-slate-500">{cardExpiryLabel(primaryCard)} · Stripe adaptive authentication</p>
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
                        className="w-full sm:w-auto sm:min-w-[190px]"
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
                      <CardDescription className="mt-1">Enter and authenticate your card securely without leaving the portal.</CardDescription>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Instant credit</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {contractApproved ? (
                    <PortalCardForm
                      disabled={!instantAmount || Number(instantAmount) <= 0}
                      billingDetails={newCardBillingDetails}
                      onBillingDetailsChange={setNewCardBillingDetails}
                      showBillingDetails
                      showSaveCardConsent
                      saveCardForFutureUse={saveCardForFutureUse}
                      onSaveCardForFutureUseChange={setSaveCardForFutureUse}
                      note="Your card details are collected securely by Stripe. If your bank requests OTP or app approval, the verification prompt will appear without leaving this portal."
                      onSubmit={handleNewCardTopup}
                      pendingLabel="Processing top-up..."
                      submitLabel={`Add ${formatCurrency(Number(instantAmount || 0))} to wallet`}
                      successTitle="Wallet top-up approved"
                      errorTitle="Wallet top-up failed"
                      actionLabel="Wallet Top-up"
                      preflightKey={instantAmount}
                    />
                  ) : (
                    <ContractApprovalLock description="Wallet card top-ups unlock after an ElevenOrbits administrator approves your signed agreement." />
                  )}
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        ) : null}

        {activeSection === "activity" ? (
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Payment activity</CardTitle>
                <CardDescription className="mt-1">A clear record of every payment charged by ElevenOrbits.</CardDescription>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-line bg-slate-50 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-card">
                  <History className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-slate-500">Charged by</p>
                  <p className="text-sm font-semibold text-slate-900">ElevenOrbits</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "All records", value: transactionCounts.all, icon: ReceiptText, tone: "text-slate-600 bg-slate-100" },
                  { label: "Completed", value: transactionCounts.successful, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
                  { label: "Processing", value: transactionCounts.pending, icon: Clock3, tone: "text-amber-600 bg-amber-50" },
                  { label: "Needs attention", value: transactionCounts.attention, icon: AlertCircle, tone: "text-rose-600 bg-rose-50" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl border border-line bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", item.tone)}><Icon className="h-4 w-4" /></span>
                        <span className="text-2xl font-semibold tracking-tight text-slate-950">{item.value}</span>
                      </div>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-line bg-slate-50 p-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative min-w-0 flex-1 lg:max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <TextInput
                    value={activitySearch}
                    onChange={(event) => setActivitySearch(event.target.value)}
                    placeholder="Search type, reference, or card"
                    aria-label="Search payment activity"
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "All"],
                    ["successful", "Completed"],
                    ["pending", "Processing"],
                    ["attention", "Needs attention"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setActivityFilter(value)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                        activityFilter === value ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      {label} <span className="ml-1 opacity-70">{transactionCounts[value]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden overflow-hidden rounded-xl border border-line md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-line whitespace-nowrap text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Transaction', 'Amount', 'Payment method', 'Status', 'Date', ''].map((label) => (
                          <th key={label} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {filteredSubmissions.length ? filteredSubmissions.map((submission) => (
                        <tr key={submission._id} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><ReceiptText className="h-4 w-4" /></span>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{submissionTypeLabel(submission.submissionType)}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{transactionReference(submission)} · {transactionStatusDetail(submission)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-950">{formatCurrency(submission.amount || submission.orderId?.totalAmount || 0)}</td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {submission.cardLast4 ? `${formatCardBrand(submission.cardBrand)} •••• ${submission.cardLast4}` : "Card payment"}
                          </td>
                          <td className="px-4 py-4"><StatusBadge status={submission.status} label={transactionStatusLabel(submission.status)} /></td>
                          <td className="px-4 py-4 text-sm text-slate-600">{formatActivityDate(submission.submittedAt)}</td>
                          <td className="px-4 py-4 text-right">
                            <button type="button" onClick={() => setSelectedTransactionId(submission._id)} className="inline-flex items-center gap-1 text-sm font-semibold text-accent-700 hover:text-accent-800">
                              Details <ChevronRight className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-sm font-medium text-slate-500">{paymentsQuery.isLoading ? "Loading activity..." : "No payment activity matches your filters."}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="divide-y divide-line overflow-hidden rounded-xl border border-line md:hidden">
                {filteredSubmissions.length ? filteredSubmissions.map((submission) => (
                  <button key={submission._id} type="button" onClick={() => setSelectedTransactionId(submission._id)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><ReceiptText className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-slate-900">{submissionTypeLabel(submission.submissionType)}</span><span className="text-sm font-semibold text-slate-950">{formatCurrency(submission.amount || submission.orderId?.totalAmount || 0)}</span></span>
                      <span className="mt-1 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-slate-500">{formatActivityDate(submission.submittedAt)}</span><StatusBadge status={submission.status} label={transactionStatusLabel(submission.status)} /></span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                )) : <p className="px-4 py-12 text-center text-sm font-medium text-slate-500">{paymentsQuery.isLoading ? "Loading activity..." : "No payment activity matches your filters."}</p>}
              </div>

              <p className="text-xs leading-5 text-slate-500">All amounts are shown in {paymentsData?.currency || "USD"} and payment card details are limited to the brand and last four digits.</p>
            </CardContent>
          </Card>
        ) : null}

        {selectedTransaction ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6" role="presentation" onClick={() => setSelectedTransactionId("")}>
            <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-panel sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Charged by ElevenOrbits</p>
                  <h2 id="transaction-detail-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{submissionTypeLabel(selectedTransaction.submissionType)}</h2>
                </div>
                <button type="button" onClick={() => setSelectedTransactionId("")} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close transaction details"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"><div><p className="text-2xl font-semibold tracking-tight text-slate-950">{formatCurrency(selectedTransaction.amount || selectedTransaction.orderId?.totalAmount || 0)}</p><p className="mt-1 text-xs text-slate-500">{formatActivityDate(selectedTransaction.submittedAt, true)}</p></div><StatusBadge status={selectedTransaction.status} label={transactionStatusLabel(selectedTransaction.status)} /></div>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Reference</dt><dd className="mt-1 break-all text-sm font-medium text-slate-800">{selectedTransaction.invoiceCode || selectedTransaction.gatewayPaymentId || "Not available"}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Payment method</dt><dd className="mt-1 text-sm font-medium text-slate-800">{selectedTransaction.cardLast4 ? `${formatCardBrand(selectedTransaction.cardBrand)} ending in ${selectedTransaction.cardLast4}` : "Card payment"}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status detail</dt><dd className="mt-1 text-sm font-medium text-slate-800">{transactionStatusDetail(selectedTransaction)}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Statement name</dt><dd className="mt-1 text-sm font-medium text-slate-800">{selectedTransaction.statementDescriptor || "ElevenOrbits"}</dd></div>
              </dl>
              {["failed", "rejected"].includes(String(selectedTransaction.status || "").toLowerCase()) ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p className="font-semibold">Why this needs attention</p><p className="mt-1 leading-6">{selectedTransaction.customerMessage || getStripePaymentErrorMessage({ ...selectedTransaction, status: selectedTransaction.status }, "The payment was declined and was not completed.")}</p></div> : null}
              <p className="mt-5 text-xs leading-5 text-slate-500">ElevenOrbits never asks you to share your full card number or bank verification code.</p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
