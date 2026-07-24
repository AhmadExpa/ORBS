"use client";

import { useEffect, useState } from "react";
import { Columns3, Table2 } from "lucide-react";
import {
  Board,
  BoardCard,
  BoardColumn,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  FieldLabel,
  Select,
  StatusBadge,
  TextArea,
  TextInput,
  ViewToggle,
} from "@/lib/ui";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

const TICKET_STATUSES = ["open", "pending", "resolved", "closed"];
const SUPPORT_TEAM_VALUE = "__support_team__";

const STATUS_COLUMNS = [
  { value: "open", label: "Open", accent: "bg-amber-400" },
  { value: "pending", label: "Waiting on us", accent: "bg-brand-500" },
  { value: "resolved", label: "Resolved", accent: "bg-emerald-500" },
  { value: "closed", label: "Closed", accent: "bg-slate-400" },
];

const PRIORITY_STYLES = {
  critical: "bg-rose-50 text-rose-700",
  high: "bg-rose-50 text-rose-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-emerald-50 text-emerald-700",
};

function PriorityTag({ priority }) {
  const value = String(priority || "medium").toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold capitalize ${PRIORITY_STYLES[value] || PRIORITY_STYLES.medium}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {value}
    </span>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString();
}

function formatTicketAge(value) {
  if (!value) {
    return "Just now";
  }

  const created = new Date(value).getTime();
  if (Number.isNaN(created)) {
    return "Just now";
  }

  const days = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
  if (days <= 0) {
    return "Open today";
  }

  return `Open for ${days} day${days === 1 ? "" : "s"}`;
}

function getResponderName(selectedValue, supportAgents, fallbackName = "") {
  if (selectedValue === SUPPORT_TEAM_VALUE) {
    return "Support Team";
  }

  return supportAgents.find((agent) => agent._id === selectedValue)?.name || fallbackName || "Support Team";
}

function ticketRequesterName(ticket) {
  return ticket?.userId?.name || ticket?.requester?.name || ticket?.requester?.email || "Website visitor";
}

function ticketRequesterEmail(ticket) {
  return ticket?.userId?.email || ticket?.requester?.email || "";
}

function humanize(value, fallback = "Not available") {
  const normalized = String(value || "").trim();
  return normalized
    ? normalized.replace(/_/gu, " ").replace(/\b\w/gu, (letter) => letter.toUpperCase())
    : fallback;
}

export function AdminTicketsPage() {
  const { showToast } = useActionToast();
  const ticketsQuery = useStaffQuery({
    queryKey: ["admin-tickets"],
    path: "/admin/tickets",
  });
  const staffUsersQuery = useStaffQuery({
    queryKey: ["admin-ticket-staff-users"],
    path: "/admin/users",
  });
  const [selectedId, setSelectedId] = useState("");
  const [view, setView] = useState("board");
  const detailQuery = useStaffQuery({
    queryKey: ["admin-ticket-thread", selectedId],
    path: `/tickets/${selectedId}/messages`,
    enabled: Boolean(selectedId),
  });
  const [status, setStatus] = useState("pending");
  const [assignedTo, setAssignedTo] = useState("");
  const [respondAs, setRespondAs] = useState(SUPPORT_TEAM_VALUE);
  const [replyMessage, setReplyMessage] = useState("");
  const [updateState, setUpdateState] = useState({ saving: false, message: "", error: "" });
  const [replyState, setReplyState] = useState({ sending: false, message: "", error: "" });

  const tickets = ticketsQuery.data?.tickets || [];
  const currentStaffUser = staffUsersQuery.data?.currentStaffUser;
  const supportAgents = (staffUsersQuery.data?.staffUsers || []).filter((item) => item.role === "support_agent" && item.isActive);
  const selectedFromList = tickets.find((item) => item._id === selectedId);
  const selectedTicket = detailQuery.data?.ticket || selectedFromList;
  const messages = detailQuery.data?.messages || [];
  const selectedAssignedId = selectedTicket?.assignedTo?._id || "";
  const selectedAssignedName = selectedTicket?.assignedTo?.name || "";
  const canChooseResponder = currentStaffUser?.role === "admin";
  const responderName = getResponderName(respondAs, supportAgents, currentStaffUser?.name || selectedAssignedName);
  const selectedRequester = selectedTicket?.requester || {};
  const selectedVisitorNeedsVerification =
    selectedTicket?.requesterType === "visitor" &&
    selectedTicket?.verificationStatus !== "verified";

  useEffect(() => {
    if (!selectedId && tickets.length) {
      setSelectedId(tickets[0]._id);
    }
  }, [selectedId, tickets]);

  useEffect(() => {
    if (!selectedTicket) {
      return;
    }

    setStatus(selectedTicket.status || "open");
    setAssignedTo(selectedAssignedId);
    setRespondAs(canChooseResponder ? selectedAssignedId || SUPPORT_TEAM_VALUE : currentStaffUser?._id || SUPPORT_TEAM_VALUE);
    setUpdateState({ saving: false, message: "", error: "" });
    setReplyState({ sending: false, message: "", error: "" });
  }, [canChooseResponder, currentStaffUser?._id, selectedAssignedId, selectedAssignedName, selectedTicket?._id, selectedTicket?.status]);

  async function refreshTicketData() {
    await Promise.all([
      ticketsQuery.refetch(),
      selectedId ? detailQuery.refetch() : Promise.resolve(),
    ]);
  }

  async function handleUpdate() {
    if (!selectedId) {
      return;
    }

    setUpdateState({ saving: true, message: "", error: "" });

    try {
      await apiFetch(`/admin/tickets/${selectedId}`, {
        method: "PATCH",
        authMode: "staff",
        body: {
          status,
          assignedTo: assignedTo || null,
        },
      });
      await refreshTicketData();
      setUpdateState({ saving: false, message: "Ticket updated.", error: "" });
      showToast({
        type: "success",
        action: "Tickets",
        title: "Ticket updated",
        description: "The ticket workflow and assignment have been saved.",
      });
    } catch (error) {
      setUpdateState({ saving: false, message: "", error: error.message });
      showToast({
        type: "error",
        action: "Tickets",
        title: "Ticket update failed",
        description: error.message,
      });
    }
  }

  async function handleReply(event) {
    event.preventDefault();

    if (!selectedId || !replyMessage.trim()) {
      return;
    }

    setReplyState({ sending: true, message: "", error: "" });

    try {
      const response = await apiFetch(`/tickets/${selectedId}/messages`, {
        method: "POST",
        authMode: "staff",
        body: {
          message: replyMessage.trim(),
          status,
          assignedTo: assignedTo || null,
          publicSenderName: responderName,
        },
      });
      setReplyMessage("");
      await refreshTicketData();
      const emailFailed = response.notification && !response.notification.delivered;
      setReplyState({
        sending: false,
        message: emailFailed ? "Reply saved to the ticket, but the email was not delivered." : "Reply sent.",
        error: "",
      });
      showToast({
        type: emailFailed ? "warning" : "success",
        action: "Tickets",
        title: emailFailed ? "Reply saved; email not delivered" : "Reply sent",
        description: emailFailed
          ? "Review the ticket verification and mail delivery status before following up."
          : `The reply was sent as ${responderName}.`,
      });
    } catch (error) {
      setReplyState({ sending: false, message: "", error: error.message });
      showToast({
        type: "error",
        action: "Tickets",
        title: "Reply failed",
        description: error.message,
      });
    }
  }

  if (ticketsQuery.isLoading && staffUsersQuery.isLoading && !ticketsQuery.data && !staffUsersQuery.data) {
    return <PageLoader title="Tickets Management" subtitle="Loading ticket queue and support routing..." cardCount={3} lines={4} />;
  }

  const openCount = tickets.filter((ticket) => (ticket.status || "open") === "open").length;

  return (
    <div>
      <Topbar
        title="Support tickets"
        subtitle="Triage the customer support queue, route conversations to an agent, and reply under a customer-facing support name."
        actions={
          <ViewToggle
            value={view}
            onChange={setView}
            options={[
              { value: "board", label: "Board", icon: Columns3 },
              { value: "table", label: "Table", icon: Table2 },
            ]}
          />
        }
      />
      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-4 sm:p-6 md:p-8">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Ticket queue</CardTitle>
                <CardDescription>
                  {tickets.length} total · {openCount} open. Select a ticket to inspect the conversation and update routing.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="min-w-0">
              {view === "board" ? (
                <Board className="max-w-full">
                  {STATUS_COLUMNS.map((column) => {
                    const columnTickets = tickets.filter((ticket) => (ticket.status || "open") === column.value);
                    return (
                      <BoardColumn
                        key={column.value}
                        title={column.label}
                        count={columnTickets.length}
                        accentClassName={column.accent}
                        emptyMessage="No tickets"
                      >
                        {columnTickets.map((ticket) => (
                          <BoardCard
                            key={ticket._id}
                            onClick={() => setSelectedId(ticket._id)}
                            className={ticket._id === selectedId ? "ring-2 ring-brand-600/40" : ""}
                          >
                            <p className="text-sm font-semibold leading-5 text-slate-900">{ticket.subject}</p>
                            <p className="mt-1 text-xs text-slate-500">{ticket.ticketNumber || ticket._id} · {formatTicketAge(ticket.createdAt)}</p>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-medium text-slate-500">{ticketRequesterName(ticket)}</span>
                              <PriorityTag priority={ticket.priority} />
                            </div>
                            {ticket.aiTriage?.possibleQuotationRequest || ticket.aiTriage?.requiresUrgentReview ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {ticket.aiTriage.requiresUrgentReview ? (
                                  <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                                    Urgent review
                                  </span>
                                ) : null}
                                {ticket.aiTriage.possibleQuotationRequest ? (
                                  <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                                    Quote intent
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                            <p className="mt-2 truncate text-[11px] font-medium text-slate-400">
                              {ticket.assignedTo?.name ? `Assigned to ${ticket.assignedTo.name}` : "Unassigned"}
                            </p>
                          </BoardCard>
                        ))}
                      </BoardColumn>
                    );
                  })}
                </Board>
              ) : (
                <DataTable
                  columns={[
                    {
                      key: "subject",
                      label: "Subject",
                      render: (row) => (
                        <button
                          type="button"
                          className={`font-semibold ${row._id === selectedId ? "text-slate-900" : "text-brand-700 hover:text-brand-600"}`}
                          onClick={() => setSelectedId(row._id)}
                        >
                          {row.subject}
                        </button>
                      ),
                    },
                    { key: "ticketNumber", label: "Ticket", render: (row) => row.ticketNumber || row._id },
                    { key: "customer", label: "Customer", render: (row) => ticketRequesterName(row) },
                    { key: "assignedTo", label: "Assigned", render: (row) => row.assignedTo?.name || "Unassigned" },
                    { key: "priority", label: "Priority", render: (row) => <PriorityTag priority={row.priority} /> },
                    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  ]}
                  rows={tickets}
                  emptyMessage={ticketsQuery.isLoading ? "Loading tickets..." : "No tickets in the queue yet."}
                />
              )}
            </CardContent>
          </Card>
          <Card className="h-fit min-w-0">
            <CardHeader>
              <CardTitle>Ticket Actions</CardTitle>
              <CardDescription>Adjust the workflow state and route the ticket to an active support agent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FieldLabel>Workflow status</FieldLabel>
                <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                  {TICKET_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel>Assigned agent</FieldLabel>
                <Select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
                  <option value="">Unassigned</option>
                  {supportAgents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name}
                    </option>
                  ))}
                </Select>
              </div>
              {selectedTicket ? (
                <div className="rounded-lg border border-line bg-slate-50 p-4 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-900">Customer:</span> {ticketRequesterName(selectedTicket)}
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold text-slate-900">Ticket:</span> {selectedTicket.ticketNumber || selectedTicket._id}
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold text-slate-900">Verification:</span> {humanize(selectedTicket.verificationStatus, "Legacy ticket")}
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold text-slate-900">Category:</span> {selectedTicket.category || "General"}
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold text-slate-900">Updated:</span> {formatDateTime(selectedTicket.updatedAt)}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-line bg-slate-50 p-4 text-sm text-slate-500">
                  Select a ticket to manage its workflow.
                </div>
              )}
              {updateState.message ? <p className="text-sm font-medium text-emerald-700">{updateState.message}</p> : null}
              {updateState.error ? <p className="text-sm font-medium text-rose-600">{updateState.error}</p> : null}
              <Button className="w-full" onClick={handleUpdate} disabled={updateState.saving || !selectedId}>
                {updateState.saving ? "Saving..." : "Save Ticket"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {selectedTicket ? (
          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>Review the full thread and send a reply using a customer-facing support name.</CardDescription>
              </CardHeader>
              <CardContent className="min-w-0 space-y-4">
                {detailQuery.isLoading ? <p className="text-sm text-slate-500">Loading conversation...</p> : null}
                {messages.map((entry) => (
                  <div key={entry._id} className={`rounded-lg border p-4 ${["customer", "visitor", "customer_delegate"].includes(entry.senderType) ? "border-brand-100 bg-brand-50/60" : "border-line bg-slate-50"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{entry.senderName || entry.displayName || "Unknown sender"}</p>
                        {entry.senderType !== "customer" && entry.publicSenderName && entry.publicSenderName !== entry.senderName ? (
                          <p className="text-xs text-slate-500">Visible to customer as {entry.publicSenderName}</p>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</p>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{entry.message}</p>
                  </div>
                ))}
                {!messages.length && !detailQuery.isLoading ? <p className="text-sm text-slate-500">No replies yet.</p> : null}
                <form className="space-y-4 rounded-lg border border-line bg-slate-50/50 p-5" onSubmit={handleReply}>
                  {selectedVisitorNeedsVerification ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                      This visitor has not verified the email address yet. Email replies remain disabled until verification succeeds.
                    </div>
                  ) : null}
                  <div>
                    <FieldLabel>Respond as</FieldLabel>
                    {canChooseResponder ? (
                      <Select value={respondAs} onChange={(event) => setRespondAs(event.target.value)}>
                        <option value={SUPPORT_TEAM_VALUE}>Support Team</option>
                        {supportAgents.map((agent) => (
                          <option key={agent._id} value={agent._id}>
                            {agent.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <TextInput value={responderName} readOnly />
                    )}
                    <p className="mt-2 text-xs text-slate-500">Customer will see this reply from <span className="font-semibold text-slate-700">{responderName}</span>.</p>
                  </div>
                  <TextArea value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} placeholder="Write a reply to the customer…" required />
                  {replyState.message ? <p className="text-sm font-medium text-emerald-700">{replyState.message}</p> : null}
                  {replyState.error ? <p className="text-sm font-medium text-rose-600">{replyState.error}</p> : null}
                  <Button type="submit" disabled={replyState.sending || !selectedId || selectedVisitorNeedsVerification}>
                    {replyState.sending ? "Sending..." : "Send Reply"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="h-fit min-w-0">
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
                <CardDescription>Customer context and routing details for the selected conversation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                {selectedTicket.aiTriage ? (
                  <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-800">
                        AI-assisted triage
                      </p>
                      <span className="rounded-md border border-sky-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                        Human review required
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium leading-6 text-slate-900">
                      {selectedTicket.aiTriage.summary || "No summary was generated."}
                    </p>
                    {selectedTicket.aiTriage.agentNotes ? (
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        <span className="font-semibold text-slate-800">Routing note:</span>{" "}
                        {selectedTicket.aiTriage.agentNotes}
                      </p>
                    ) : null}
                    {selectedTicket.aiTriage.clarifyingQuestion ? (
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        <span className="font-semibold text-slate-800">Suggested follow-up:</span>{" "}
                        {selectedTicket.aiTriage.clarifyingQuestion}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedTicket.aiTriage.requiresUrgentReview ? (
                        <span className="rounded-md bg-rose-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-800">
                          Urgent review
                        </span>
                      ) : null}
                      {selectedTicket.aiTriage.possibleQuotationRequest ? (
                        <span className="rounded-md bg-sky-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
                          Possible quotation
                        </span>
                      ) : null}
                      {!selectedTicket.aiTriage.available ? (
                        <span className="rounded-md bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                          Rules-based fallback
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-4">
                  <span>Customer</span>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{ticketRequesterName(selectedTicket)}</p>
                    <p>{ticketRequesterEmail(selectedTicket) || "No email available"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Ticket number</span>
                  <span className="font-semibold text-slate-900">{selectedTicket.ticketNumber || selectedTicket._id}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Source</span>
                  <span className="font-semibold text-slate-900">{humanize(selectedTicket.source, "Portal")}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Identity check</span>
                  <span className="font-semibold text-slate-900">{humanize(selectedTicket.verificationStatus, "Legacy ticket")}</span>
                </div>
                {selectedRequester.company ? (
                  <div className="flex items-center justify-between gap-4">
                    <span>Company</span>
                    <span className="font-semibold text-slate-900">{selectedRequester.company}</span>
                  </div>
                ) : null}
                {selectedRequester.phone ? (
                  <div className="flex items-center justify-between gap-4">
                    <span>Phone</span>
                    <span className="font-semibold text-slate-900">{selectedRequester.phone}</span>
                  </div>
                ) : null}
                {selectedRequester.customerId ? (
                  <div className="flex items-center justify-between gap-4">
                    <span>Customer ID</span>
                    <span className="break-all text-right font-semibold text-slate-900">{selectedRequester.customerId}</span>
                  </div>
                ) : null}
                {selectedRequester.accountStatus ? (
                  <div className="flex items-center justify-between gap-4">
                    <span>Account status</span>
                    <span className="font-semibold text-slate-900">{humanize(selectedRequester.accountStatus)}</span>
                  </div>
                ) : null}
                {selectedRequester.network?.maskedIp ? (
                  <div className="flex items-center justify-between gap-4">
                    <span>Network signal</span>
                    <span className="font-semibold text-slate-900">
                      {selectedRequester.network.maskedIp}
                      {selectedRequester.network.country ? ` · ${selectedRequester.network.country}` : ""}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4">
                  <span>Status</span>
                  <StatusBadge status={selectedTicket.status || "open"} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Priority</span>
                  <span className="font-semibold capitalize text-slate-900">{selectedTicket.priority || "medium"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Category</span>
                  <span className="font-semibold text-slate-900">{selectedTicket.category || "General"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Assigned</span>
                  <span className="font-semibold text-slate-900">{selectedTicket.assignedTo?.name || "Unassigned"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Service</span>
                  <span className="font-semibold text-slate-900">{selectedTicket.serviceId || "Not linked"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Subscription</span>
                  <span className="font-semibold text-slate-900">{selectedTicket.subscriptionId?._id || selectedTicket.subscriptionId || "Not linked"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Created</span>
                  <span className="font-semibold text-slate-900">{formatDateTime(selectedTicket.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Last Reply</span>
                  <span className="font-semibold text-slate-900">{formatDateTime(selectedTicket.lastReplyAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
              <CardDescription>Select a ticket from the queue to inspect its conversation and routing details.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
