"use client";

import { useState } from "react";
import { Ban, ShieldAlert, ShieldCheck } from "lucide-react";
import {
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
} from "@/lib/ui";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

const CUSTOM_REASON = "__custom__";

const BLOCK_REASON_PRESETS = [
  "Fraudulent payment activity detected on the account.",
  "Repeated violations of our Acceptable Use Policy.",
  "Confirmed abuse of ElevenOrbits services.",
  "Account linked to prohibited or illegal activity.",
  "Multiple unauthorized access attempts detected.",
];

function statusOf(user) {
  return user?.accountStatus || "active";
}

export function AdminUsersPage() {
  const { showToast } = useActionToast();
  const usersQuery = useStaffQuery({ queryKey: ["admin-users"], path: "/admin/users" });

  const [actionState, setActionState] = useState({ loadingId: "", error: "" });
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockPreset, setBlockPreset] = useState(BLOCK_REASON_PRESETS[0]);
  const [blockCustom, setBlockCustom] = useState("");

  const customers = usersQuery.data?.customers || [];
  const staffUsers = usersQuery.data?.staffUsers || [];

  async function runAction(user, action, body) {
    setActionState({ loadingId: user._id, error: "" });
    try {
      await apiFetch(`/admin/users/${user._id}/${action}`, { method: "POST", authMode: "staff", body });
      await usersQuery.refetch();
      const labels = { suspend: "suspended", block: "blocked", reactivate: "reactivated" };
      showToast({
        type: "success",
        action: "Accounts",
        title: `Account ${labels[action]}`,
        description: `${user.name || user.email} has been ${labels[action]} and notified by email.`,
      });
      return true;
    } catch (error) {
      setActionState({ loadingId: "", error: error.message });
      showToast({ type: "error", action: "Accounts", title: "Action failed", description: error.message });
      return false;
    } finally {
      setActionState((current) => ({ ...current, loadingId: "" }));
    }
  }

  function handleSuspend(user) {
    if (!window.confirm(`Suspend ${user.name || user.email}? They will be signed out and emailed about suspicious activity.`)) {
      return;
    }
    runAction(user, "suspend");
  }

  function handleReactivate(user) {
    if (!window.confirm(`Reactivate ${user.name || user.email}? They will regain access and be emailed.`)) {
      return;
    }
    runAction(user, "reactivate");
  }

  function openBlock(user) {
    setBlockTarget(user);
    setBlockPreset(BLOCK_REASON_PRESETS[0]);
    setBlockCustom("");
  }

  async function submitBlock() {
    const reason = blockPreset === CUSTOM_REASON ? blockCustom.trim() : blockPreset;
    if (!reason) {
      showToast({ type: "error", action: "Accounts", title: "Reason required", description: "Enter a reason before blocking the account." });
      return;
    }
    const ok = await runAction(blockTarget, "block", { reason });
    if (ok) {
      setBlockTarget(null);
    }
  }

  if (usersQuery.isLoading && !usersQuery.data) {
    return <PageLoader title="Loading users" subtitle="Fetching customer and staff accounts…" />;
  }

  const customerColumns = [
    { key: "name", label: "Name", render: (row) => row.name || "—" },
    { key: "email", label: "Email" },
    { key: "company", label: "Company", render: (row) => row.company || "—" },
    { key: "accountStatus", label: "Status", render: (row) => <StatusBadge status={statusOf(row)} /> },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (row) => {
        const status = statusOf(row);
        const busy = actionState.loadingId === row._id;
        return (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {status === "active" ? (
              <Button type="button" variant="outline" disabled={busy} onClick={() => handleSuspend(row)}>
                <ShieldAlert className="h-4 w-4" />
                Suspend
              </Button>
            ) : null}
            {status !== "blocked" ? (
              <Button type="button" variant="destructive" disabled={busy} onClick={() => openBlock(row)}>
                <Ban className="h-4 w-4" />
                Block
              </Button>
            ) : null}
            {status !== "active" ? (
              <Button type="button" variant="outline" disabled={busy} onClick={() => handleReactivate(row)}>
                <ShieldCheck className="h-4 w-4" />
                Reactivate
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <Topbar title="Users" subtitle="Review customers, manage account access, and view internal staff." />
      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Suspend accounts for suspicious activity, permanently block abuse, or reactivate access.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={customerColumns} rows={customers} emptyMessage="No customer accounts yet." />
            {actionState.error ? <p className="mt-3 text-sm font-medium text-rose-600">{actionState.error}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff users</CardTitle>
            <CardDescription>Internal admins and support agents managed from the admin portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "role", label: "Role", render: (row) => <StatusBadge status={row.role} /> },
                { key: "isActive", label: "Active", render: (row) => (row.isActive ? "Yes" : "No") },
              ]}
              rows={staffUsers}
              emptyMessage="No staff users yet."
            />
          </CardContent>
        </Card>
      </div>

      {blockTarget ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-6">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Permanently block account</CardTitle>
              <CardDescription>
                {blockTarget.name || blockTarget.email} will be signed out, banned from signing in again, and emailed the reason below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FieldLabel>Reason</FieldLabel>
                <Select value={blockPreset} onChange={(event) => setBlockPreset(event.target.value)}>
                  {BLOCK_REASON_PRESETS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                  <option value={CUSTOM_REASON}>Write a custom reason…</option>
                </Select>
              </div>
              {blockPreset === CUSTOM_REASON ? (
                <div>
                  <FieldLabel>Custom reason</FieldLabel>
                  <TextArea
                    value={blockCustom}
                    onChange={(event) => setBlockCustom(event.target.value)}
                    placeholder="Explain why this account is being permanently blocked…"
                  />
                </div>
              ) : null}
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-700">
                This is permanent. The customer will not be able to sign in again unless you reactivate the account.
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button type="button" variant="outline" disabled={Boolean(actionState.loadingId)} onClick={() => setBlockTarget(null)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" disabled={Boolean(actionState.loadingId)} onClick={submitBlock}>
                  <Ban className="h-4 w-4" />
                  {actionState.loadingId ? "Blocking…" : "Block account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
