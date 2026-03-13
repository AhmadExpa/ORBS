"use client";

import { useEffect, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, TextArea, TextInput } from "@/lib/ui";
import { Topbar } from "@/components/shared/topbar";
import { useCustomerQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

export function AccountForm() {
  const { getToken } = useAuth();
  const { openUserProfile } = useClerk();
  const { user: clerkUser } = useUser();
  const { data, refetch } = useCustomerQuery({
    queryKey: ["portal-profile"],
    path: "/profile/me",
  });
  const [form, setForm] = useState({ phone: "", secondaryEmail: "", address: "" });
  const [state, setState] = useState({ saving: false, message: "", error: "" });

  useEffect(() => {
    if (data?.user) {
      setForm({
        phone: data.user.phone || "",
        secondaryEmail: data.user.secondaryEmail || "",
        address: data.user.address || "",
      });
    }
  }, [data]);

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
    } catch (error) {
      setState({ saving: false, message: "", error: error.message });
    }
  }

  return (
    <div>
      <Topbar
        title="Account Settings"
        subtitle="Update your address, secondary email, and phone number for support and billing follow-up."
        actions={
          <Button type="button" variant="ghost" onClick={() => openUserProfile()}>
            Login & Security
          </Button>
        }
      />
      <div className="p-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your primary sign-in email remains your login address.
              {" "}
              {clerkUser?.primaryEmailAddress?.emailAddress || "Your main email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Phone Number</label>
                  <TextInput value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Secondary Email</label>
                  <TextInput
                    type="email"
                    value={form.secondaryEmail}
                    onChange={(event) => setForm((current) => ({ ...current, secondaryEmail: event.target.value }))}
                    placeholder="billing@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
                <TextArea
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  placeholder="Street, city, state, postal code, country"
                />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Use `Login & Security` for password changes, primary email updates, and security settings.
              </div>
              {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
              {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
              <Button type="submit" disabled={state.saving}>
                {state.saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
