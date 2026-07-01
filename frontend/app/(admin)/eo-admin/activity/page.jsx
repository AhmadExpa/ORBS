"use client";

import { AdminResourcePage } from "@/components/admin/resource-page";

function personLabel(person, fallback = "Unknown") {
  if (!person?.name && !person?.email) {
    return fallback;
  }
  return person.name || person.email;
}

function PersonCell({ person, fallback }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-slate-900">{personLabel(person, fallback)}</p>
      <p className="mt-0.5 truncate text-xs text-slate-500">{person?.email || "No email available"}</p>
    </div>
  );
}

function ActorCell({ row }) {
  const roleLabel = row.actorRole === "customer" ? "Customer" : row.actorRole === "support_agent" ? "Support agent" : row.actorRole === "admin" ? "Admin" : "System";
  return (
    <div className="min-w-0">
      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{roleLabel}</span>
      <div className="mt-1.5">
        <PersonCell person={row.actor} fallback={roleLabel} />
      </div>
    </div>
  );
}

export default function AdminActivityPage() {
  return (
    <AdminResourcePage
      title="Activity Log"
      subtitle="Track administrative and customer actions written to the audit trail."
      path="/admin/activity"
      queryKey={["admin-activity"]}
      sections={(data) => [
        {
          title: "Recent Activity",
          description: "Most recent audit log entries.",
          searchable: true,
          searchPlaceholder: "Search action, name, email, role, target…",
          columns: [
            { key: "action", label: "Action" },
            { key: "actor", label: "Actor", render: (row) => <ActorCell row={row} /> },
            { key: "customer", label: "Customer", render: (row) => <PersonCell person={row.customer} fallback="No customer linked" /> },
            {
              key: "target",
              label: "Target",
              render: (row) => (
                <div>
                  <p className="font-semibold text-slate-900">{row.targetType}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{row.targetLabel || row.targetId}</p>
                </div>
              ),
            },
            { key: "createdAt", label: "When", render: (row) => new Date(row.createdAt).toLocaleString() },
          ],
          rows: data?.logs || [],
        },
      ]}
    />
  );
}
