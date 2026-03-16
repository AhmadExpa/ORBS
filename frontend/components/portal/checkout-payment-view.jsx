"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge, TextInput } from "@/lib/ui";
import { apiFetch } from "@/lib/api/client";
import { resolvePublicFileUrl } from "@/lib/api/file-url";
import { useCustomerQuery } from "@/lib/api/hooks";
import { formatCurrency } from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";
import { PortalCardForm } from "@/components/portal/portal-card-form";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";

function savedCardLabel(user) {
  if (!user?.defaultPaymentMethodLast4) {
    return "No saved card on file yet.";
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

export function CheckoutPaymentView({ orderId }) {
  const { getToken } = useAuth();
  const { showToast } = useActionToast();
  const [invoiceCode, setInvoiceCode] = useState("");
  const [proof, setProof] = useState(null);
  const [state, setState] = useState({
    isSubmitting: false,
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
  const paymentSetting = orderQuery.data?.paymentSetting;
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

  async function handleManualSubmit(event) {
    event.preventDefault();
    setState((current) => ({
      ...current,
      isSubmitting: true,
      message: "",
      error: "",
    }));

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("subscriptionId", subscription?._id || "");
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

      setState((current) => ({
        ...current,
        isSubmitting: false,
        message:
          response.message ||
          "Your payment is in process. After verification, it will be added to your account. International payments usually take less than 3–4 hours to process.",
        error: "",
      }));
      showToast({
        type: "info",
        action: "Order Payment",
        title: "Payment submitted",
        description:
          response.message ||
          "Your payment is in process. After verification, it will be added to your account. International payments usually take less than 3–4 hours to process.",
      });
      setInvoiceCode("");
      setProof(null);
      await refetchOrder();
    } catch (requestError) {
      setState((current) => ({
        ...current,
        isSubmitting: false,
        message: "",
        error: requestError.message,
      }));
      showToast({
        type: "error",
        action: "Order Payment",
        title: "Payment submission failed",
        description: requestError.message,
      });
    }
  }

  async function handleCardPayment({ stripe, cardElement }) {
    const token = await getToken();
    const response = await apiFetch("/stripe/intents", {
      method: "POST",
      token,
      body: {
        type: "order_payment",
        orderId,
      },
    });

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

    await syncOrderState();
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
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
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

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Card Payment</p>
                <p className="mt-4 text-lg font-semibold text-slate-950">{savedCardLabel(profile)}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Enter card details here for an immediate payment. A successful payment can also keep a card available for future renewal fallback billing.
                </p>
                {isCancelled ? (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700">
                    This order has been cancelled and is no longer billable.
                  </div>
                ) : isPaid ? (
                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-white px-4 py-4 text-sm font-medium text-emerald-700">
                    This order has already been paid.
                  </div>
                ) : (
                  <div className="mt-5">
                    <PortalCardForm
                      disabled={!canTriggerPayments || state.isSubmitting}
                      submitLabel="Pay Now"
                      pendingLabel="Processing payment..."
                      onSubmit={handleCardPayment}
                      note="Card payments update the order automatically after confirmation."
                      successTitle="Card payment completed"
                      errorTitle="Card payment failed"
                      actionLabel="Order Payment"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Manual Payment</p>
                <div className="mt-4 grid gap-6 md:grid-cols-[180px_1fr]">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                    {paymentSetting?.qrCodeImageUrl ? (
                      <Image
                        alt="Payment QR code"
                        src={resolvePublicFileUrl(paymentSetting.qrCodeImageUrl)}
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
                      {paymentSetting?.instructions || "Scan the QR code and submit your payment reference for admin verification."}
                    </p>
                    {paymentSetting?.paymentLink ? (
                      <Link href={paymentSetting.paymentLink} target="_blank">
                        <Button variant="ghost">Unable to scan? Pay using payment link</Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Payment invoice/reference code</label>
                  <TextInput value={invoiceCode} onChange={(event) => setInvoiceCode(event.target.value)} placeholder="Enter transfer reference" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Payment proof screenshot (optional)</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setProof(event.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  />
                </div>
              </div>
              {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
              {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={!canTriggerPayments || state.isSubmitting}>
                  {state.isSubmitting ? "Submitting payment..." : isCancelled ? "Cancelled" : isPaid ? "Already Paid" : "Submit Payment Verification"}
                </Button>
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
            </form>
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
              After approval, future renewals check wallet balance first. If the wallet is short and you have a saved card, the remaining amount can be charged automatically.
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
