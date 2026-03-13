"use client";

import { StatusBadge } from "@/lib/ui";
import { AdminResourcePage } from "@/components/admin/resource-page";

export default function AdminUsersPage() {
  return (
    <AdminResourcePage
      title="Users"
      subtitle="Review both customer accounts and internal staff users."
      path="/admin/users"
      queryKey={["admin-users"]}
      sections={(data) => [
        {
          title: "Customers",
          description: "Customer accounts synced into MongoDB.",
          columns: [
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "company", label: "Company" },
            { key: "role", label: "Role", render: (row) => <StatusBadge status={row.role || "customer"} /> },
          ],
          rows: data?.customers || [],
        },
        {
          title: "Staff Users",
          description: "Internal admins and support agents managed from the admin portal.",
          columns: [
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role", render: (row) => <StatusBadge status={row.role} /> },
            { key: "isActive", label: "Active", render: (row) => (row.isActive ? "Yes" : "No") },
          ],
          rows: data?.staffUsers || [],
        },
      ]}
    />
  );
}
