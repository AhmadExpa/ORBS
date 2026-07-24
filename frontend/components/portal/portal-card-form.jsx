"use client";

import { useEffect, useId, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { AlertTriangle, CheckCircle2, CircleHelp, CreditCard, ShieldCheck, XCircle } from "lucide-react";
import { Button, TextInput, cn } from "@/lib/ui";
import {
  createEmptyPaymentBillingDetails,
  getPaymentBillingDetailsValidationError,
  normalizePaymentBillingDetails,
} from "@/lib/payments/billing-details";
import { normalizePaymentActionError } from "@/lib/payments/stripe-errors";
import { useActionToast } from "@/components/shared/feedback-layer";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
export const portalStripePromise = publishableKey ? loadStripe(publishableKey) : null;
export const CARD_VERIFICATION_MODE_STANDARD = "standard";
export const CARD_VERIFICATION_MODE_3DS = "three_d_secure";

const cardElementOptions = {
  hidePostalCode: true,
  style: {
    base: {
      color: "#0f172a",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      fontSize: "14px",
      lineHeight: "20px",
      iconColor: "#64748b",
      "::placeholder": {
        color: "#94a3b8",
      },
    },
    invalid: {
      color: "#dc2626",
      iconColor: "#dc2626",
    },
  },
};

const verificationModes = [
  {
    value: CARD_VERIFICATION_MODE_STANDARD,
    title: "Standard processing",
    badge: "Faster",
    description: "Stripe requests 3D Secure only when the bank, regulation, or risk checks require it.",
    icon: CreditCard,
  },
  {
    value: CARD_VERIFICATION_MODE_3DS,
    title: "Request 3D Secure",
    badge: "Extra verification",
    description: "Request an authentication challenge from the cardholder's bank whenever supported.",
    icon: ShieldCheck,
  },
];

export function CardVerificationModeSelector({
  value = CARD_VERIFICATION_MODE_3DS,
  onChange,
  disabled = false,
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-semibold text-slate-950">Card verification</legend>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Choose how Stripe should process this charge. Standard processing never bypasses authentication required by the bank or applicable regulation.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Card verification mode">
        {verificationModes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = value === mode.value;

          return (
            <button
              key={mode.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(mode.value)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                isSelected
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <span className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    isSelected ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-950">{mode.title}</span>
                    <span className={cn("text-[10px] font-semibold uppercase tracking-[0.12em]", isSelected ? "text-brand-700" : "text-slate-400")}>
                      {mode.badge}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{mode.description}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PaymentReadinessReport({ report }) {
  if (!report) return null;

  const summary = {
    clear: {
      icon: CheckCircle2,
      label: "Ready to confirm",
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      iconClassName: "text-emerald-700",
    },
    caution: {
      icon: AlertTriangle,
      label: "Review warnings",
      className: "border-amber-200 bg-amber-50 text-amber-950",
      iconClassName: "text-amber-700",
    },
    blocked: {
      icon: XCircle,
      label: "Action required",
      className: "border-rose-200 bg-rose-50 text-rose-950",
      iconClassName: "text-rose-700",
    },
  }[report.riskLevel] || {
    icon: CircleHelp,
    label: "Readiness checked",
    className: "border-slate-200 bg-slate-50 text-slate-900",
    iconClassName: "text-slate-600",
  };
  const SummaryIcon = summary.icon;
  const checkStyles = {
    passed: { icon: CheckCircle2, iconClassName: "text-emerald-600", label: "Passed" },
    warning: { icon: AlertTriangle, iconClassName: "text-amber-600", label: "Warning" },
    failed: { icon: XCircle, iconClassName: "text-rose-600", label: "Failed" },
    info: { icon: CircleHelp, iconClassName: "text-sky-600", label: "Information" },
  };

  return (
    <section className={cn("rounded-2xl border p-4", summary.className)} aria-live="polite">
      <div className="flex items-start gap-3">
        <SummaryIcon className={cn("mt-0.5 h-5 w-5 shrink-0", summary.iconClassName)} />
        <div>
          <p className="text-sm font-semibold">{summary.label}</p>
          <p className="mt-1 text-xs leading-5 opacity-80">{report.headline}</p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-black/5 rounded-xl border border-black/5 bg-white/75 px-3">
        {(report.checks || []).map((check) => {
          const style = checkStyles[check.status] || checkStyles.info;
          const CheckIcon = style.icon;

          return (
            <div key={check.id} className="flex items-start gap-3 py-3">
              <CheckIcon className={cn("mt-0.5 h-4 w-4 shrink-0", style.iconClassName)} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{check.label}</p>
                  <span className={cn("text-[10px] font-semibold uppercase tracking-[0.12em]", style.iconClassName)}>
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">{check.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-5 opacity-75">
        {report.disclaimer || "Readiness checks reduce preventable errors but cannot guarantee bank approval."}
      </p>
    </section>
  );
}

export function PaymentBillingDetailsFields({ value, onChange, disabled = false }) {
  const id = useId().replace(/:/gu, "");

  function updateField(field, fieldValue) {
    onChange({
      ...value,
      [field]: field === "country" ? fieldValue.toUpperCase() : fieldValue,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="mb-2 block text-sm font-medium text-slate-700">Cardholder name</label>
          <TextInput id={`${id}-name`} autoComplete="cc-name" value={value.name} disabled={disabled} onChange={(event) => updateField("name", event.target.value)} placeholder="Full name on card" />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="mb-2 block text-sm font-medium text-slate-700">Payment email</label>
          <TextInput id={`${id}-email`} type="email" autoComplete="email" value={value.email} disabled={disabled} onChange={(event) => updateField("email", event.target.value)} placeholder="cardholder@example.com" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
        <div>
          <label htmlFor={`${id}-phone`} className="mb-2 block text-sm font-medium text-slate-700">Phone number</label>
          <TextInput id={`${id}-phone`} type="tel" inputMode="tel" autoComplete="tel" value={value.phone} disabled={disabled} onChange={(event) => updateField("phone", event.target.value)} placeholder="+14155552671" />
          <p className="mt-1.5 text-xs text-slate-500">Include + and the country calling code.</p>
        </div>
        <div>
          <label htmlFor={`${id}-country`} className="mb-2 block text-sm font-medium text-slate-700">Country code</label>
          <TextInput id={`${id}-country`} autoComplete="country" maxLength={2} value={value.country} disabled={disabled} onChange={(event) => updateField("country", event.target.value)} placeholder="US" />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-line1`} className="mb-2 block text-sm font-medium text-slate-700">Billing address</label>
        <TextInput id={`${id}-line1`} autoComplete="address-line1" value={value.line1} disabled={disabled} onChange={(event) => updateField("line1", event.target.value)} placeholder="Street address" />
      </div>

      <div>
        <label htmlFor={`${id}-line2`} className="mb-2 block text-sm font-medium text-slate-700">Apartment, suite, or unit <span className="font-normal text-slate-400">(optional)</span></label>
        <TextInput id={`${id}-line2`} autoComplete="address-line2" value={value.line2} disabled={disabled} onChange={(event) => updateField("line2", event.target.value)} placeholder="Apartment, suite, or unit" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor={`${id}-city`} className="mb-2 block text-sm font-medium text-slate-700">City</label>
          <TextInput id={`${id}-city`} autoComplete="address-level2" value={value.city} disabled={disabled} onChange={(event) => updateField("city", event.target.value)} placeholder="City" />
        </div>
        <div>
          <label htmlFor={`${id}-state`} className="mb-2 block text-sm font-medium text-slate-700">State / region</label>
          <TextInput id={`${id}-state`} autoComplete="address-level1" value={value.state} disabled={disabled} onChange={(event) => updateField("state", event.target.value)} placeholder="State or region" />
        </div>
        <div>
          <label htmlFor={`${id}-postal`} className="mb-2 block text-sm font-medium text-slate-700">Postal code</label>
          <TextInput id={`${id}-postal`} autoComplete="postal-code" value={value.postalCode} disabled={disabled} onChange={(event) => updateField("postalCode", event.target.value)} placeholder="Postal code" />
        </div>
      </div>
    </div>
  );
}

function PortalCardFormInner({
  disabled = false,
  note = "",
  onSubmit,
  pendingLabel,
  submitLabel,
  successTitle = "Card action completed",
  errorTitle = "Card action failed",
  actionLabel = "Payments",
  billingDetails,
  onBillingDetailsChange,
  showBillingDetails = true,
  onPreflight,
  preflightKey = "",
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { showToast } = useActionToast();
  const [state, setState] = useState({
    isSubmitting: false,
    message: "",
    error: "",
  });
  const [cardState, setCardState] = useState({
    complete: false,
    error: "",
    retryLocked: false,
  });
  const [internalBillingDetails, setInternalBillingDetails] = useState(createEmptyPaymentBillingDetails);
  const [preflightReport, setPreflightReport] = useState(null);
  const [isPreflightRunning, setIsPreflightRunning] = useState(false);
  const resolvedBillingDetails = billingDetails || internalBillingDetails;
  const setResolvedBillingDetails = onBillingDetailsChange || setInternalBillingDetails;

  useEffect(() => {
    setPreflightReport(null);
    setState((current) => ({ ...current, message: "" }));
  }, [preflightKey]);

  function updateBillingDetails(nextValue) {
    setResolvedBillingDetails(nextValue);
    setPreflightReport(null);
    setState((current) => ({ ...current, message: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!stripe || !elements) {
      setState({
        isSubmitting: false,
        message: "",
        error: "Card checkout is still loading. Please wait a moment and try again.",
      });
      showToast({
        type: "warning",
        action: actionLabel,
        title: errorTitle,
        description: "Card checkout is still loading. Please wait a moment and try again.",
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setState({
        isSubmitting: false,
        message: "",
        error: "Card input is not ready yet. Please try again.",
      });
      showToast({
        type: "warning",
        action: actionLabel,
        title: errorTitle,
        description: "Card input is not ready yet. Please try again.",
      });
      return;
    }

    if (!cardState.complete) {
      const message = cardState.error || "Complete the card number, expiry date, CVC, and postal code before continuing.";
      setState({ isSubmitting: false, message: "", error: message });
      return;
    }

    const billingError = getPaymentBillingDetailsValidationError(resolvedBillingDetails);
    if (billingError) {
      setState({ isSubmitting: false, message: "", error: billingError });
      return;
    }

    if (cardState.retryLocked) {
      setState({ isSubmitting: false, message: "", error: "Change the card details before trying this payment again." });
      return;
    }

    const normalizedBillingDetails = normalizePaymentBillingDetails(resolvedBillingDetails);
    if (onPreflight && !preflightReport?.canProceed) {
      setIsPreflightRunning(true);
      setState({ isSubmitting: false, message: "", error: "" });
      try {
        const remoteReport = await onPreflight({
          billingDetails: normalizedBillingDetails,
          cardComplete: cardState.complete,
        });
        const report = {
          ...remoteReport,
          checks: [
            ...(remoteReport?.checks || []),
            {
              id: "card-details",
              label: "Card details",
              status: "passed",
              detail: "The card number, expiry date, and security code fields are complete.",
            },
          ],
        };
        setPreflightReport(report);
        setState({
          isSubmitting: false,
          message: report.canProceed ? "Readiness checks completed. Review the results, then confirm the charge." : "",
          error: report.canProceed ? "" : report.headline || "Resolve the failed checks before charging the card.",
        });
      } catch (error) {
        const normalizedError = normalizePaymentActionError(error);
        setState({
          isSubmitting: false,
          message: "",
          error: normalizedError.message || "The pre-charge checks could not be completed.",
        });
      } finally {
        setIsPreflightRunning(false);
      }
      return;
    }

    setState({
      isSubmitting: true,
      message: "",
      error: "",
    });

    try {
      const message = await onSubmit({
        stripe,
        cardElement,
        billingDetails: normalizedBillingDetails,
      });

      cardElement.clear();
      setPreflightReport(null);
      setState({
        isSubmitting: false,
        message: message || "",
        error: "",
      });
      showToast({
        type: "success",
        action: actionLabel,
        title: successTitle,
        description: message || "The card action finished successfully.",
      });
    } catch (error) {
      const normalizedError = normalizePaymentActionError(error);
      setCardState((current) => ({
        ...current,
        retryLocked: Boolean(normalizedError.preventSameCardRetry),
      }));
      setState({
        isSubmitting: false,
        message: "",
        error: normalizedError.message || "The card action could not be completed.",
      });
      showToast({
        type: "error",
        action: actionLabel,
        title: errorTitle,
        description: normalizedError.message || "The card action could not be completed.",
      });
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {showBillingDetails ? (
        <PaymentBillingDetailsFields value={resolvedBillingDetails} onChange={updateBillingDetails} disabled={state.isSubmitting || isPreflightRunning} />
      ) : null}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Card details</label>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-200">
          <CardElement
            options={cardElementOptions}
            onChange={(event) => {
              setPreflightReport(null);
              setState((current) => ({
                ...current,
                message: "",
                error: event.error?.message || "",
              }));
              setCardState({
                complete: event.complete,
                error: event.error?.message || "",
                retryLocked: false,
              });
            }}
          />
        </div>
      </div>
      {cardState.retryLocked ? <p className="text-sm font-medium text-amber-700">Change the card details before retrying.</p> : null}
      <PaymentReadinessReport report={preflightReport} />
      {note ? <p className="text-sm leading-6 text-slate-600">{note}</p> : null}
      {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
      {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
      <Button className="w-full" type="submit" disabled={disabled || state.isSubmitting || isPreflightRunning || !stripe || !cardState.complete || cardState.retryLocked}>
        {isPreflightRunning
          ? "Running pre-charge checks..."
          : state.isSubmitting
            ? pendingLabel
            : cardState.retryLocked
              ? "Change Card to Retry"
              : onPreflight
                ? preflightReport?.canProceed
                  ? `Confirm · ${submitLabel}`
                  : preflightReport
                    ? "Run checks again"
                    : "Check before charging"
                : submitLabel}
      </Button>
    </form>
  );
}

export function PortalCardForm({
  disabled = false,
  note = "",
  onSubmit,
  pendingLabel,
  submitLabel,
  successTitle,
  errorTitle,
  actionLabel,
  billingDetails,
  onBillingDetailsChange,
  showBillingDetails = true,
  onPreflight,
  preflightKey,
}) {
  if (!portalStripePromise) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        Card checkout is not available right now. Please contact support so we can finish payment configuration.
      </div>
    );
  }

  return (
    <Elements stripe={portalStripePromise}>
      <PortalCardFormInner
        disabled={disabled}
        note={note}
        onSubmit={onSubmit}
        pendingLabel={pendingLabel}
        submitLabel={submitLabel}
        successTitle={successTitle}
        errorTitle={errorTitle}
        actionLabel={actionLabel}
        billingDetails={billingDetails}
        onBillingDetailsChange={onBillingDetailsChange}
        showBillingDetails={showBillingDetails}
        onPreflight={onPreflight}
        preflightKey={preflightKey}
      />
    </Elements>
  );
}
