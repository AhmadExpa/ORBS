"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge, TextArea } from "@/lib/ui";
import { Topbar } from "@/components/shared/topbar";
import { useCustomerQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";

export function TicketThread({ ticketId }) {
  const { getToken } = useAuth();
  const { showToast } = useActionToast();
  const { data, refetch, isLoading } = useCustomerQuery({
    queryKey: ["portal-ticket-thread", ticketId],
    path: `/tickets/${ticketId}/messages`,
  });
  const [message, setMessage] = useState("");
  const [state, setState] = useState({ sending: false, error: "" });

  async function handleReply(event) {
    event.preventDefault();
    setState({ sending: true, error: "" });

    try {
      const token = await getToken();
      await apiFetch(`/tickets/${ticketId}/messages`, {
        method: "POST",
        token,
        body: { message },
      });
      setMessage("");
      await refetch();
      setState({ sending: false, error: "" });
      showToast({
        type: "success",
        action: "Ticket Reply",
        title: "Reply sent",
        description: "Your reply has been added to the ticket thread.",
      });
    } catch (error) {
      setState({ sending: false, error: error.message });
      showToast({
        type: "error",
        action: "Ticket Reply",
        title: "Reply failed",
        description: error.message,
      });
    }
  }

  const ticket = data?.ticket;
  const messages = data?.messages || [];

  if (isLoading && !data) {
    return <PageLoader title="Ticket Thread" subtitle="Loading conversation..." cardCount={2} lines={4} />;
  }

  return (
    <div>
      <Topbar title={ticket?.subject || "Ticket Thread"} subtitle={ticket?.category || "Support"} />
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>Reply in-thread and keep the discussion tied to this ticket.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? <p className="text-sm text-slate-500">Loading conversation...</p> : null}
            {messages.map((entry) => (
              <div key={entry._id} className={`rounded-2xl p-4 ${entry.senderType === "customer" ? "bg-sky-50" : "bg-slate-50"}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{entry.displayName || (entry.senderType === "customer" ? "You" : "Support Team")}</p>
                  <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-700">{entry.message}</p>
              </div>
            ))}
            {!messages.length ? <p className="text-sm text-slate-500">No replies yet.</p> : null}
            <form className="space-y-4 rounded-2xl border border-slate-200 p-5" onSubmit={handleReply}>
              <TextArea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add your reply" required />
              {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
              <Button type="submit" disabled={state.sending}>
                {state.sending ? "Sending..." : "Reply"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ticket Status</CardTitle>
            <CardDescription>Current status and priority for this thread.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Status</span>
              <StatusBadge status={ticket?.status || "open"} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Priority</span>
              <span className="font-semibold capitalize text-slate-900">{ticket?.priority || "medium"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
