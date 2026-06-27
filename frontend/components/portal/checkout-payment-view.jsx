"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge } from "@/lib/ui";
import { apiFetch } from "@/lib/api/client";
import { resolvePublicFileUrl } from "@/lib/api/file-url";
import { useCustomerQuery } from "@/lib/api/hooks";
import { formatCurrency } from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";
import { PortalCardForm } from "@/components/portal/portal-card-form";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";

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

  const orderQuery = useCustomerQuery({
    queryKey: ["portal-order-checkout", orderId],
    path: `/orders/${orderId}`,
  });
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-order-checkout-profile"],
    path: "/profile/me",
  });

  const order = orderQuery.data?.order;
  const invoice = orderQuery.data?.invoice;
  const subscription = orderQuery.data?.subscription;
  const profile = profileQuery.data?.user;
  const lineItems = order?.lineItems || [];
  const isCancelled = order?.status === "cancelled" || subscription?.status === "cancelled";
  const isPaid = invoice?.status === "paid" || order?.status === "approved";
  const canTriggerPayments = Boolean(order) && !isPaid && !isCancelled;
  const canCancelOrder = order?.status === "approved" && invoice?.status === "paid" && !isCancelled;
  const invoiceFileUrl = resolvePublicFileUrl(invoice?.pdfUrl);
  const refetchOrder = orderQuery.refetch;
  const refetchProfile = profileQuery.refetch;
  const customerNote = String(order?.metadata?.customerNote || "").trim();

  const totalDue = useMemo(() => Number(invoice?.amount || order?.totalAmount || 0), [invoice?.amount, order?.totalAmount]);

  async function syncOrderState() {
    await Promise.all([refetchOrder(), refetchProfile()]);
    await wait(1200);
    await Promise.all([refetchOrder(), refetchProfile()]);
  }

  async function handleCardPayment({ stripe, cardElement }) {
    let response;
    try {
      const token = await getToken();
      response = await apiFetch("/stripe/intents", {
        method: "POST",
        token,
        body: {
          type: "order_payment",
          orderId,
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
          name: profile?.name || undefined,
          email: profile?.email || undefined,
        },
      },
    });

    if (result.error) {
      throw new Error(result.error.message || "The payment could not be completed.");
    }

    if (!result.paymentIntent?.id) {
      throw new Error("Stripe confirmed the payment but did not return a payment intent ID.");
    }

    try {
      const token = await getToken();
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

    await syncOrderState();
    router.replace(`/portal/checkout/${orderId}/thank-you`);
    return "Your payment was received. The order details are being refreshed now.";
  }

  async function handleOrderCancel() {
    const confirmed = window.confirm("Cancel this paid order and unsubscribe the linked service?");
    if (!confirmed) {
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
        title="Checkout & Payment"
        subtitle="Review your plan, pay the order, and let the admin team assign the final server login details after approval and provisioning."
      />
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
                          {subscription?.billingCycle ? `${subscription.billingCycle} billing` : "Managed service"}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-950">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {customerNote ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Deployment Note</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{customerNote}</p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
              Server login credentials are not chosen during checkout. After the order is approved, the admin team will provision the service and place the login, password, and IP details in your portal.
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_58px_-46px_rgba(15,23,42,0.38)]">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Card Payment</p>
                  <p className="mt-4 text-2xl font-semibold tracking-[-0.025em] text-slate-950">{formatCurrency(totalDue)}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Complete this first purchase by card. A successful payment activates the order, saves the card for renewal fallback billing, and opens a confirmation page.
                  </p>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                    Current saved card: <span className="font-semibold text-slate-950">{savedCardLabel(profile)}</span>
                  </div>
                </div>
                <div>
                  {isCancelled ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                      This order has been cancelled and is no longer billable.
                    </div>
                  ) : isPaid ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700">
                      This order has already been paid.
                    </div>
                  ) : (
                    <PortalCardForm
                      disabled={!canTriggerPayments || state.isSubmitting}
                      submitLabel="Pay by Card"
                      pendingLabel="Processing payment..."
                      onSubmit={handleCardPayment}
                      note="The card is confirmed securely through Stripe without leaving this checkout page."
                      successTitle="Card payment completed"
                      errorTitle="Card payment failed"
                      actionLabel="Order Payment"
                    />
                  )}
                </div>
              </div>
              {state.message ? <p className="mt-4 text-sm font-medium text-emerald-700">{state.message}</p> : null}
              {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {canCancelOrder ? (
                  <Button type="button" variant="ghost" disabled={state.isSubmitting} onClick={handleOrderCancel}>
                    Cancel Order
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
              <span className="font-semibold capitalize text-slate-900">{subscription?.billingCycle || order.billingCycle}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Renewal Strategy</span>
              <span className="font-semibold text-right text-slate-900">Wallet first, saved-card fallback</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              After approval, future renewals can check wallet balance first and use the saved card as a fallback when card billing is enabled.
            </div>
            <Link href="/portal/payments">
              <Button variant="ghost">Manage Wallet & Saved Card</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
