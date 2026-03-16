"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, TextInput } from "@/lib/ui";
import { apiFetch } from "@/lib/api/client";
import { setStaffSessionToken } from "@/lib/auth/staff-client-session";
import { useActionToast } from "@/components/shared/feedback-layer";

export function AdminLoginForm() {
  const router = useRouter();
  const { showToast } = useActionToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [state, setState] = useState({ loading: false, error: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ loading: true, error: "" });

    try {
      const response = await apiFetch("/staff/auth/login", {
        method: "POST",
        body: form,
        authMode: "none",
      });
      setStaffSessionToken(response.token);
      showToast({
        type: "success",
        action: "Admin Login",
        title: "Signed in",
        description: "Redirecting to the admin dashboard.",
      });
      router.push("/eo-admin");
      router.refresh();
    } catch (error) {
      setState({ loading: false, error: error.message });
      showToast({
        type: "error",
        action: "Admin Login",
        title: "Sign in failed",
        description: error.message,
      });
      return;
    }

    setState({ loading: false, error: "" });
  }

  return (
    <Card className="w-full max-w-md shadow-panel">
      <CardHeader>
        <CardTitle>Admin Login</CardTitle>
        <CardDescription>Internal access for administrators and support agents.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <TextInput type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <TextInput type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          </div>
          {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
          <Button className="w-full" type="submit" disabled={state.loading}>
            {state.loading ? "Logging in..." : "Log In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
