"use client";

import { useState } from "react";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FieldLabel, TextInput } from "@/lib/ui";
import { apiFetch } from "@/lib/api/client";
import { setStaffSessionToken } from "@/lib/auth/staff-client-session";
import { useActionToast } from "@/components/shared/feedback-layer";

export function AdminLoginForm() {
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
      window.location.assign("/eo-admin");
      return;
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
  }

  return (
    <Card className="w-full overflow-hidden shadow-panel">
      <CardHeader className="space-y-4 p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <CardTitle className="text-2xl">Sign in to admin</CardTitle>
          <CardDescription className="mt-2">Use your staff credentials to access the operations workspace.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <FieldLabel>Work email</FieldLabel>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput
                className="pl-9"
                type="email"
                placeholder="you@elevenorbits.com"
                autoComplete="username"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <FieldLabel>Password</FieldLabel>
            <TextInput
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
          </div>
          {state.error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{state.error}</p>
          ) : null}
          <Button className="w-full" type="submit" disabled={state.loading}>
            {state.loading ? "Signing in..." : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
