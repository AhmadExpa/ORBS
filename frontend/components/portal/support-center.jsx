"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { LifeBuoy } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, FieldLabel, Select, StatusBadge, TextArea, TextInput } from "@/lib/ui";
import { Topbar } from "@/components/shared/topbar";
import { useCustomerQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";

export function SupportCenter() {
  const { getToken, userId } = useAuth();
  const { showToast } = useActionToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const { data, refetch, isLoading } = useCustomerQuery({
    queryKey: ["portal-tickets"],
    path: "/tickets",
  });
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-profile"],
    path: "/profile/me",
  });
  const subscriptionsQuery = useCustomerQuery({
    queryKey: ["portal-subscriptions"],
    path: "/subscriptions",
  });
  const [form, setForm] = useState({
    subject: "",
    category: "general",
    priority: "medium",
    subscriptionId: "",
    serviceId: "",
    message: "",
  });
  const [state, setState] = useState({ saving: false, message: "", error: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ saving: true, message: "", error: "" });

    try {
      const token = userId ? await getToken() : undefined;
      await apiFetch("/tickets", {
        method: "POST",
        token,
        authMode: userId ? "customer" : "delegate",
        body: form,
      });
      setForm({
        subject: "",
        category: "general",
        priority: "medium",
        subscriptionId: "",
        serviceId: "",
        message: "",
      });
      await refetch();
      setState({ saving: false, message: "Ticket created successfully.", error: "" });
      showToast({
        type: "success",
        action: "Support Ticket",
        title: "Ticket created",
        description: "Your support request has been added to the queue.",
      });
    } catch (error) {
      setState({ saving: false, message: "", error: error.message });
      showToast({
        type: "error",
        action: "Support Ticket",
        title: "Ticket creation failed",
        description: error.message,
      });
    }
  }

  const tickets = data?.tickets || [];
  const subscriptions = subscriptionsQuery.data?.subscriptions || [];
  const isDelegate = profileQuery.data?.actorType === "delegate";
  const isAgent = pathname?.startsWith("/agent") || isDelegate;
  const visibleTickets = statusFilter ? tickets.filter((ticket) => (ticket.status || "open") === statusFilter) : tickets;

  if (isLoading && !data) {
    return <PageLoader title="Loading support" subtitle="Fetching your ticket history…" />;
  }

  return (
    <div>
      <Topbar title="Support" subtitle="Open a ticket, track its status, and continue the conversation with our team." />
      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-6 md:p-8">
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">How support works</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Reach the ElevenOrbits team with the right context.</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                  Open a ticket for billing, your managed servers, AI workloads, or automation. Add the details we need up front and we'll reply right here — every message stays on the thread.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["Full ticket history", "Linked to your services", "Threaded replies", "Priority escalation"].map((item) => (
                    <span key={item} className="rounded-full border border-line bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-slate-50/60 p-5 xl:justify-self-end">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <LifeBuoy className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Support desk</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.01em] text-slate-900">Clear details get a faster resolution.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Tell us which service is affected and what you expected to happen — it helps us fix things on the first reply.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <CardTitle>Your tickets</CardTitle>
              <CardDescription>Open a ticket to view the full conversation and replies.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    key: "subject",
                    label: "Subject",
                    render: (row) => (
                      <Link className="font-semibold text-brand-700 hover:text-brand-600" href={isAgent ? `/agent/support/${row._id}` : `/portal/support/${row._id}`}>
                        {row.subject}
                      </Link>
                    ),
                  },
                  { key: "category", label: "Category", render: (row) => <span className="capitalize">{row.category || "general"}</span> },
                  { key: "priority", label: "Priority", render: (row) => <span className="capitalize">{row.priority || "medium"}</span> },
                  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                ]}
                rows={visibleTickets}
                emptyMessage={
                  isLoading
                    ? "Loading tickets…"
                    : statusFilter
                      ? "No tickets match this filter."
                      : "No tickets yet — open one on the right whenever you need a hand."
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open a ticket</CardTitle>
              <CardDescription>Describe the issue and our team will reply on this thread.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <FieldLabel>Subject</FieldLabel>
                  <TextInput
                    value={form.subject}
                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                    placeholder="e.g. VPS not reachable after reboot"
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>Category</FieldLabel>
                    <Select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                      <option value="general">General</option>
                      <option value="billing">Billing &amp; payments</option>
                      <option value="hosting">Managed hosting / VPS</option>
                      <option value="ai">AI &amp; automation</option>
                      <option value="workflow">Workflow automation</option>
                      <option value="account">Account &amp; access</option>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Priority</FieldLabel>
                    <Select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </Select>
                  </div>
                </div>
                <div>
                  <FieldLabel>Service</FieldLabel>
                  <Select
                    value={form.subscriptionId}
                    onChange={(event) => {
                      const subscription = subscriptions.find((item) => String(item._id) === event.target.value);
                      setForm((current) => ({
                        ...current,
                        subscriptionId: event.target.value,
                        serviceId: subscription?.productPlanId?.serviceType || subscription?.productPlanId?.slug || "",
                      }));
                    }}
                    required={isDelegate}
                  >
                    <option value="">{isDelegate ? "Choose assigned service" : "General account ticket"}</option>
                    {subscriptions.map((subscription) => (
                      <option key={subscription._id} value={subscription._id}>
                        {subscription.productPlanId?.name || "Managed Service"}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <FieldLabel>Describe the issue</FieldLabel>
                  <TextArea
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    placeholder="What happened, which service is affected, and what you expected instead."
                    required
                  />
                </div>
                {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
                {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
                <Button className="w-full" type="submit" disabled={state.saving}>
                  {state.saving ? "Creating…" : "Submit ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
