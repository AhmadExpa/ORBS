"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, TextArea, TextInput } from "@/lib/ui";
import { Topbar } from "@/components/shared/topbar";
import { useCustomerQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";

const emptyBillingAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export function AccountForm() {
  const { getToken } = useAuth();
  const { data, refetch, isLoading } = useCustomerQuery({
    queryKey: ["portal-profile"],
    path: "/profile/me",
  });
  const { showToast } = useActionToast();
  const [form, setForm] = useState({
    company: "",
    phone: "",
    address: "",
    billingAddress: emptyBillingAddress,
  });
  const [state, setState] = useState({ saving: false, message: "", error: "" });

  useEffect(() => {
    if (data?.user) {
      setForm({
        company: data.user.company || "",
        phone: data.user.phone || "",
        address: data.user.address || "",
        billingAddress: {
          ...emptyBillingAddress,
          ...(data.user.billingAddress || {}),
        },
      });
    }
  }, [data]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateBillingAddressField(field, value) {
    setForm((current) => ({
      ...current,
      billingAddress: {
        ...current.billingAddress,
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ saving: true, message: "", error: "" });

    try {
      const token = await getToken();
      await apiFetch("/profile/me", {
        method: "PATCH",
        token,
        body: form,
      });
      await refetch();
      setState({ saving: false, message: "Account details updated.", error: "" });
      showToast({
        type: "success",
        action: "Account",
        title: "Account updated",
        description: "Your profile details have been saved.",
      });
    } catch (error) {
      setState({ saving: false, message: "", error: error.message });
      showToast({
        type: "error",
        action: "Account",
        title: "Account update failed",
        description: error.message,
      });
    }
  }

  if (isLoading && !data) {
    return <PageLoader title="Account Settings" subtitle="Loading your profile..." cardCount={1} lines={5} />;
  }

  return (
    <div>
      <Topbar
        title="Account"
        subtitle="Keep your business, contact, and billing details current — they're used on invoices and during support."
      />
      <div className="mx-auto w-full max-w-[1680px] p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
            <CardDescription>These details appear on your invoices and help our team reach the right contact.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Business Name</label>
                  <TextInput
                    value={form.company}
                    onChange={(event) => updateField("company", event.target.value)}
                    placeholder="Company or organization name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Support Phone</label>
                  <TextInput
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    placeholder="+1 555 010 1234"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Business Address</label>
                <TextArea
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  placeholder="Primary business or service location"
                />
              </div>

              <div className="rounded-lg border border-line bg-slate-50/50 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Billing address</h3>
                  <p className="mt-1 text-sm text-slate-500">Used on invoices and billing records when provided.</p>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Address Line 1</label>
                    <TextInput
                      value={form.billingAddress.line1}
                      onChange={(event) => updateBillingAddressField("line1", event.target.value)}
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Address Line 2</label>
                    <TextInput
                      value={form.billingAddress.line2}
                      onChange={(event) => updateBillingAddressField("line2", event.target.value)}
                      placeholder="Suite, unit, floor"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
                    <TextInput value={form.billingAddress.city} onChange={(event) => updateBillingAddressField("city", event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">State / Region</label>
                    <TextInput value={form.billingAddress.state} onChange={(event) => updateBillingAddressField("state", event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Postal Code</label>
                    <TextInput value={form.billingAddress.postalCode} onChange={(event) => updateBillingAddressField("postalCode", event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Country</label>
                    <TextInput value={form.billingAddress.country} onChange={(event) => updateBillingAddressField("country", event.target.value)} />
                  </div>
                </div>
              </div>
              {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
              {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
              <Button type="submit" disabled={state.saving}>
                {state.saving ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
