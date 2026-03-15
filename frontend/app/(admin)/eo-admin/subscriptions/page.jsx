"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge, TextInput } from "@/lib/ui";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

const SERVER_CATEGORY_SLUGS = new Set(["vps", "vds"]);

function isServerSubscription(subscription) {
  return SERVER_CATEGORY_SLUGS.has(subscription?.productPlanId?.categoryId?.slug);
}

function createDetailRow() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: "",
    value: "",
  };
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
  const { data, refetch, isLoading } = useStaffQuery({
    queryKey: ["admin-subscriptions"],
    path: "/admin/subscriptions",
  });
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    username: "",
    password: "",
    ipAddress: "",
  });
  const [sharedDetails, setSharedDetails] = useState([createDetailRow()]);
  const [state, setState] = useState({
    saving: false,
    message: "",
    error: "",
  });

  const subscriptions = data?.subscriptions || [];
  const selectedSubscription = subscriptions.find((item) => item._id === selectedId) || null;

  useEffect(() => {
    if (!subscriptions.length) {
      setSelectedId("");
      return;
    }

    if (!subscriptions.some((item) => item._id === selectedId)) {
      setSelectedId(subscriptions[0]._id);
    }
  }, [subscriptions, selectedId]);

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
  }, [
    selectedSubscription?._id,
    selectedSubscription?.serviceAccess?.username,
    selectedSubscription?.serviceAccess?.password,
    selectedSubscription?.serviceAccess?.ipAddress,
    selectedSubscription?.sharedDetails,
  ]);

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
            .map((item) => ({
              label: item.label.trim(),
              value: item.value.trim(),
            }))
            .filter((item) => item.label && item.value),
        },
      });
      await refetch();
      setState({ saving: false, message: "Subscription details saved.", error: "" });
    } catch (error) {
      setState({ saving: false, message: "", error: error.message });
    }
  }

  const selectedIsServer = isServerSubscription(selectedSubscription);

  return (
    <div>
      <Topbar title="Subscriptions" subtitle="Inspect subscriptions, assign server credentials, and define custom label/value details shared to customers." />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>All Subscriptions</CardTitle>
            <CardDescription>Customer subscriptions, lifecycle state, credential status, and shared detail counts.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "customer", label: "Customer", render: (row) => row.userId?.name || "Unknown" },
                { key: "plan", label: "Plan", render: (row) => row.productPlanId?.name || "Managed Service" },
                { key: "category", label: "Category", render: (row) => row.productPlanId?.categoryId?.name || "Service" },
                { key: "billingCycle", label: "Cycle" },
                { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                {
                  key: "credentials",
                  label: "Credentials",
                  render: (row) => {
                    const hasAccess = Boolean(row.serviceAccess?.username || row.serviceAccess?.password || row.serviceAccess?.ipAddress);
                    return isServerSubscription(row) ? (hasAccess ? "Assigned" : "Pending") : "N/A";
                  },
                },
                {
                  key: "sharedDetails",
                  label: "Shared Details",
                  render: (row) => row.sharedDetails?.length || 0,
                },
              ]}
              rows={subscriptions}
              emptyMessage={isLoading ? "Loading subscriptions..." : "No subscriptions found."}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Detail Queue</CardTitle>
                <CardDescription>Select any subscription to define shared label/value details. VPS and VDS also support server credentials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptions.map((subscription) => {
                  const hasAccess = Boolean(subscription.serviceAccess?.username || subscription.serviceAccess?.password || subscription.serviceAccess?.ipAddress);
                  const detailsCount = subscription.sharedDetails?.length || 0;
                  const subscriptionIsServer = isServerSubscription(subscription);

                  return (
                    <div
                      key={subscription._id}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${selectedId === subscription._id ? "border-sky-300 bg-sky-50/40" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                      onClick={() => {
                        setSelectedId(subscription._id);
                        setState((current) => ({ ...current, message: "", error: "" }));
                      }}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-semibold text-slate-950">{subscription.productPlanId?.name || "Managed Server"}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {subscription.userId?.name || "Unknown customer"}
                            {" · "}
                            {subscription.productPlanId?.categoryId?.name || "Service"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {subscriptionIsServer
                              ? subscription.serviceAccess?.ipAddress || (hasAccess ? "Credential set saved" : "Waiting for credentials")
                              : `${detailsCount} shared detail${detailsCount === 1 ? "" : "s"}`}
                          </p>
                        </div>
                        <StatusBadge status={subscription.status} />
                      </div>
                    </div>
                  );
                })}
                {!subscriptions.length && !isLoading ? (
                  <p className="text-sm text-slate-500">No subscriptions are available yet.</p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Manage Shared Portal Details</CardTitle>
              <CardDescription>The saved fields will be visible to the customer inside the subscription detail page in their portal.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedSubscription ? (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-900">Customer:</span> {selectedSubscription.userId?.name || "Unknown"}</p>
                    <p><span className="font-semibold text-slate-900">Plan:</span> {selectedSubscription.productPlanId?.name || "Managed Service"}</p>
                    <p><span className="font-semibold text-slate-900">Category:</span> {selectedSubscription.productPlanId?.categoryId?.name || "Service"}</p>
                    {selectedSubscription.serviceAccess?.assignedAt ? (
                      <p><span className="font-semibold text-slate-900">Last updated:</span> {new Date(selectedSubscription.serviceAccess.assignedAt).toLocaleString()}</p>
                    ) : null}
                  </div>

                  {selectedIsServer ? (
                    <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Server Credentials</h3>
                        <p className="mt-1 text-sm text-slate-500">Visible to the customer for VPS and VDS subscriptions.</p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">IP Address</label>
                        <TextInput
                          placeholder="203.0.113.10"
                          value={form.ipAddress}
                          onChange={(event) => setForm((current) => ({ ...current, ipAddress: event.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                        <TextInput
                          placeholder="root"
                          value={form.username}
                          onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                        <TextInput
                          type="text"
                          placeholder="Server password"
                          value={form.password}
                          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Custom Shared Details</h3>
                        <p className="mt-1 text-sm text-slate-500">Define custom labels and values that the customer will see in the portal.</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setSharedDetails((current) => [...current, createDetailRow()])}
                      >
                        Add Detail
                      </Button>
                    </div>

                    {sharedDetails.map((item) => (
                      <div key={item.id} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                        <TextInput
                          placeholder="Label"
                          value={item.label}
                          onChange={(event) =>
                            setSharedDetails((current) =>
                              current.map((detail) => (detail.id === item.id ? { ...detail, label: event.target.value } : detail)),
                            )
                          }
                        />
                        <TextInput
                          placeholder="Value"
                          value={item.value}
                          onChange={(event) =>
                            setSharedDetails((current) =>
                              current.map((detail) => (detail.id === item.id ? { ...detail, value: event.target.value } : detail)),
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setSharedDetails((current) => {
                              if (current.length === 1) {
                                return [createDetailRow()];
                              }

                              return current.filter((detail) => detail.id !== item.id);
                            })
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
                      {state.saving ? "Saving..." : "Save Credentials"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={state.saving}
                      onClick={() => {
                        setForm({ username: "", password: "", ipAddress: "" });
                        setSharedDetails([createDetailRow()]);
                      }}
                    >
                      Clear Draft
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-slate-500">Select a server subscription to manage its credentials.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
