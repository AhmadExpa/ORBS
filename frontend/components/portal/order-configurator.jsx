"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui";
import { calculatePlanPrice, formatCurrency } from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";
import { apiFetch } from "@/lib/api/client";

export function OrderConfigurator({ slug }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["catalog-plan", slug],
    queryFn: () => apiFetch(`/catalog/plans/${slug}`),
  });

  const plan = data?.plan;
  const addonsQuery = useQuery({
    queryKey: ["catalog-addons", plan?.categoryId?.slug],
    queryFn: () => apiFetch(`/catalog/addons?category=${plan.categoryId.slug}`),
    enabled: Boolean(plan?.categoryId?.slug),
  });

  const addons = addonsQuery.data?.addons || [];
  const total = useMemo(() => {
    const basePrice = calculatePlanPrice(plan, billingCycle);
    const addonTotal = addons
      .filter((addon) => selectedAddonIds.includes(addon._id))
      .reduce(
        (sum, addon) => sum + Number(billingCycle === "yearly" ? addon.yearlyPrice : addon.monthlyPrice || 0),
        0,
      );

    return basePrice + addonTotal;
  }, [addons, billingCycle, plan, selectedAddonIds]);

  async function handleCreateOrder() {
    if (!plan || plan.contactSalesOnly) {
      router.push("/#contact");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = await getToken();
      const data = await apiFetch("/orders", {
        method: "POST",
        token,
        body: {
          productPlanId: plan._id,
          addonIds: selectedAddonIds,
          billingCycle,
        },
      });
      router.push(`/portal/checkout/${data.order._id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!plan) {
    return (
      <div>
        <Topbar title="Order Configuration" subtitle={isLoading ? "Loading plan details..." : "Plan not found."} />
      </div>
    );
  }

  return (
    <div>
      <Topbar title={`Configure ${plan.name}`} subtitle="Review the managed service stack, choose billing, and fund renewals through your wallet after approval." />
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle>Order Flow</CardTitle>
            <CardDescription>Select billing cycle, review the managed service summary, and confirm what ElevenOrbits will operate for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {["monthly", "yearly"].filter((cycle) => plan.billingCycles.includes(cycle)).map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    billingCycle === cycle ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="font-semibold capitalize text-slate-900">{cycle}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {cycle === "yearly" ? "Automatic annual discount where configured." : "Standard monthly billing."}
                  </p>
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Included</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                {plan.features.map((feature) => (
                  <p key={feature}>• {feature}</p>
                ))}
              </div>
            </div>
            {plan.techStack?.length ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-500">Managed Tech Stack</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {plan.techStack.map((item) => (
                    <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {addons.length ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-500">Feature Add-ons</p>
                <div className="mt-4 grid gap-3">
                  {addons.map((addon) => {
                    const checked = selectedAddonIds.includes(addon._id);
                    return (
                      <label key={addon._id} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            setSelectedAddonIds((current) =>
                              event.target.checked
                                ? [...current, addon._id]
                                : current.filter((item) => item !== addon._id),
                            )
                          }
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{addon.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{addon.description}</p>
                          <p className="mt-2 text-sm font-medium text-sky-700">
                            {formatCurrency(billingCycle === "yearly" ? addon.yearlyPrice : addon.monthlyPrice)}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Renewal Billing</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Once the order is approved and activated, the subscription renews by deducting the due amount from your wallet on its renewal date.
              </p>
              <div className="mt-4">
                <Link href="/portal/payments">
                  <Button variant="ghost">Top Up Wallet</Button>
                </Link>
              </div>
            </div>
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Pricing Summary</CardTitle>
            <CardDescription>Managed by ElevenOrbits Team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Plan</span>
              <span className="font-semibold text-slate-900">{plan.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Category</span>
              <span className="font-semibold text-slate-900">{plan.categoryId?.name || "Managed Service"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Billing Cycle</span>
              <span className="font-semibold capitalize text-slate-900">{billingCycle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Due</span>
              <span className="text-2xl font-semibold text-slate-950">
                {plan.contactSalesOnly ? plan.displayPriceLabel || "Contact sales" : formatCurrency(total)}
              </span>
            </div>
            <Button className="w-full" onClick={handleCreateOrder} disabled={isSubmitting}>
              {isSubmitting ? "Creating order..." : plan.contactSalesOnly ? "Talk to Sales" : "Create Order"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
