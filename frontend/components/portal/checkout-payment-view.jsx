"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge } from "@/lib/ui";
import { apiFetch } from "@/lib/api/client";
import { resolvePublicFileUrl } from "@/lib/api/file-url";
import { useCustomerQuery } from "@/lib/api/hooks";
import { formatCurrency, getBillingCycleLabel } from "@/lib/shared";
import { toStripeBillingDetails } from "@/lib/payments/billing-details";
import { createStripePaymentError } from "@/lib/payments/stripe-errors";
import { Topbar } from "@/components/shared/topbar";
import {
  CARD_VERIFICATION_MODE_3DS,
  CardVerificationModeSelector,
  PortalCardForm,
} from "@/components/portal/portal-card-form";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { ContractApprovalLock, isContractApprovedForPayments } from "@/components/portal/contract-approval-lock";
import { DeleteReasonModal } from "@/components/portal/delete-reason-modal";
import { OrderJourney } from "@/components/portal/order-journey";
import { ArrowRight, Wallet } from "lucide-react";

function formatCardBrand(brand) {
  const value = String(brand || "").trim();
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "Card";
}

function getPrimarySavedCard(user) {
  const savedCards = Array.isArray(user?.savedPaymentMethods) ? user.savedPaymentMethods : [];
  const primaryCard = savedCards.find((card) => card.isPrimary || String(card.id) === String(user?.defaultPaymentMethodId || ""));

  if (primaryCard) {
    return primaryCard;
  }

  if (user?.defaultPaymentMethodId) {
    return {
      id: user.defaultPaymentMethodId,
      brand: user.defaultPaymentMethodBrand || "",
      last4: user.defaultPaymentMethodLast4 || "",
    };
  }

  return null;
}

function savedCardLabel(user) {
  const primaryCard = getPrimarySavedCard(user);
  if (!primaryCard?.last4) {
    return "No saved card on file yet.";
  }

  return `${primaryCard.brandLabel || formatCardBrand(primaryCard.brand)} ending in ${primaryCard.last4}`;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function CheckoutPaymentView({ orderId }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { showToast } = useActionToast();
  const [state, setState] = useState({
    isSubmitting: false,
    action: "",
    message: "",
    error: "",
  });
  const [reasonAction, setReasonAction] = useState("");
  const [cardVerificationMode, setCardVerificationMode] = useState(CARD_VERIFICATION_MODE_3DS);

  const orderQuery = useCustomerQuery({
    queryKey: ["portal-order-checkout", orderId],
    path: `/orders/${orderId}`,
  });
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-profile"],
    path: "/profile/me",
  });
  const contractQuery = useCustomerQuery({
    queryKey: ["portal-contract-current"],
    path: "/contracts/current",
  });

  const order = orderQuery.data?.order;
  const invoice = orderQuery.data?.invoice;
  const subscription = orderQuery.data?.subscription;
  const profile = profileQuery.data?.user;
  const contractStatus = contractQuery.data?.contract?.status || contractQuery.data?.status || "NOT_STARTED";
  const contractApproved = isContractApprovedForPayments(contractStatus);
  const lineItems = order?.lineItems || [];
  const isTrialRequested = Boolean(order?.metadata?.trialRequested);
  const isCancelled = order?.status === "cancelled" || subscription?.status === "cancelled";
  const isRejected = order?.status === "rejected" || subscription?.status === "rejected" || invoice?.status === "refunded";
  const isPaid = !isTrialRequested && (invoice?.status === "paid" || order?.status === "approved");
  const canTriggerPayments = Boolean(order) && !isTrialRequested && !isPaid && !isCancelled && !isRejected && contractApproved;
  const canCancelOrder = Boolean(order) && !isPaid && !["cancelled", "deleted", "rejected"].includes(order.status);
  const canDeleteOrder = order?.status === "cancelled";
  const invoiceFileUrl = resolvePublicFileUrl(invoice?.pdfUrl);
  const refetchOrder = orderQuery.refetch;
  const refetchProfile = profileQuery.refetch;
  const customerNote = String(order?.metadata?.customerNote || "").trim();

  const totalDue = useMemo(() => (isTrialRequested ? 0 : Number(invoice?.amount || order?.totalAmount || 0)), [invoice?.amount, isTrialRequested, order?.totalAmount]);
  const walletBalance = Number(profile?.accountBalance || 0);
  const walletShortfall = Math.max(totalDue - walletBalance, 0);
  const canPayWithWallet = Boolean(invoice?._id) && canTriggerPayments && walletBalance >= totalDue;

  async function syncOrderState() {
    await Promise.all([refetchOrder(), refetchProfile()]);
    await wait(1200);
    await Promise.all([refetchOrder(), refetchProfile()]);
  }

  async function handleWalletPayment() {
    if (!canPayWithWallet || state.isSubmitting) return;

    setState({ isSubmitting: true, action: "wallet", message: "", error: "" });
    try {
      const token = await getToken();
      const response = await apiFetch(`/invoices/${invoice._id}/pay-with-wallet`, {
        method: "POST",
        token,
      });
      showToast({
        type: "success",
        action: "Advance payment",
        title: "Invoice paid from wallet",
        description: response.message || "Your advance payment was received and the service request is pending review.",
      });
      await syncOrderState();
      router.replace(`/portal/checkout/${orderId}/thank-you`);
    } catch (paymentError) {
      setState({
        isSubmitting: false,
        action: "",
        message: "",
        error: paymentError.message || "The invoice could not be paid from your wallet.",
      });
      showToast({
        type: "error",
        action: "Advance payment",
        title: "Wallet payment failed",
        description: paymentError.message || "The invoice could not be paid from your wallet.",
      });
    }
  }

  async function handleCardPayment({ stripe, cardElement, billingDetails }) {
    let response;
    try {
      const token = await getToken();
      response = await apiFetch("/stripe/intents", {
        method: "POST",
        token,
        body: {
          type: "order_payment",
          orderId,
          billingDetails,
          cardVerificationMode,
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
        billing_details: toStripeBillingDetails(billingDetails),
      },
    });

    if (result.error) {
      throw createStripePaymentError(result.error);
    }

    if (!result.paymentIntent?.id) {
      throw new Error("Stripe confirmed the payment but did not return a payment intent ID.");
    }

    let finalized = false;
    for (let attempt = 0; attempt < 2 && !finalized; attempt += 1) {
      try {
        const token = await getToken({ skipCache: true });
        await apiFetch("/stripe/finalize", {
          method: "POST",
          token,
          body: {
            paymentIntentId: result.paymentIntent.id,
          },
        });
        finalized = true;
      } catch {
        if (attempt === 0) {
          await wait(500);
        }
      }
    }

    if (!finalized) {
      const pendingError = new Error(
        "Your card was charged successfully, but the order update is still synchronizing. Do not submit this payment again; open Payment Activity after signing in again.",
      );
      pendingError.preventSameCardRetry = true;
      throw pendingError;
    }

    await syncOrderState();
    router.replace(`/portal/checkout/${orderId}/thank-you`);
    return "Your advance payment was received. The request is now pending review.";
  }

  async function handleCardPreflight({ billingDetails }) {
    const token = await getToken();
    return apiFetch("/stripe/preflight", {
      method: "POST",
      token,
      body: {
        type: "order_payment",
        orderId,
        billingDetails,
        cardVerificationMode,
      },
    });
  }

  async function handleOrderCancel(reason) {
    if (!orderId || state.isSubmitting) {
      return;
    }

    setState((current) => ({
      ...current,
      isSubmitting: true,
      action: "cancel",
      message: "",
      error: "",
    }));

    try {
      const token = await getToken();
      const response = await apiFetch(`/orders/${orderId}/cancel`, {
        method: "POST",
        token,
        body: { reason },
      });

      setState((current) => ({
        ...current,
        isSubmitting: false,
        action: "",
        message: response.message || "The order has been cancelled.",
        error: "",
      }));
      showToast({
        type: "info",
        action: "Order",
        title: "Order cancelled",
        description: response.message || "The order has been cancelled.",
      });
      await refetchOrder();
      setReasonAction("");
    } catch (error) {
      setState((current) => ({
        ...current,
        isSubmitting: false,
        action: "",
        message: "",
        error: error.message || "The order could not be cancelled.",
      }));
      showToast({
        type: "error",
        action: "Order",
        title: "Cancellation failed",
        description: error.message || "The order could not be cancelled.",
      });
    }
  }

  async function handleOrderDelete(reason) {
    if (!orderId || state.isSubmitting) {
      return;
    }

    setState((current) => ({
      ...current,
      isSubmitting: true,
      action: "delete",
      message: "",
      error: "",
    }));

    try {
      const token = await getToken();
      const response = await apiFetch(`/orders/${orderId}`, {
        method: "DELETE",
        token,
        body: { reason },
      });

      setState((current) => ({
        ...current,
        isSubmitting: false,
        action: "",
        message: response.message || "The order has been deleted.",
        error: "",
      }));
      showToast({
        type: "info",
        action: "Order",
        title: "Order deleted",
        description: response.message || "The order has been deleted.",
      });
      setReasonAction("");
      router.push("/portal/services");
    } catch (error) {
      setState((current) => ({
        ...current,
        isSubmitting: false,
        action: "",
        message: "",
        error: error.message || "The order could not be deleted.",
      }));
      showToast({
        type: "error",
        action: "Order",
        title: "Delete failed",
        description: error.message || "The order could not be deleted.",
      });
    }
  }

  if (orderQuery.isLoading) {
    return <PageLoader title="Checkout & Payment" subtitle="Loading order details..." cardCount={2} lines={4} />;
  }

  if (!order) {
    return (
      <div>
        <Topbar title="Checkout & Payment" subtitle="Order not found." />
      </div>
    );
  }

  return (
    <div>
      <Topbar
        title="Secure Checkout"
        subtitle="Confirm the order and complete payment. The ElevenOrbits team will review and provision your managed service after approval."
      />
      <div className="mx-auto w-full max-w-[1680px] px-6 pt-6 md:px-8 md:pt-8">
        <OrderJourney current="payment" />
      </div>
      <div className="mx-auto grid w-full max-w-[1680px] gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Selected Plan Summary</CardTitle>
            <CardDescription>{order.productPlanId?.name || "Pending order details"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Total Due</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(totalDue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Invoice</p>
                <p className="mt-2 font-semibold text-slate-950">{invoice?.invoiceNumber || "Generating..."}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Status</p>
                <div className="mt-2">
                  <StatusBadge status={subscription?.status || order.status || "pending_verification"} />
                </div>
              </div>
            </div>

            {lineItems.length ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Included Charges</p>
                <div className="mt-4 space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-950">{item.label}</p>
                        <p className="text-sm text-slate-500">
                          {subscription?.billingCycle ? `${getBillingCycleLabel(subscription.billingCycle)} billing` : "Managed service"}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-950">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {customerNote ? (
              <div className="rounded-xl border border-line bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Deployment Note</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{customerNote}</p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
              This checkout is an advance payment for the requested service. ElevenOrbits reviews the request before provisioning. Approved requests are prepared and published in your portal; requests that cannot be approved are refunded through the original payment source.
            </div>

            <div className="rounded-xl border border-line bg-white p-5">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {isTrialRequested ? "Trial Request" : "Advance Payment"}
                  </p>
                  <p className="mt-4 text-2xl font-semibold tracking-[-0.025em] text-slate-950">{formatCurrency(totalDue)}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {isTrialRequested
                      ? "No payment is due today. ElevenOrbits will review the 3-day trial request and follow up before activation."
                      : contractApproved
                      ? "Pay the order invoice now by wallet or card. The payment is held as an advance while ElevenOrbits reviews the request. If approved, provisioning begins; if rejected, the payment is returned."
                      : "This order is ready for review, but payment remains locked until an ElevenOrbits administrator approves your signed agreement."}
                  </p>
                  {!isTrialRequested ? (
                    <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <div className="flex items-center justify-between gap-4">
                        <span>Wallet balance</span>
                        <span className="font-semibold text-slate-950">{formatCurrency(walletBalance)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Saved card</span>
                        <span className="text-right font-semibold text-slate-950">{savedCardLabel(profile)}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div>
                  {isCancelled ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                      This order has been cancelled and is no longer billable.
                    </div>
                  ) : isRejected ? (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm font-medium text-sky-800">
                      This request was not approved. Any collected advance payment has been returned to the original card or wallet balance.
                    </div>
                  ) : isTrialRequested ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700">
                      3-day trial requested. Payment is not required at checkout.
                    </div>
                  ) : isPaid ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700">
                      Advance payment received. Your request is awaiting legitimacy and provisioning review. If it cannot be approved, the payment will be refunded.
                    </div>
                  ) : !contractApproved ? (
                    <ContractApprovalLock description="Your signed agreement was received. An ElevenOrbits administrator must approve it before wallet or card payment is available for this order." />
                  ) : (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 ring-1 ring-slate-200">
                            <Wallet className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-950">Pay from wallet</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Wallet top-ups can be used to settle this order invoice in full.
                            </p>
                          </div>
                        </div>
                        {canPayWithWallet ? (
                          <Button className="mt-4 w-full" type="button" disabled={state.isSubmitting} onClick={handleWalletPayment}>
                            <Wallet className="h-4 w-4" />
                            {state.isSubmitting && state.action === "wallet" ? "Paying from wallet..." : `Pay ${formatCurrency(totalDue)} from wallet`}
                          </Button>
                        ) : (
                          <div className="mt-4">
                            <p className="text-xs font-medium text-amber-700">Add {formatCurrency(walletShortfall)} more to cover this invoice.</p>
                            <Link
                              href={`/portal/payments?section=instant-topup&amount=${walletShortfall.toFixed(2)}&return_url=${encodeURIComponent(`/portal/checkout/${orderId}`)}`}
                              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 hover:text-accent-800"
                            >
                              Top up wallet
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        <span className="h-px flex-1 bg-slate-200" />
                        Or pay by card
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>

                      <CardVerificationModeSelector
                        value={cardVerificationMode}
                        onChange={setCardVerificationMode}
                        disabled={!canTriggerPayments || state.isSubmitting}
                      />

                      <PortalCardForm
                        disabled={!canTriggerPayments || state.isSubmitting}
                        submitLabel="Pay advance by Card"
                        pendingLabel={cardVerificationMode === CARD_VERIFICATION_MODE_3DS ? "Waiting for 3D Secure verification..." : "Processing card payment..."}
                        onSubmit={handleCardPayment}
                        note={cardVerificationMode === CARD_VERIFICATION_MODE_3DS
                          ? "3D Secure is requested for this charge. Enter the cardholder's billing details; the portal account email is not used."
                          : "Stripe will use standard processing and request authentication only when required. Enter the cardholder's billing details; the portal account email is not used."}
                        successTitle="Advance payment completed"
                        errorTitle="Card payment failed"
                        actionLabel="Order Advance Payment"
                        onPreflight={handleCardPreflight}
                        preflightKey={`${orderId}:${cardVerificationMode}`}
                      />
                    </div>
                  )}
                </div>
              </div>
              {state.message ? <p className="mt-4 text-sm font-medium text-emerald-700">{state.message}</p> : null}
              {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {canCancelOrder ? (
                  <Button type="button" variant="ghost" disabled={state.isSubmitting} onClick={() => setReasonAction("cancel")}>
                    Cancel Order
                  </Button>
                ) : null}
                {canDeleteOrder ? (
                  <Button type="button" variant="ghost" disabled={state.isSubmitting} onClick={() => setReasonAction("delete")}>
                    Delete Order
                  </Button>
                ) : null}
                {invoiceFileUrl ? (
                  <Link href={invoiceFileUrl} target="_blank">
                    <Button variant="ghost" type="button">Open Invoice PDF</Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Billing Snapshot</CardTitle>
            <CardDescription>Checkout status, renewal behavior, and invoice access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Billing Cycle</span>
              <span className="font-semibold text-slate-900">
                {getBillingCycleLabel(subscription?.billingCycle || order.billingCycle)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Renewal Strategy</span>
              <span className="text-right font-semibold text-slate-900">
                {isTrialRequested ? "Starts after trial approval" : "Wallet available for invoices and renewals"}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              Wallet top-ups can pay this order invoice and future renewal invoices. After service approval, renewals check wallet balance first and may use the saved card as a fallback.
            </div>
            <Link href="/portal/payments">
              <Button variant="ghost">Manage Wallet & Saved Card</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <DeleteReasonModal
        open={reasonAction === "cancel"}
        title="Cancel order"
        subtitle={`Cancel ${order?.productPlanId?.name || "this order"}? Any unpaid invoice attached to it will be voided.`}
        confirmLabel="Cancel order"
        reasonLabel="Reason for cancellation"
        otherLabel="Please describe the cancellation reason"
        isDeleting={state.isSubmitting && state.action === "cancel"}
        onConfirm={handleOrderCancel}
        onClose={() => !state.isSubmitting && setReasonAction("")}
      />
      <DeleteReasonModal
        open={reasonAction === "delete"}
        title="Delete cancelled order"
        subtitle={`Remove ${order?.productPlanId?.name || "this order"} from your portal history? This action cannot be undone.`}
        confirmLabel="Delete order"
        reasonLabel="Reason for deletion"
        otherLabel="Please describe the deletion reason"
        isDeleting={state.isSubmitting && state.action === "delete"}
        onConfirm={handleOrderDelete}
        onClose={() => !state.isSubmitting && setReasonAction("")}
      />
    </div>
  );
}
