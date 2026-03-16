"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, TextInput } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

function formatAddonPreview(addon) {
  if (addon.addonType === "storage") {
    return `Included ${addon.includedQuantity || 0} ${addon.unitLabel || "GB"} + ${formatCurrency(
      addon.pricePerUnitMonthly || 0,
    )} per ${addon.unitLabel || "GB"}/month`;
  }

  return formatCurrency(addon.monthlyPrice || 0);
}

export function PricingPage() {
  const { data, refetch, isLoading } = useStaffQuery({
    queryKey: ["admin-pricing"],
    path: "/admin/pricing",
  });
  const { showToast } = useActionToast();
  const [state, setState] = useState({ loading: "", message: "", error: "" });

  async function handleSavePlan(plan) {
    setState({ loading: `plan:${plan._id}`, message: "", error: "" });

    try {
      await apiFetch(`/admin/products/${plan._id}`, {
        method: "PATCH",
        authMode: "staff",
        body: {
          monthlyPrice: Number(plan.monthlyPrice),
          yearlyPrice: Number(plan.yearlyPrice),
          yearlyDiscountPercent: Number(plan.yearlyDiscountPercent),
          isActive: Boolean(plan.isActive),
        },
      });
      await refetch();
      setState({ loading: "", message: "Pricing updated.", error: "" });
      showToast({
        type: "success",
        action: "Pricing",
        title: "Plan pricing updated",
        description: `${plan.name} pricing has been saved.`,
      });
    } catch (error) {
      setState({ loading: "", message: "", error: error.message });
      showToast({
        type: "error",
        action: "Pricing",
        title: "Plan pricing failed",
        description: error.message,
      });
    }
  }

  async function handleSaveAddon(addon) {
    setState({ loading: `addon:${addon._id}`, message: "", error: "" });

    try {
      await apiFetch(`/admin/addons/${addon._id}`, {
        method: "PATCH",
        authMode: "staff",
        body: {
          monthlyPrice: Number(addon.monthlyPrice || 0),
          yearlyPrice: Number(addon.yearlyPrice || 0),
          includedQuantity: Number(addon.includedQuantity || 0),
          pricePerUnitMonthly: Number(addon.pricePerUnitMonthly || 0),
          pricePerUnitYearly: Number(addon.pricePerUnitYearly || 0),
          unitLabel: addon.unitLabel || "GB",
          minQuantity: Number(addon.minQuantity || 0),
          maxQuantity: Number(addon.maxQuantity || 0),
          quantityStep: Number(addon.quantityStep || 1),
          isActive: Boolean(addon.isActive ?? true),
          sortOrder: Number(addon.sortOrder || 0),
        },
      });
      await refetch();
      setState({ loading: "", message: "Pricing updated.", error: "" });
      showToast({
        type: "success",
        action: "Add-on Pricing",
        title: "Add-on pricing updated",
        description: `${addon.name} pricing has been saved.`,
      });
    } catch (error) {
      setState({ loading: "", message: "", error: error.message });
      showToast({
        type: "error",
        action: "Add-on Pricing",
        title: "Add-on pricing failed",
        description: error.message,
      });
    }
  }

  const plans = data?.plans || [];
  const addons = data?.addons || [];

  if (isLoading && !data) {
    return <PageLoader title="Pricing Management" subtitle="Loading plans and add-on pricing..." cardCount={3} lines={4} />;
  }

  return (
    <div>
      <Topbar
        title="Pricing Management"
        subtitle="Adjust plan pricing plus region, image, storage, and feature add-on charges from one screen."
      />
      <div className="space-y-6 p-6">
        {plans.map((plan) => (
          <PlanPricingCard
            key={plan._id}
            plan={plan}
            onSave={handleSavePlan}
            saving={state.loading === `plan:${plan._id}`}
          />
        ))}

        {addons.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Add-on Pricing</CardTitle>
              <CardDescription>
                Server options such as regions, storage, images, and additional IPv4 billing can be updated here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {addons.map((addon) => (
                <AddonPricingCard
                  key={addon._id}
                  addon={addon}
                  onSave={handleSaveAddon}
                  saving={state.loading === `addon:${addon._id}`}
                />
              ))}
            </CardContent>
          </Card>
        ) : null}

        {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
        {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
      </div>
    </div>
  );
}

function PlanPricingCard({ plan, onSave, saving }) {
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
          <TextInput
            type="number"
            value={draft.monthlyPrice}
            onChange={(event) => setDraft((current) => ({ ...current, monthlyPrice: event.target.value }))}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Yearly</label>
          <TextInput
            type="number"
            value={draft.yearlyPrice}
            onChange={(event) => setDraft((current) => ({ ...current, yearlyPrice: event.target.value }))}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Annual Discount %</label>
          <TextInput
            type="number"
            value={draft.yearlyDiscountPercent}
            onChange={(event) => setDraft((current) => ({ ...current, yearlyDiscountPercent: event.target.value }))}
          />
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

function AddonPricingCard({ addon, onSave, saving }) {
  const [draft, setDraft] = useState(addon);

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-semibold text-slate-950">{addon.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {addon.categoryId?.name || "Unknown category"} • {addon.addonType || "feature"} • {formatAddonPreview(addon)}
          </p>
        </div>
        <Button onClick={() => onSave(draft)} disabled={saving}>
          {saving ? "Saving..." : "Save Add-on"}
        </Button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Monthly</label>
          <TextInput
            type="number"
            step="0.01"
            value={draft.monthlyPrice}
            onChange={(event) => setDraft((current) => ({ ...current, monthlyPrice: event.target.value }))}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Yearly</label>
          <TextInput
            type="number"
            step="0.01"
            value={draft.yearlyPrice}
            onChange={(event) => setDraft((current) => ({ ...current, yearlyPrice: event.target.value }))}
          />
        </div>

        {addon.addonType === "storage" ? (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Included Quantity</label>
              <TextInput
                type="number"
                value={draft.includedQuantity}
                onChange={(event) => setDraft((current) => ({ ...current, includedQuantity: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Unit Label</label>
              <TextInput
                value={draft.unitLabel || "GB"}
                onChange={(event) => setDraft((current) => ({ ...current, unitLabel: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Price Per Unit Monthly</label>
              <TextInput
                type="number"
                step="0.0001"
                value={draft.pricePerUnitMonthly}
                onChange={(event) => setDraft((current) => ({ ...current, pricePerUnitMonthly: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Price Per Unit Yearly</label>
              <TextInput
                type="number"
                step="0.0001"
                value={draft.pricePerUnitYearly}
                onChange={(event) => setDraft((current) => ({ ...current, pricePerUnitYearly: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Minimum Quantity</label>
              <TextInput
                type="number"
                value={draft.minQuantity}
                onChange={(event) => setDraft((current) => ({ ...current, minQuantity: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Maximum Quantity</label>
              <TextInput
                type="number"
                value={draft.maxQuantity}
                onChange={(event) => setDraft((current) => ({ ...current, maxQuantity: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Quantity Step</label>
              <TextInput
                type="number"
                value={draft.quantityStep}
                onChange={(event) => setDraft((current) => ({ ...current, quantityStep: event.target.value }))}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
