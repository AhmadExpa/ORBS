"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, TextInput } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

export function PricingPage() {
  const { data, refetch } = useStaffQuery({
    queryKey: ["admin-pricing"],
    path: "/admin/pricing",
  });
  const [state, setState] = useState({ loading: "", message: "", error: "" });

  async function handleSave(plan) {
    setState({ loading: plan._id, message: "", error: "" });

    try {
      await apiFetch(`/admin/products/${plan._id}`, {
        method: "PATCH",
        body: {
          monthlyPrice: Number(plan.monthlyPrice),
          yearlyPrice: Number(plan.yearlyPrice),
          yearlyDiscountPercent: Number(plan.yearlyDiscountPercent),
          isActive: Boolean(plan.isActive),
        },
      });
      await refetch();
      setState({ loading: "", message: "Pricing updated.", error: "" });
    } catch (error) {
      setState({ loading: "", message: "", error: error.message });
    }
  }

  const plans = data?.plans || [];

  return (
    <div>
      <Topbar title="Pricing Management" subtitle="Adjust monthly and yearly pricing, discounts, and plan availability." />
      <div className="space-y-6 p-6">
        {plans.map((plan) => (
          <PricingCard key={plan._id} plan={plan} onSave={handleSave} saving={state.loading === plan._id} />
        ))}
        {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
        {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
      </div>
    </div>
  );
}

function PricingCard({ plan, onSave, saving }) {
  const [draft, setDraft] = useState(plan);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>
          Current display price {plan.contactSalesOnly ? plan.displayPriceLabel : formatCurrency(plan.monthlyPrice)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Monthly</label>
          <TextInput type="number" value={draft.monthlyPrice} onChange={(event) => setDraft((current) => ({ ...current, monthlyPrice: event.target.value }))} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Yearly</label>
          <TextInput type="number" value={draft.yearlyPrice} onChange={(event) => setDraft((current) => ({ ...current, yearlyPrice: event.target.value }))} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Annual Discount %</label>
          <TextInput type="number" value={draft.yearlyDiscountPercent} onChange={(event) => setDraft((current) => ({ ...current, yearlyDiscountPercent: event.target.value }))} />
        </div>
        <div className="flex items-end">
          <Button className="w-full" onClick={() => onSave(draft)} disabled={saving}>
            {saving ? "Saving..." : "Save Pricing"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
