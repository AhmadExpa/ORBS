"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, TextArea, TextInput } from "@/lib/ui";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

const initialPlan = {
  categoryId: "",
  name: "",
  slug: "",
  description: "",
  monthlyPrice: 0,
  yearlyPrice: 0,
  yearlyDiscountPercent: 0,
  features: "",
  techStack: "",
  planType: "standard",
  billingCycles: "monthly",
  displayPriceLabel: "",
  serviceType: "",
};

export function ProductsPage() {
  const { data, refetch, isLoading } = useStaffQuery({
    queryKey: ["admin-products"],
    path: "/admin/products",
  });
  const { showToast } = useActionToast();
  const [form, setForm] = useState(initialPlan);
  const [addonForm, setAddonForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
  });
  const [state, setState] = useState({ saving: false, message: "", error: "" });

  async function handleCreate(event) {
    event.preventDefault();
    setState({ saving: true, message: "", error: "" });

    try {
      await apiFetch("/admin/products", {
        method: "POST",
        authMode: "staff",
        body: {
          categoryId: form.categoryId,
          name: form.name,
          slug: form.slug,
          description: form.description,
          monthlyPrice: Number(form.monthlyPrice),
          yearlyPrice: Number(form.yearlyPrice),
          yearlyDiscountPercent: Number(form.yearlyDiscountPercent),
          features: form.features.split("\n").filter(Boolean),
          techStack: form.techStack.split("\n").map((item) => item.trim()).filter(Boolean),
          planType: form.planType,
          billingCycles: form.billingCycles.split(",").map((item) => item.trim()),
          isManaged: true,
          isCustom: false,
          contactSalesOnly: false,
          displayPriceLabel: form.displayPriceLabel || undefined,
          serviceType: form.serviceType || undefined,
          isActive: true,
        },
      });
      setForm(initialPlan);
      await refetch();
      setState({ saving: false, message: "Product plan created.", error: "" });
      showToast({
        type: "success",
        action: "Products",
        title: "Plan created",
        description: "The new product plan has been added.",
      });
    } catch (error) {
      setState({ saving: false, message: "", error: error.message });
      showToast({
        type: "error",
        action: "Products",
        title: "Plan creation failed",
        description: error.message,
      });
    }
  }

  async function handleAddonCreate(event) {
    event.preventDefault();
    setState({ saving: true, message: "", error: "" });

    try {
      await apiFetch("/admin/addons", {
        method: "POST",
        authMode: "staff",
        body: {
          ...addonForm,
          monthlyPrice: Number(addonForm.monthlyPrice),
          yearlyPrice: Number(addonForm.yearlyPrice),
          isActive: true,
        },
      });
      setAddonForm({
        categoryId: "",
        name: "",
        description: "",
        monthlyPrice: 0,
        yearlyPrice: 0,
      });
      await refetch();
      setState({ saving: false, message: "Add-on created.", error: "" });
      showToast({
        type: "success",
        action: "Products",
        title: "Add-on created",
        description: "The new add-on has been added to the catalog.",
      });
    } catch (error) {
      setState({ saving: false, message: "", error: error.message });
      showToast({
        type: "error",
        action: "Products",
        title: "Add-on creation failed",
        description: error.message,
      });
    }
  }

  const categories = data?.categories || [];
  const plans = data?.plans || [];
  const addons = data?.addons || [];

  if (isLoading && !data) {
    return <PageLoader title="Products Management" subtitle="Loading categories, plans, and add-ons..." cardCount={3} lines={4} />;
  }

  return (
    <div>
      <Topbar title="Products Management" subtitle="Create plans, review categories, and inspect add-ons." />
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Existing Plans</CardTitle>
              <CardDescription>All product plans currently available to the storefront and portal.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: "name", label: "Plan" },
                  { key: "category", label: "Category", render: (row) => row.categoryId?.name || "Unknown" },
                  { key: "monthlyPrice", label: "Monthly" },
                  { key: "yearlyPrice", label: "Yearly" },
                  {
                    key: "techStack",
                    label: "Tech Stack",
                    render: (row) => (row.techStack?.length ? row.techStack.join(", ") : "Not defined"),
                  },
                ]}
                rows={plans}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add-ons</CardTitle>
              <CardDescription>Configured feature add-ons by category.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: "name", label: "Addon" },
                  { key: "category", label: "Category", render: (row) => row.categoryId?.name || "Unknown" },
                  { key: "monthlyPrice", label: "Monthly" },
                ]}
                rows={addons}
              />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create Plan</CardTitle>
            <CardDescription>Quick-create fixed-price plans from the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                  value={form.categoryId}
                  onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                <TextInput value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Slug</label>
                <TextInput value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <TextArea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput type="number" placeholder="Monthly" value={form.monthlyPrice} onChange={(event) => setForm((current) => ({ ...current, monthlyPrice: event.target.value }))} />
                <TextInput type="number" placeholder="Yearly" value={form.yearlyPrice} onChange={(event) => setForm((current) => ({ ...current, yearlyPrice: event.target.value }))} />
              </div>
              <TextArea placeholder="One feature per line" value={form.features} onChange={(event) => setForm((current) => ({ ...current, features: event.target.value }))} />
              <TextArea placeholder="One tech stack item per line" value={form.techStack} onChange={(event) => setForm((current) => ({ ...current, techStack: event.target.value }))} />
              {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
              {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
              <Button className="w-full" type="submit" disabled={state.saving}>
                {state.saving ? "Creating..." : "Create Product"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Create Add-on</CardTitle>
            <CardDescription>Manage feature add-ons customers can select during ordering.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleAddonCreate}>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                value={addonForm.categoryId}
                onChange={(event) => setAddonForm((current) => ({ ...current, categoryId: event.target.value }))}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <TextInput placeholder="Add-on name" value={addonForm.name} onChange={(event) => setAddonForm((current) => ({ ...current, name: event.target.value }))} />
              <TextArea placeholder="Description" value={addonForm.description} onChange={(event) => setAddonForm((current) => ({ ...current, description: event.target.value }))} />
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput type="number" placeholder="Monthly price" value={addonForm.monthlyPrice} onChange={(event) => setAddonForm((current) => ({ ...current, monthlyPrice: event.target.value }))} />
                <TextInput type="number" placeholder="Yearly price" value={addonForm.yearlyPrice} onChange={(event) => setAddonForm((current) => ({ ...current, yearlyPrice: event.target.value }))} />
              </div>
              <Button className="w-full" type="submit" disabled={state.saving}>
                Create Add-on
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
