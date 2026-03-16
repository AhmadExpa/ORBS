"use client";

import { useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/lib/ui";
import { useActionToast } from "@/components/shared/feedback-layer";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const cardElementOptions = {
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

function PortalCardFormInner({
  disabled = false,
  note = "",
  onSubmit,
  pendingLabel,
  submitLabel,
  successTitle = "Card action completed",
  errorTitle = "Card action failed",
  actionLabel = "Payments",
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { showToast } = useActionToast();
  const [state, setState] = useState({
    isSubmitting: false,
    message: "",
    error: "",
  });

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

    setState({
      isSubmitting: true,
      message: "",
      error: "",
    });

    try {
      const message = await onSubmit({
        stripe,
        cardElement,
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
      setState({
        isSubmitting: false,
        message: "",
        error: error.message || "The card action could not be completed.",
      });
      showToast({
        type: "error",
        action: actionLabel,
        title: errorTitle,
        description: error.message || "The card action could not be completed.",
      });
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Card details</label>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-200">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      {note ? <p className="text-sm leading-6 text-slate-600">{note}</p> : null}
      {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
      {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
      <Button className="w-full" type="submit" disabled={disabled || state.isSubmitting || !stripe}>
        {state.isSubmitting ? pendingLabel : submitLabel}
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
}) {
  if (!stripePromise) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        Card checkout is not available right now. Please use the manual payment option until it is configured.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PortalCardFormInner
        disabled={disabled}
        note={note}
        onSubmit={onSubmit}
        pendingLabel={pendingLabel}
        submitLabel={submitLabel}
        successTitle={successTitle}
        errorTitle={errorTitle}
        actionLabel={actionLabel}
      />
    </Elements>
  );
}
