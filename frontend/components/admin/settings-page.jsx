"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, TextArea, TextInput } from "@/lib/ui";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

export function SettingsPage() {
  const { data, refetch, isLoading } = useStaffQuery({
    queryKey: ["admin-settings"],
    path: "/admin/settings",
  });
  const { showToast } = useActionToast();
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "support_agent",
  });
  const [companyValue, setCompanyValue] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [state, setState] = useState({ saving: false, message: "", error: "" });

  async function handleStaffCreate(event) {
    event.preventDefault();
    setState({ saving: true, message: "", error: "" });

    try {
      await apiFetch("/admin/settings/staff-users", {
        method: "POST",
        body: staffForm,
        authMode: "staff",
      });
      setStaffForm({ name: "", email: "", password: "", role: "support_agent" });
      setState({ saving: false, message: "Staff account created.", error: "" });
      showToast({
        type: "success",
        action: "Settings",
        title: "Staff user created",
        description: "The internal staff account has been added.",
      });
    } catch (error) {
      setState({ saving: false, message: "", error: error.message });
      showToast({
        type: "error",
        action: "Settings",
        title: "Staff creation failed",
        description: error.message,
      });
    }
  }

  async function handleCompanyProfileUpdate(event) {
    event.preventDefault();
    setState({ saving: true, message: "", error: "" });

    try {
      await apiFetch("/admin/settings/company-profile", {
        method: "PUT",
        authMode: "staff",
        body: {
          group: "general",
          value: {
            notes: companyValue,
          },
        },
      });
      await refetch();
      setState({ saving: false, message: "Company profile setting updated.", error: "" });
      showToast({
        type: "success",
        action: "Settings",
        title: "Company setting updated",
        description: "The company profile note has been saved.",
      });
    } catch (error) {
      setState({ saving: false, message: "", error: error.message });
      showToast({
        type: "error",
        action: "Settings",
        title: "Setting update failed",
        description: error.message,
      });
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setState({ saving: true, message: "", error: "" });

    try {
      await apiFetch("/staff/auth/password", {
        method: "PATCH",
        body: passwordForm,
        authMode: "staff",
      });
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setState({ saving: false, message: "Password updated.", error: "" });
      showToast({
        type: "success",
        action: "Settings",
        title: "Password updated",
        description: "Your staff password has been changed.",
      });
    } catch (error) {
      setState({ saving: false, message: "", error: error.message });
      showToast({
        type: "error",
        action: "Settings",
        title: "Password update failed",
        description: error.message,
      });
    }
  }

  if (isLoading && !data) {
    return <PageLoader title="Admin Settings" subtitle="Loading admin settings..." cardCount={3} lines={4} />;
  }

  return (
    <div>
      <Topbar title="Admin Settings" subtitle="Manage general admin settings and internal staff access." />
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Internal Staff Accounts</CardTitle>
            <CardDescription>Create support agent or additional admin accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleStaffCreate}>
              <TextInput placeholder="Full name" value={staffForm.name} onChange={(event) => setStaffForm((current) => ({ ...current, name: event.target.value }))} />
              <TextInput type="email" placeholder="Email" value={staffForm.email} onChange={(event) => setStaffForm((current) => ({ ...current, email: event.target.value }))} />
              <TextInput type="password" placeholder="Temporary password" value={staffForm.password} onChange={(event) => setStaffForm((current) => ({ ...current, password: event.target.value }))} />
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                value={staffForm.role}
                onChange={(event) => setStaffForm((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="support_agent">Support Agent</option>
                <option value="admin">Admin</option>
              </select>
              <Button className="w-full" type="submit" disabled={state.saving}>
                Create Staff User
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Store lightweight portal-wide settings in `AdminSetting`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleCompanyProfileUpdate}>
              <TextArea placeholder="Company profile notes or deployment notes" value={companyValue} onChange={(event) => setCompanyValue(event.target.value)} />
              <Button type="submit" disabled={state.saving}>
                Save Setting
              </Button>
            </form>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              {(data?.settings || []).map((setting) => (
                <p key={setting._id}>
                  <span className="font-semibold text-slate-900">{setting.key}:</span> {JSON.stringify(setting.value)}
                </p>
              ))}
            </div>
            {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
            {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Change Staff Password</CardTitle>
            <CardDescription>Replace the bootstrap password from inside the admin portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handlePasswordChange}>
              <TextInput
                type="password"
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
              />
              <TextInput
                type="password"
                placeholder="New password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              />
              <Button type="submit" disabled={state.saving}>
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
