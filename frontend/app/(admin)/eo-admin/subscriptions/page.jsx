"use client";

import { useEffect, useMemo, useState } from "react";
import { Cloud, KeyRound, Search, Server, ShieldCheck } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldLabel,
  Select,
  StatusBadge,
  TextInput,
  cn,
} from "@/lib/ui";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

const SERVER_CATEGORY_SLUGS = new Set(["vps", "vds"]);
const EDGE_STORAGE_CATEGORY_SLUGS = new Set(["cdn", "object-storage"]);
const APP_HOSTING_CATEGORY_SLUGS = new Set(["hermes-ai-hosting", "openclaw-hosting", "nextcloud-hosting"]);
const HIDDEN_CUSTOMER_STATUSES = new Set(["suspended", "blocked"]);

function customerAccountStatus(subscription) {
  return subscription?.userId?.accountStatus || "active";
}

function canShowSubscription(subscription) {
  return !HIDDEN_CUSTOMER_STATUSES.has(customerAccountStatus(subscription));
}

function isServerSubscription(subscription) {
  return SERVER_CATEGORY_SLUGS.has(subscription?.productPlanId?.categoryId?.slug);
}

function isEdgeStorageSubscription(subscription) {
  return EDGE_STORAGE_CATEGORY_SLUGS.has(subscription?.productPlanId?.categoryId?.slug);
}

function isAppHostingSubscription(subscription) {
  return APP_HOSTING_CATEGORY_SLUGS.has(subscription?.productPlanId?.categoryId?.slug);
}

function hasAccessAssigned(subscription) {
  return Boolean(subscription?.serviceAccess?.username || subscription?.serviceAccess?.password || subscription?.serviceAccess?.ipAddress);
}

function credentialState(subscription) {
  if (!isServerSubscription(subscription) && !isAppHostingSubscription(subscription)) {
    return "na";
  }
  return hasAccessAssigned(subscription) ? "assigned" : "pending";
}

function createDetailRow() {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: "", value: "" };
}

function mapDetailsForForm(sharedDetails = []) {
  const rows = sharedDetails.map((item, index) => ({
    id: `${index}-${item.label || "detail"}`,
    label: item.label || "",
    value: item.value || "",
  }));
  return rows.length ? rows : [createDetailRow()];
}

export default function AdminSubscriptionsPage() {
  const { data, refetch, isLoading } = useStaffQuery({ queryKey: ["admin-subscriptions"], path: "/admin/subscriptions" });
  const { showToast } = useActionToast();
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ username: "", password: "", ipAddress: "" });
  const [sharedDetails, setSharedDetails] = useState([createDetailRow()]);
  const [state, setState] = useState({ saving: false, message: "", error: "" });

  const subscriptions = (data?.subscriptions || []).filter(canShowSubscription);

  const pendingCredentialCount = useMemo(
    () => subscriptions.filter((item) => credentialState(item) === "pending" && !["cancelled", "expired"].includes(item.status)).length,
    [subscriptions],
  );

  const visibleSubscriptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subscriptions.filter((sub) => {
      if (filter === "needs-credentials" && !(credentialState(sub) === "pending" && !["cancelled", "expired"].includes(sub.status))) {
        return false;
      }
      if (filter === "servers" && !isServerSubscription(sub)) {
        return false;
      }
      if (filter === "edge-storage" && !isEdgeStorageSubscription(sub)) {
        return false;
      }
      if (filter === "app-hosting" && !isAppHostingSubscription(sub)) {
        return false;
      }
      if (["active", "cancelled", "expired"].includes(filter) && sub.status !== filter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [sub.userId?.name, sub.userId?.email, sub.productPlanId?.name].some((field) =>
        String(field || "").toLowerCase().includes(term),
      );
    });
  }, [subscriptions, search, filter]);

  const selectedSubscription = subscriptions.find((item) => item._id === selectedId) || null;

  useEffect(() => {
    if (!visibleSubscriptions.length) {
      return;
    }
    if (!visibleSubscriptions.some((item) => item._id === selectedId)) {
      setSelectedId(visibleSubscriptions[0]._id);
    }
  }, [visibleSubscriptions, selectedId]);

  useEffect(() => {
    if (!selectedSubscription) {
      setForm({ username: "", password: "", ipAddress: "" });
      setSharedDetails([createDetailRow()]);
      return;
    }
    setForm({
      username: selectedSubscription.serviceAccess?.username || "",
      password: selectedSubscription.serviceAccess?.password || "",
      ipAddress: selectedSubscription.serviceAccess?.ipAddress || "",
    });
    setSharedDetails(mapDetailsForForm(selectedSubscription.sharedDetails));
  }, [selectedSubscription?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedSubscription) {
      return;
    }
    setState({ saving: true, message: "", error: "" });
    try {
      await apiFetch(`/admin/subscriptions/${selectedSubscription._id}/access`, {
        method: "PATCH",
        authMode: "staff",
        body: {
          ...form,
          sharedDetails: sharedDetails
            .map((item) => ({ label: item.label.trim(), value: item.value.trim() }))
            .filter((item) => item.label && item.value),
        },
      });
      await refetch();
      setState({ saving: false, message: "Subscription details saved.", error: "" });
      showToast({
        type: "success",
        action: "Subscriptions",
        title: "Subscription updated",
        description: "Credentials and shared details have been saved and are now visible to the customer.",
      });
    } catch (error) {
      setState({ saving: false, message: "", error: error.message });
      showToast({ type: "error", action: "Subscriptions", title: "Update failed", description: error.message });
    }
  }

  const selectedIsServer = isServerSubscription(selectedSubscription);
  const selectedIsEdgeStorage = isEdgeStorageSubscription(selectedSubscription);
  const selectedIsAppHosting = isAppHostingSubscription(selectedSubscription);
  const selectedUsesAccess = selectedIsServer || selectedIsAppHosting;
  const selectedCustomerNote = String(selectedSubscription?.metadata?.customerNote || "").trim();
  const detailLabelPlaceholder = selectedIsAppHosting
    ? "App URL / SSH host / Setup status"
    : selectedIsEdgeStorage
      ? "CDN hostname / S3 endpoint"
      : "Label";
  const detailValuePlaceholder = selectedIsAppHosting
    ? "https://app.example.com / 203.0.113.10 / Ready"
    : selectedIsEdgeStorage
      ? "cdn.example.com / s3.example.com"
      : "Value";

  if (isLoading && !data) {
    return <PageLoader title="Loading subscriptions" subtitle="Gathering subscriptions and provisioning details…" />;
  }

  return (
    <div>
      <Topbar
        title="Subscriptions & Services"
        subtitle="Assign VPS/VDS credentials and publish app, CDN, storage, and managed service details to the customer's portal."
      />
      <div className="p-6 md:p-8">
        {pendingCredentialCount > 0 ? (
          <button
            type="button"
            onClick={() => setFilter("needs-credentials")}
            className="mb-6 flex w-full items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
          >
            <KeyRound className="h-4 w-4" />
            {pendingCredentialCount} active server or app subscription{pendingCredentialCount === 1 ? "" : "s"} still need access details - click to filter.
          </button>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
          {/* Subscription list */}
          <Card className="h-fit">
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div>
                  <CardTitle>Subscriptions</CardTitle>
                  <CardDescription>Select a subscription to manage its access and shared details.</CardDescription>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <TextInput
                      className="pl-9"
                      placeholder="Search customer or plan…"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  <Select className="sm:w-52" value={filter} onChange={(event) => setFilter(event.target.value)}>
                    <option value="">All subscriptions</option>
                    <option value="needs-credentials">Needs credentials</option>
                    <option value="servers">VPS / VDS only</option>
                    <option value="edge-storage">CDN / Storage only</option>
                    <option value="app-hosting">Apps / Agents only</option>
                    <option value="active">Active</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {visibleSubscriptions.map((subscription) => {
                const cred = credentialState(subscription);
                const isSelected = selectedId === subscription._id;
                const sharedDetailCount = subscription.sharedDetails?.length || 0;
                return (
                  <button
                    type="button"
                    key={subscription._id}
                    onClick={() => {
                      setSelectedId(subscription._id);
                      setState((current) => ({ ...current, message: "", error: "" }));
                    }}
                    className={cn(
                      "w-full rounded-lg border p-3.5 text-left transition-colors",
                      isSelected ? "border-brand-300 bg-brand-50/60 ring-1 ring-brand-200" : "border-line bg-white hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{subscription.productPlanId?.name || "Managed service"}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {subscription.userId?.name || "Unknown customer"} · {subscription.productPlanId?.categoryId?.name || "Service"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{subscription.userId?.email || "No customer email"}</p>
                      </div>
                      <StatusBadge status={subscription.status} />
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      {cred === "assigned" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <ShieldCheck className="h-3 w-3" /> Credentials assigned
                        </span>
                      ) : cred === "pending" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                          <KeyRound className="h-3 w-3" /> Needs access
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                          {isEdgeStorageSubscription(subscription) ? <Cloud className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                          {sharedDetailCount ? "Shared details published" : "Shared details only"}
                        </span>
                      )}
                      <span className="text-[11px] font-medium text-slate-400">
                        {sharedDetailCount} shared detail{sharedDetailCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </button>
                );
              })}
              {!visibleSubscriptions.length ? (
                <p className="rounded-lg border border-dashed border-line bg-slate-50 p-5 text-sm font-medium text-slate-500">
                  {search || filter ? "No subscriptions match your filters." : "No subscriptions yet."}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* Management panel */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Manage access &amp; details</CardTitle>
              <CardDescription>Saved fields appear in the customer's subscription page in their portal.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedSubscription ? (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="rounded-lg border border-line bg-slate-50/70 p-4 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-900">Customer:</span> {selectedSubscription.userId?.name || "Unknown"}</p>
                    <p className="mt-1"><span className="font-semibold text-slate-900">Email:</span> {selectedSubscription.userId?.email || "No customer email"}</p>
                    <p className="mt-1"><span className="font-semibold text-slate-900">Plan:</span> {selectedSubscription.productPlanId?.name || "Managed service"} · {selectedSubscription.productPlanId?.categoryId?.name || "Service"}</p>
                    {selectedSubscription.serviceAccess?.assignedAt ? (
                      <p className="mt-1"><span className="font-semibold text-slate-900">Access updated:</span> {new Date(selectedSubscription.serviceAccess.assignedAt).toLocaleString()}</p>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-line bg-white p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Customer deployment note</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">
                      {selectedCustomerNote || "No provisioning note was included with this order."}
                    </p>
                  </div>

                  {selectedUsesAccess ? (
                    <div className="space-y-4 rounded-lg border border-line p-4">
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                          {selectedIsAppHosting ? <Cloud className="h-4 w-4" /> : <Server className="h-4 w-4" />}
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            {selectedIsAppHosting ? "Application and server access" : "Server access (VPS / VDS)"}
                          </h3>
                          <p className="mt-0.5 text-xs leading-5 text-slate-500">
                            {selectedIsAppHosting
                              ? "Shown to the customer on this subscription. Use shared details below for app URL, setup status, provider notes, and admin handoff fields."
                              : "Shown to the customer on this subscription. Fill all three to mark credentials as assigned."}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <FieldLabel>IP address</FieldLabel>
                          <TextInput placeholder="203.0.113.10" value={form.ipAddress} onChange={(event) => setForm((c) => ({ ...c, ipAddress: event.target.value }))} />
                        </div>
                        <div>
                          <FieldLabel>Username</FieldLabel>
                          <TextInput placeholder="root" value={form.username} onChange={(event) => setForm((c) => ({ ...c, username: event.target.value }))} />
                        </div>
                        <div>
                          <FieldLabel>Password</FieldLabel>
                          <TextInput type="text" placeholder="Server password" value={form.password} onChange={(event) => setForm((c) => ({ ...c, password: event.target.value }))} />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-4 rounded-lg border border-line p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Shared details</h3>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          {selectedIsAppHosting
                            ? "Use these fields for app URL, setup status, admin dashboard, SSH tunnel notes, model/provider details, backup status, domain, and integration handoff."
                            : selectedIsEdgeStorage
                            ? "Use these fields for CDN hostnames, origins, cache notes, storage region, bucket endpoints, ACL notes, and API access handoff."
                            : "Custom label/value pairs the customer sees in the portal."}
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => setSharedDetails((current) => [...current, createDetailRow()])}>
                        Add
                      </Button>
                    </div>
                    {sharedDetails.map((item) => (
                      <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <TextInput
                          placeholder={detailLabelPlaceholder}
                          value={item.label}
                          onChange={(event) => setSharedDetails((c) => c.map((d) => (d.id === item.id ? { ...d, label: event.target.value } : d)))}
                        />
                        <TextInput
                          placeholder={detailValuePlaceholder}
                          value={item.value}
                          onChange={(event) => setSharedDetails((c) => c.map((d) => (d.id === item.id ? { ...d, value: event.target.value } : d)))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setSharedDetails((current) => (current.length === 1 ? [createDetailRow()] : current.filter((d) => d.id !== item.id)))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>

                  {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
                  {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}

                  <div className="flex gap-3">
                    <Button type="submit" disabled={state.saving}>
                      {state.saving ? "Saving…" : "Save & publish"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={state.saving}
                      onClick={() => {
                        setForm({ username: "", password: "", ipAddress: "" });
                        setSharedDetails([createDetailRow()]);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-slate-500">Select a subscription from the list to manage it.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
