"use client";

import { useId, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button, TextInput } from "@/lib/ui";
import {
  createEmptyPaymentBillingDetails,
  getPaymentBillingDetailsValidationError,
  normalizePaymentBillingDetails,
} from "@/lib/payments/billing-details";
import { normalizePaymentActionError } from "@/lib/payments/stripe-errors";
import { useActionToast } from "@/components/shared/feedback-layer";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
export const portalStripePromise = publishableKey ? loadStripe(publishableKey) : null;

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
          <TextInput id={`${id}-phone`} type="tel" autoComplete="tel" value={value.phone} disabled={disabled} onChange={(event) => updateField("phone", event.target.value)} placeholder="+1 813 555 0199" />
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
  const resolvedBillingDetails = billingDetails || internalBillingDetails;
  const setResolvedBillingDetails = onBillingDetailsChange || setInternalBillingDetails;

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

    setState({
      isSubmitting: true,
      message: "",
      error: "",
    });

    try {
      const message = await onSubmit({
        stripe,
        cardElement,
        billingDetails: normalizePaymentBillingDetails(resolvedBillingDetails),
      });

      cardElement.clear();
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
        <PaymentBillingDetailsFields value={resolvedBillingDetails} onChange={setResolvedBillingDetails} disabled={state.isSubmitting} />
      ) : null}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Card details</label>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-200">
          <CardElement
            options={cardElementOptions}
            onChange={(event) => {
              setCardState({
                complete: event.complete,
                error: event.error?.message || "",
                retryLocked: false,
              });
              if (event.error) {
                setState((current) => ({ ...current, error: event.error.message }));
              }
            }}
          />
        </div>
      </div>
      {cardState.retryLocked ? <p className="text-sm font-medium text-amber-700">Change the card details before retrying.</p> : null}
      {note ? <p className="text-sm leading-6 text-slate-600">{note}</p> : null}
      {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
      {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
      <Button className="w-full" type="submit" disabled={disabled || state.isSubmitting || !stripe || !cardState.complete || cardState.retryLocked}>
        {state.isSubmitting ? pendingLabel : cardState.retryLocked ? "Change Card to Retry" : submitLabel}
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
      />
    </Elements>
  );
}
