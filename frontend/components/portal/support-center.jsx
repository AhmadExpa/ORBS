"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  ArrowUpRight,
  ChevronRight,
  Clock3,
  Inbox,
  LifeBuoy,
  MessageSquareText,
} from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FieldLabel, Select, StatusBadge, TextArea, TextInput } from "@/lib/ui";
import { Topbar } from "@/components/shared/topbar";
import { useCustomerQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";

function formatTicketDate(value) {
  if (!value) return "Recently updated";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
      const response = await apiFetch("/tickets", {
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
      setState({
        saving: false,
        message: `Ticket ${response.ticket?.ticketNumber || response.ticket?._id || ""} created successfully.`,
        error: "",
      });
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
      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-4 sm:p-6 md:p-8">
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
          <Card className="overflow-hidden rounded-2xl shadow-[0_18px_55px_-38px_rgba(15,23,42,0.35)]">
            <CardHeader className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                    <MessageSquareText className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle>Your support conversations</CardTitle>
                    <CardDescription className="mt-1">Select any ticket to open its full history and reply to the team.</CardDescription>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                  {visibleTickets.length} {visibleTickets.length === 1 ? "ticket" : "tickets"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {visibleTickets.length ? (
                <div className="divide-y divide-slate-100">
                  {visibleTickets.map((ticket) => (
                    <Link
                      key={ticket._id}
                      href={isAgent ? `/agent/support/${ticket._id}` : `/portal/support/${ticket._id}`}
                      className="group grid gap-4 px-5 py-5 transition hover:bg-sky-50/40 focus:outline-none focus-visible:bg-sky-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 sm:grid-cols-[minmax(0,1.7fr)_minmax(150px,0.7fr)_auto] sm:items-center sm:px-6"
                    >
                      <div className="flex min-w-0 items-start gap-3.5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition group-hover:border-sky-200 group-hover:bg-white group-hover:text-sky-700 group-hover:shadow-sm">
                          <Inbox className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-950 transition group-hover:text-sky-800">{ticket.subject}</p>
                            <StatusBadge status={ticket.status} className="sm:hidden" />
                          </div>
                          <p className="mt-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                            {ticket.ticketNumber || ticket._id}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pl-[58px] text-xs sm:block sm:pl-0">
                        <div>
                          <p className="font-semibold capitalize text-slate-700">{ticket.category || "General"}</p>
                          <p className="mt-1 capitalize text-slate-400">{ticket.priority || "Medium"} priority</p>
                        </div>
                        <div className="sm:mt-2">
                          <p className="flex items-center gap-1.5 text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatTicketDate(ticket.updatedAt || ticket.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pl-[58px] sm:justify-end sm:pl-0">
                        <StatusBadge status={ticket.status} className="hidden sm:inline-flex" />
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800">
                          Open conversation
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                    <Inbox className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-950">
                    {isLoading ? "Loading tickets…" : statusFilter ? "No tickets match this filter" : "No support conversations yet"}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    {statusFilter
                      ? "Choose a different status from the sidebar to see more conversations."
                      : "When you need help, create a ticket and the full conversation will stay organized here."}
                  </p>
                  {!statusFilter && !isLoading ? (
                    <Link href="#open-ticket" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
                      Create a support ticket
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="open-ticket" className="h-fit scroll-mt-24 overflow-hidden rounded-2xl shadow-[0_18px_55px_-38px_rgba(15,23,42,0.35)] xl:sticky xl:top-[8.25rem]">
            <CardHeader className="border-slate-800 bg-[linear-gradient(135deg,#07111f_0%,#0f172a_100%)] p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sky-200">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle className="text-white">Open a new ticket</CardTitle>
                  <CardDescription className="mt-1 text-white/55">Give us the key details and we’ll keep every reply in one secure thread.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
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
                <Button className="w-full rounded-xl" type="submit" disabled={state.saving}>
                  {state.saving ? "Creating…" : "Submit ticket"}
                  {!state.saving ? <ArrowUpRight className="h-4 w-4" /> : null}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
