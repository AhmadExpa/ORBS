"use client";

import { useMemo, useState } from "react";
import { Save, Search } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useStaffQuery } from "@/lib/api/hooks";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, FieldLabel, Select, StatusBadge, TextArea, TextInput } from "@/lib/ui";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";

const statuses = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "responded", label: "Responded" },
  { value: "closed", label: "Closed" },
];

function formatDateTime(value) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleString();
}

function rowMatches(row, term) {
  if (!term) {
    return true;
  }

  return [row.name, row.email, row.company, row.phone, row.department, row.serviceInterest, row.subject, row.message, row.status]
    .join(" ")
    .toLowerCase()
    .includes(term);
}

function ContactCell({ row }) {
  return (
    <div className="min-w-[180px]">
      <p className="font-semibold text-slate-950">{row.name}</p>
      <a className="mt-1 block text-xs font-semibold text-brand-700 hover:text-brand-600" href={`mailto:${row.email}`}>
        {row.email}
      </a>
      {row.phone ? <p className="mt-1 text-xs text-slate-500">{row.phone}</p> : null}
    </div>
  );
}

function ContextCell({ row }) {
  return (
    <div className="min-w-[160px]">
      <p className="font-semibold capitalize text-slate-900">{row.department || "general"}</p>
      {row.serviceInterest ? <p className="mt-1 text-xs text-slate-500">{row.serviceInterest}</p> : null}
      {row.company ? <p className="mt-1 text-xs text-slate-500">{row.company}</p> : null}
    </div>
  );
}

function MessageCell({ row }) {
  return (
    <div className="max-w-sm">
      <p className="font-semibold text-slate-950">{row.subject}</p>
      <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">{row.message}</p>
    </div>
  );
}

function ReviewCell({ row, onSaved }) {
  const [status, setStatus] = useState(row.status || "new");
  const [adminNotes, setAdminNotes] = useState(row.adminNotes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      await apiFetch(`/admin/contact-submissions/${row._id}`, {
        method: "PATCH",
        authMode: "staff",
        body: {
          status,
          adminNotes,
        },
      });
      onSaved();
    } catch (requestError) {
      setError(requestError.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-[260px] space-y-2">
      <Select value={status} onChange={(event) => setStatus(event.target.value)}>
        {statuses.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>
      <TextArea className="min-h-20 text-xs" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} placeholder="Admin notes" />
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
      <Button type="button" variant="ghost" className="min-h-9 w-full rounded-md py-1.5 text-xs" disabled={saving} onClick={handleSave}>
        <Save className="h-3.5 w-3.5" />
        {saving ? "Saving" : "Save"}
      </Button>
    </div>
  );
}

export function AdminContactSubmissionsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useStaffQuery({
    queryKey: ["admin-contact-submissions"],
    path: "/admin/contact-submissions",
  });
  const term = search.trim().toLowerCase();
  const submissions = data?.submissions || [];
  const rows = useMemo(() => submissions.filter((row) => rowMatches(row, term)).map((row) => ({ ...row, id: row._id })), [submissions, term]);

  if (isLoading && !data) {
    return <PageLoader title="Loading contact leads" subtitle="Gathering public contact form submissions..." />;
  }

  return (
    <div>
      <Topbar title="Contact Leads" subtitle="Review public contact form submissions and track follow-up status." />
      <div className="space-y-6 p-6 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Submissions</CardTitle>
                <CardDescription>Newest public form submissions appear first.</CardDescription>
              </div>
              <div className="w-full md:w-80">
                <FieldLabel htmlFor="lead-search" className="sr-only">
                  Search contact leads
                </FieldLabel>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <TextInput id="lead-search" className="pl-9" placeholder="Search leads..." value={search} onChange={(event) => setSearch(event.target.value)} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              dense
              columns={[
                { key: "contact", label: "Contact", render: (row) => <ContactCell row={row} /> },
                { key: "context", label: "Context", render: (row) => <ContextCell row={row} /> },
                { key: "message", label: "Message", render: (row) => <MessageCell row={row} /> },
                { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status || "new"} /> },
                { key: "submittedAt", label: "Submitted", render: (row) => formatDateTime(row.submittedAt) },
                { key: "review", label: "Review", render: (row) => <ReviewCell row={row} onSaved={refetch} /> },
              ]}
              rows={rows}
              emptyMessage={term ? "No contact submissions match your search." : "No contact submissions yet."}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
