"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileCheck2,
  Headphones,
  LockKeyhole,
  PackageCheck,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui";
import { formatCurrency, getBillingCycleLabel } from "@/lib/shared";
import { apiFetch } from "@/lib/api/client";
import { useCart } from "@/lib/cart/use-cart";
import { Topbar } from "@/components/shared/topbar";
import { OrderJourney } from "@/components/portal/order-journey";
import { PageLoader } from "@/components/shared/page-loader";
import { useActionToast } from "@/components/shared/feedback-layer";

function Detail({ label, value }) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function Assurance({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function CartPage() {
  const router = useRouter();
  const { userId, getToken } = useAuth();
  const { item, itemCount, isHydrated, clearCart } = useCart(userId);
  const { showToast } = useActionToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const quoteQuery = useQuery({
    queryKey: ["portal-cart-quote", item?.updatedAt],
    queryFn: () => apiFetch("/orders/quote", { method: "POST", body: item.payload }),
    enabled: Boolean(item?.payload),
    retry: false,
  });
  const quote = quoteQuery.data?.quote;
  const quotedLineItems = quote?.lineItems || item?.summaryItems || [];
  const amountDueToday = item?.trialRequested ? 0 : Number(quote?.totalAmount ?? item?.dueToday ?? 0);
  const quoteError = quoteQuery.isError ? quoteQuery.error?.message || "This configuration needs to be reviewed again." : "";

  async function handleCheckout() {
    if (!item?.payload || isCheckingOut) return;

    setIsCheckingOut(true);
    setError("");

    try {
      const token = await getToken();
      const data = await apiFetch("/orders", {
        method: "POST",
        token,
        body: item.payload,
      });

      clearCart();
      showToast({
        type: "success",
        action: "Checkout",
        title: item.trialRequested ? "Trial request submitted" : "Checkout initiated",
        description: item.trialRequested
          ? "Your request is ready for the ElevenOrbits provisioning review."
          : "Your order and invoice are ready for secure payment.",
      });
      router.push(
        item.trialRequested
          ? `/portal/checkout/${data.order._id}/thank-you`
          : `/portal/checkout/${data.order._id}`,
      );
    } catch (requestError) {
      if (requestError.redirectUrl) {
        router.push(requestError.redirectUrl);
      }
      setError(requestError.message || "Checkout could not be initiated.");
      showToast({
        type: "error",
        action: "Checkout",
        title: "Checkout could not start",
        description: requestError.message || "Review your configuration and try again.",
      });
    } finally {
      setIsCheckingOut(false);
    }
  }

  function handleRemove() {
    clearCart();
    setError("");
    showToast({
      type: "info",
      action: "Cart",
      title: "Cart cleared",
      description: "The configuration draft was removed. No order or invoice was created.",
    });
  }

  if (!isHydrated) {
    return <PageLoader title="Your Cart" subtitle="Loading your saved configuration..." cardCount={2} lines={4} />;
  }

  return (
    <div>
      <Topbar
        title="Your Cart"
        subtitle={itemCount ? "Review your managed service configuration before initiating checkout." : "Your saved service configurations appear here."}
        actions={
          <Link href="/portal/services">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4" />
              Browse services
            </Button>
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-[1680px] px-6 pt-6 md:px-8 md:pt-8">
        <OrderJourney current="cart" />
      </div>

      {!item ? (
        <div className="mx-auto w-full max-w-[1680px] p-6 md:p-8">
          <Card className="overflow-hidden">
            <CardContent className="flex min-h-[420px] flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
                <ShoppingBag className="h-7 w-7" />
              </span>
              <h2 className="mt-6 text-2xl font-semibold tracking-[-0.025em] text-slate-950">Your cart is ready for a service</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                Choose a managed service, tailor it to your workload, and come back here to review the full configuration before checkout.
              </p>
              <Link href="/portal/services" className="mt-7">
                <Button>
                  Explore managed services
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-[1680px] gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-950 to-slate-800 p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-300">Configuration draft</p>
                    <CardTitle className="mt-2 text-2xl text-white">{item.plan.name}</CardTitle>
                    <CardDescription className="mt-1 text-slate-300">{item.plan.categoryName} · managed by ElevenOrbits</CardDescription>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                    <Check className="h-3.5 w-3.5" />
                    Ready to review
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-line bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Contract</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{getBillingCycleLabel(item.billingCycle)}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Due today</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(amountDueToday)}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Provisioning</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">Team review included</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-950">Service configuration</h2>
                      <p className="mt-1 text-sm text-slate-500">The exact details ElevenOrbits will receive for provisioning.</p>
                    </div>
                    <Link href={`/portal/order/${item.plan.slug}`}>
                      <Button variant="ghost">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-4 rounded-xl border border-line px-4">
                    <Detail label="Plan" value={item.plan.name} />
                    <Detail label="Region" value={item.selections?.region} />
                    <Detail label="Storage" value={item.selections?.storage} />
                    <Detail label="System image" value={item.selections?.image} />
                    <Detail
                      label="Managed add-ons"
                      value={item.selections?.features?.length ? item.selections.features.join(", ") : "No optional add-ons"}
                    />
                    <Detail
                      label="Service requirements"
                      value={item.selections?.requirementCount ? `${item.selections.requirementCount} answers included` : "No additional intake required"}
                    />
                    <Detail label="Provisioning note" value={item.selections?.hasNote ? "Included for the team" : "None"} />
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-950">Price breakdown</h2>
                  <div className="mt-4 divide-y divide-line rounded-xl border border-line px-4">
                    {quotedLineItems.map((lineItem, index) => (
                      <div key={`${lineItem.label}-${index}`} className="flex items-start justify-between gap-4 py-3.5">
                        <span className="text-sm text-slate-600">{lineItem.label}</span>
                        <span className="text-sm font-semibold text-slate-950">{formatCurrency(lineItem.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove configuration
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What happens next</CardTitle>
                <CardDescription>A clear handoff from purchase to managed delivery.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-3">
                <Assurance icon={Wallet} title="1. Advance payment" description="Pay the order invoice securely from your wallet or by card." />
                <Assurance icon={FileCheck2} title="2. Legitimacy review" description="We validate the request before provisioning. Unapproved requests are refunded." />
                <Assurance icon={PackageCheck} title="3. Managed delivery" description="Approved services are prepared and access details are published in your portal." />
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit lg:sticky lg:top-[8.5rem]">
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">Order summary</p>
              <CardTitle className="mt-1">Ready when you are</CardTitle>
              <CardDescription>Nothing has been charged or submitted yet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3 border-b border-line pb-5">
                <Detail label="Service" value={item.plan.name} />
                <Detail label="Billing" value={getBillingCycleLabel(item.billingCycle)} />
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.trialRequested ? "Due for trial request" : "Total due today"}</p>
                  <p className="mt-1 text-xs text-slate-400">USD · current verified pricing</p>
                </div>
                <p className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">{formatCurrency(amountDueToday)}</p>
              </div>

              {item.trialRequested ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                  No payment is required. Proceeding will submit your 3-day trial request for team review.
                </div>
              ) : null}

              {error || quoteError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">{error || quoteError}</div>
              ) : null}

              <Button className="w-full" onClick={handleCheckout} disabled={isCheckingOut || quoteQuery.isLoading || quoteQuery.isError}>
                <LockKeyhole className="h-4 w-4" />
                {isCheckingOut
                  ? "Initiating checkout..."
                  : quoteQuery.isLoading
                    ? "Verifying current price..."
                    : item.trialRequested
                      ? "Submit trial request"
                      : "Proceed to checkout"}
                {!isCheckingOut && !quoteQuery.isLoading ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>

              <div className="space-y-4 rounded-xl border border-line bg-slate-50 p-4">
                <Assurance icon={ShieldCheck} title="Protected checkout" description="Payment details are handled securely and are never stored in this cart." />
                <Assurance icon={Headphones} title="Human support" description="The ElevenOrbits team reviews every managed deployment." />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
