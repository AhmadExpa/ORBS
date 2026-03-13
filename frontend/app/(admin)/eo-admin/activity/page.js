"use client";

import { AdminResourcePage } from "@/components/admin/resource-page";

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
          columns: [
            { key: "action", label: "Action" },
            { key: "actorRole", label: "Role" },
            { key: "targetType", label: "Target" },
            { key: "createdAt", label: "When", render: (row) => new Date(row.createdAt).toLocaleString() },
          ],
          rows: data?.logs || [],
        },
      ]}
    />
  );
}
