"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  Activity,
  Building2,
  Check,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  LifeBuoy,
  Power,
  RefreshCcw,
  Save,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wallet,
} from "lucide-react";
import { Topbar } from "@/components/shared/topbar";
import { AccountForm } from "@/components/portal/account-form";
import { PortalActivityPanel } from "@/components/portal/activity-panel";
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
  {
    id: "security",
    label: "Support & security",
    description: "Support PIN and secure assistance",
    icon: ShieldCheck,
    ownerOnly: true,
  },
  {
    id: "activity",
    label: "Activity log",
    description: "Payments, support, access, and service events",
    icon: Activity,
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

function PasswordField({ value, onChange, placeholder = "At least 8 characters", required = false }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <TextInput
        type={visible ? "text" : "password"}
        minLength={8}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="pr-11"
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
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
          <AccountFact label="Customer ID" value={fieldValue(user?._id)} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardDescription>Company, phone, and billing address are managed in a separate business profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-slate-950">Business profile</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Keep invoice and provisioning details current without exposing them in the main account summary.
                </p>
              </div>
            </div>
            <Button type="button" onClick={onEditBusiness}>
              Edit Business Details
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing & Wallet</CardTitle>
            <CardDescription>Wallet funds can pay order invoices and are used first for future renewals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]">Wallet balance</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-950">${Number(user?.accountBalance || 0).toFixed(0)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]">Saved card</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {user?.defaultPaymentMethodLast4 ? `Ending in ${user.defaultPaymentMethodLast4}` : "No card saved"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/portal/payments?section=instant-topup" className="inline-flex">
                <Button>Top Up Wallet</Button>
              </Link>
              <Link href="/portal/payments?section=saved-card" className="inline-flex">
                <Button variant="ghost">Manage Saved Card</Button>
              </Link>
            </div>
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
  const assignedCount = selectedIds.length;

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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-slate-950">{delegate.displayName}</p>
            <StatusBadge status={delegate.isActive ? "active" : "disabled"} />
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">@{delegate.username}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {assignedCount} assigned service{assignedCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              Tickets and credential view only
            </span>
          </div>
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

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-950">Service access</p>
          <p className="text-xs font-medium text-slate-500">Select exactly what this agent can view.</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
        {subscriptions.map((subscription) => {
          const id = String(subscription._id);
          return (
            <label key={id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 transition hover:border-brand-200 hover:bg-brand-50/40">
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
        {!subscriptions.length ? <p className="mt-3 text-sm text-slate-500">Active services appear here after provisioning.</p> : null}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)] xl:items-end">
        <Button type="button" variant="ghost" disabled={state.saving} onClick={() => patchDelegate({ subscriptionIds: selectedIds })}>
          <Save className="h-4 w-4" />
          {state.saving ? "Saving..." : "Save services"}
        </Button>
        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleResetPassword}>
          <div>
            <FieldLabel>New password</FieldLabel>
            <PasswordField
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button type="submit" variant="ghost" disabled={state.passwordSaving || password.length < 8}>
            <RefreshCcw className="h-4 w-4" />
            {state.passwordSaving ? "Resetting..." : "Reset password"}
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
  const activeDelegates = delegates.filter((delegate) => delegate.isActive).length;

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
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Active agents</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{activeDelegates}</p>
          <p className="mt-1 text-sm text-slate-500">{delegates.length} total agent{delegates.length === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Assignable services</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{subscriptions.length}</p>
          <p className="mt-1 text-sm text-slate-500">Active subscriptions available for agent access.</p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-sky-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">Permission model</p>
          <p className="mt-3 text-base font-semibold text-slate-950">Ticket + credential view</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Agents only see the services selected by the account owner.</p>
        </div>
      </div>

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
                <PasswordField
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <FieldLabel>Assigned services</FieldLabel>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {subscriptions.map((subscription) => {
                  const id = String(subscription._id);
                  return (
                    <label key={id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-brand-200 hover:bg-brand-50/40">
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
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={state.saving || !form.subscriptionIds.length}>
                <KeyRound className="h-4 w-4" />
                {state.saving ? "Creating..." : "Create agent"}
              </Button>
              <p className="text-xs leading-5 text-slate-500">Select at least one service before creating access.</p>
            </div>
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

function AccountActivityPanel() {
  const activityQuery = useCustomerQuery({
    queryKey: ["portal-activity"],
    path: "/profile/activity",
  });

  return (
    <PortalActivityPanel
      activities={activityQuery.data?.activities || []}
      loading={activityQuery.isLoading}
      title="Account Activity"
      description="Review and filter activity connected to your account, services, payments, and support."
      maxItems={12}
      emptyMessage="No account activity has been recorded yet."
    />
  );
}

function SupportSecurityPanel() {
  const supportPinQuery = useCustomerQuery({
    queryKey: ["portal-support-pin"],
    path: "/profile/support-pin",
  });
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const supportPin = supportPinQuery.data?.supportPin || "";

  async function copySupportPin() {
    if (!supportPin || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(supportPin);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (supportPinQuery.isLoading && !supportPinQuery.data) {
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
          <CardTitle>Support PIN</CardTitle>
          <CardDescription>Use this private 6-digit PIN when the website support widget needs to confirm your customer account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Your private support PIN</p>
                <p className="mt-3 font-mono text-3xl font-semibold tracking-[0.28em] text-slate-950">
                  {visible ? supportPin : "••••••"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" onClick={() => setVisible((current) => !current)}>
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {visible ? "Hide PIN" : "Reveal PIN"}
                </Button>
                <Button type="button" variant="ghost" onClick={copySupportPin} disabled={!supportPin}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy PIN"}
                </Button>
              </div>
            </div>
          </div>

          {supportPinQuery.error ? (
            <p className="text-sm font-medium text-rose-600">{supportPinQuery.error.message}</p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-950">What it verifies</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900/80">
                The PIN confirms that a signed-in support request belongs to this customer account before account context is attached.
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">Keep it private</p>
              <p className="mt-2 text-sm leading-6 text-amber-900/80">
                ElevenOrbits staff will only request it through the secure website widget. Never send it in public messages or screenshots.
              </p>
            </div>
          </div>
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
            ) : tab === "security" && !isDelegate ? (
              <SupportSecurityPanel />
            ) : tab === "activity" ? (
              <AccountActivityPanel />
            ) : (
              <AccountForm embedded />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
