"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge, TextArea, TextInput } from "@/lib/ui";
import { Topbar } from "@/components/shared/topbar";
import { useCustomerQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";

export function SupportCenter() {
  const { getToken } = useAuth();
  const { showToast } = useActionToast();
  const { data, refetch, isLoading } = useCustomerQuery({
    queryKey: ["portal-support"],
    path: "/tickets",
  });
  const [form, setForm] = useState({
    subject: "",
    category: "general",
    priority: "medium",
    message: "",
  });
  const [state, setState] = useState({ saving: false, message: "", error: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ saving: true, message: "", error: "" });

    try {
      const token = await getToken();
      await apiFetch("/tickets", {
        method: "POST",
        token,
        body: form,
      });
      setForm({
        subject: "",
        category: "general",
        priority: "medium",
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

  if (isLoading && !data) {
    return <PageLoader title="Support Tickets" subtitle="Loading ticket history and support form..." cardCount={2} lines={4} />;
  }

  return (
    <div>
      <Topbar title="Support Tickets" subtitle="Open tickets, review history, and reply in threaded conversations." />
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Ticket History</CardTitle>
            <CardDescription>Each ticket can be linked to a subscription or service.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  key: "subject",
                  label: "Subject",
                  render: (row) => (
                    <Link className="font-semibold text-sky-700" href={`/portal/support/${row._id}`}>
                      {row.subject}
                    </Link>
                  ),
                },
                { key: "category", label: "Category" },
                { key: "priority", label: "Priority" },
                { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
              ]}
              rows={tickets}
              emptyMessage={isLoading ? "Loading tickets..." : "No tickets created yet."}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Create Ticket</CardTitle>
            <CardDescription>Describe the issue and ElevenOrbits support will reply from the admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
                <TextInput value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                  <TextInput value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                    value={form.priority}
                    onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Issue Description</label>
                <TextArea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} required />
              </div>
              {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
              {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
              <Button className="w-full" type="submit" disabled={state.saving}>
                {state.saving ? "Creating..." : "Create Ticket"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
