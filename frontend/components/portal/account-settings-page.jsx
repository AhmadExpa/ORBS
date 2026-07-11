"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Building2, KeyRound, LifeBuoy, Mail, Power, RefreshCcw, Save, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { Topbar } from "@/components/shared/topbar";
import { AccountForm } from "@/components/portal/account-form";
import { useCustomerQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FieldLabel, StatusBadge, TextInput, cn } from "@/lib/ui";
import { LogoSpinner } from "@/components/shared/logo-spinner";

const tabs = [
  {
    id: "general",
    label: "Account overview",
    description: "Profile, email, and account status",
    icon: UserRound,
  },
  {
    id: "business",
    label: "Business details",
    description: "Company profile and billing address",
    icon: Building2,
  },
  {
    id: "delegates",
    label: "Delegated access",
    description: "Service agents and ticket access",
    icon: UsersRound,
    ownerOnly: true,
  },
];

function fieldValue(value) {
  return value ? String(value) : "Not provided";
}

function AccountFact({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function GeneralAccountPanel({ onEditBusiness }) {
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-profile"],
    path: "/profile/me",
  });
  const user = profileQuery.data?.user;

  if (profileQuery.isLoading && !profileQuery.data) {
    return (
      <div className="flex justify-center py-16">
        <LogoSpinner size={56} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
          <CardDescription>Your primary ElevenOrbits account record.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AccountFact label="Name" value={fieldValue(user?.name)} />
          <AccountFact label="Email" value={fieldValue(user?.email)} />
          <AccountFact label="Status" value={<StatusBadge status={user?.accountStatus || "active"} />} />
          <AccountFact label="Company" value={fieldValue(user?.company)} />
          <AccountFact label="Phone" value={fieldValue(user?.phone)} />
          <AccountFact label="Customer ID" value={fieldValue(user?._id)} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Record</CardTitle>
            <CardDescription>Business details used for invoices, support, and provisioning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-slate-950">{fieldValue(user?.company || user?.name)}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{fieldValue(user?.address)}</p>
              </div>
            </div>
            <Button type="button" onClick={onEditBusiness}>
              Edit Business Details
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access</CardTitle>
            <CardDescription>Account access is handled through your ElevenOrbits sign-in session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <Mail className="h-5 w-5 text-slate-500" />
                <span className="min-w-0 break-words text-sm font-semibold text-slate-950">{fieldValue(user?.email)}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-semibold">Portal session active</span>
              </div>
            </div>
            <Link href="/portal/support" className="inline-flex">
              <Button variant="ghost">Contact Support</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function serviceLabel(subscription) {
  return subscription?.productPlanId?.name || subscription?.productPlanId?.slug || "Managed Service";
}

function serviceDetail(subscription) {
  const category = subscription?.productPlanId?.categoryId?.name || subscription?.productPlanId?.categoryId?.slug || "";
  const status = subscription?.status ? `Status: ${subscription.status}` : "";
  return [category, status].filter(Boolean).join(" - ");
}

function updateSelectedIds(selectedIds, id, checked) {
  const next = new Set(selectedIds);
  if (checked) {
    next.add(id);
  } else {
    next.delete(id);
  }
  return [...next];
}

function DelegateCard({ delegate, subscriptions, onUpdated }) {
  const { getToken } = useAuth();
  const [selectedIds, setSelectedIds] = useState(delegate.subscriptionIds || []);
  const [password, setPassword] = useState("");
  const [state, setState] = useState({ saving: false, passwordSaving: false, error: "", message: "" });

  async function patchDelegate(updates) {
    setState((current) => ({ ...current, saving: true, error: "", message: "" }));
    try {
      const token = await getToken();
      await apiFetch(`/delegates/${delegate._id}`, {
        method: "PATCH",
        token,
        body: updates,
      });
      setState((current) => ({ ...current, saving: false, message: "Agent updated.", error: "" }));
      await onUpdated();
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message, message: "" }));
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setState((current) => ({ ...current, passwordSaving: true, error: "", message: "" }));
    try {
      const token = await getToken();
      await apiFetch(`/delegates/${delegate._id}/password`, {
        method: "POST",
        token,
        body: { password },
      });
      setPassword("");
      setState((current) => ({ ...current, passwordSaving: false, message: "Password reset.", error: "" }));
    } catch (error) {
      setState((current) => ({ ...current, passwordSaving: false, error: error.message, message: "" }));
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-slate-950">{delegate.displayName}</p>
            <StatusBadge status={delegate.isActive ? "active" : "disabled"} />
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">@{delegate.username}</p>
        </div>
        <Button
          type="button"
          variant={delegate.isActive ? "ghost" : "primary"}
          disabled={state.saving}
          onClick={() => patchDelegate({ isActive: !delegate.isActive })}
        >
          <Power className="h-4 w-4" />
          {delegate.isActive ? "Deactivate" : "Activate"}
        </Button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {subscriptions.map((subscription) => {
          const id = String(subscription._id);
          return (
            <label key={id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={selectedIds.includes(id)}
                onChange={(event) => setSelectedIds((current) => updateSelectedIds(current, id, event.target.checked))}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-950">{serviceLabel(subscription)}</span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-500">{serviceDetail(subscription) || "Assigned service"}</span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" disabled={state.saving || !selectedIds.length} onClick={() => patchDelegate({ subscriptionIds: selectedIds })}>
          <Save className="h-4 w-4" />
          Save services
        </Button>
        <form className="flex min-w-[260px] flex-1 flex-wrap items-end gap-3" onSubmit={handleResetPassword}>
          <div className="min-w-[220px] flex-1">
            <FieldLabel>New password</FieldLabel>
            <TextInput
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <Button type="submit" variant="ghost" disabled={state.passwordSaving || password.length < 8}>
            <RefreshCcw className="h-4 w-4" />
            Reset
          </Button>
        </form>
      </div>
      {state.message ? <p className="mt-3 text-sm font-medium text-emerald-700">{state.message}</p> : null}
      {state.error ? <p className="mt-3 text-sm font-medium text-rose-600">{state.error}</p> : null}
    </div>
  );
}

function DelegateAccessPanel() {
  const { getToken } = useAuth();
  const delegatesQuery = useCustomerQuery({
    queryKey: ["portal-delegates"],
    path: "/delegates",
  });
  const subscriptionsQuery = useCustomerQuery({
    queryKey: ["portal-subscriptions"],
    path: "/subscriptions",
  });
  const [form, setForm] = useState({
    username: "",
    displayName: "",
    password: "",
    subscriptionIds: [],
  });
  const [state, setState] = useState({ saving: false, error: "", message: "" });

  const subscriptions = subscriptionsQuery.data?.subscriptions || [];
  const delegates = delegatesQuery.data?.delegates || [];

  async function handleCreate(event) {
    event.preventDefault();
    setState({ saving: true, error: "", message: "" });
    try {
      const token = await getToken();
      await apiFetch("/delegates", {
        method: "POST",
        token,
        body: form,
      });
      setForm({ username: "", displayName: "", password: "", subscriptionIds: [] });
      await delegatesQuery.refetch();
      setState({ saving: false, error: "", message: "Agent created." });
    } catch (error) {
      setState({ saving: false, error: error.message, message: "" });
    }
  }

  if ((delegatesQuery.isLoading || subscriptionsQuery.isLoading) && !delegatesQuery.data && !subscriptionsQuery.data) {
    return (
      <div className="flex justify-center py-16">
        <LogoSpinner size={56} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Agent Access</CardTitle>
          <CardDescription>Agents can open tickets and view credentials only for the services selected here.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleCreate}>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <FieldLabel>Display name</FieldLabel>
                <TextInput
                  value={form.displayName}
                  onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                  placeholder="Operations Agent"
                  required
                />
              </div>
              <div>
                <FieldLabel>Username</FieldLabel>
                <TextInput
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="ops.agent"
                  required
                />
              </div>
              <div>
                <FieldLabel>Password</FieldLabel>
                <TextInput
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="At least 8 characters"
                  required
                />
              </div>
            </div>

            <div>
              <FieldLabel>Assigned services</FieldLabel>
              <div className="grid gap-3 md:grid-cols-2">
                {subscriptions.map((subscription) => {
                  const id = String(subscription._id);
                  return (
                    <label key={id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        checked={form.subscriptionIds.includes(id)}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            subscriptionIds: updateSelectedIds(current.subscriptionIds, id, event.target.checked),
                          }))
                        }
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-950">{serviceLabel(subscription)}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{serviceDetail(subscription) || "Available service"}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {!subscriptions.length ? <p className="mt-3 text-sm text-slate-500">Active services appear here after provisioning.</p> : null}
            </div>

            {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
            {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
            <Button type="submit" disabled={state.saving || !form.subscriptionIds.length}>
              <KeyRound className="h-4 w-4" />
              {state.saving ? "Creating..." : "Create agent"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>Manage service assignments, access status, and password resets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {delegates.map((delegate) => (
            <DelegateCard key={delegate._id} delegate={delegate} subscriptions={subscriptions} onUpdated={delegatesQuery.refetch} />
          ))}
          {!delegates.length ? <p className="text-sm text-slate-500">No agents have been created yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function AccountSettingsPage() {
  const [tab, setTab] = useState("general");
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-profile"],
    path: "/profile/me",
  });
  const isDelegate = profileQuery.data?.actorType === "delegate";
  const visibleTabs = tabs.filter((item) => !item.ownerOnly || !isDelegate);

  return (
    <div>
      <Topbar title="Account" subtitle="Manage your sign-in details, security, and business profile." />
      <div className="mx-auto w-full max-w-[1680px] p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[256px_minmax(0,1fr)]">
          <aside className="flex min-h-[520px] flex-col rounded-lg border border-white/10 bg-[#0f1115] px-3 py-5 text-slate-300">
            <div className="px-2">
              <p className="text-sm font-semibold text-white">Account</p>
              <p className="mt-0.5 text-xs leading-5 text-white/45">Profile, business details, and delegated access.</p>
            </div>

            <div className="mt-6">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Views</p>
              <nav className="mt-2 space-y-0.5">
                {visibleTabs.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={cn(
                        "relative flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                        active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {active ? <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent-500" /> : null}
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-accent-400" : "text-white/40")} />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-white/45">{item.description}</span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto space-y-4 pt-8">
              <Link href="/portal/support" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white">
                <LifeBuoy className="h-4 w-4 text-white/40" />
                Contact support
              </Link>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3.5">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-600/15 text-accent-400">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">Account control</p>
                    <p className="mt-0.5 text-xs leading-5 text-white/50">Owners can update business details and manage service agents.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            {tab === "general" ? (
              <GeneralAccountPanel onEditBusiness={() => setTab("business")} />
            ) : tab === "delegates" && !isDelegate ? (
              <DelegateAccessPanel />
            ) : (
              <AccountForm embedded />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
