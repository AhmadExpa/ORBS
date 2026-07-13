"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import { useState } from "react";
import { ArrowRight, KeyRound, LockKeyhole, UserRound } from "lucide-react";
import { AccountStatusNotice } from "@/components/auth/account-status-notice";
import { LogoSpinner } from "@/components/shared/logo-spinner";
import { useActionToast } from "@/components/shared/feedback-layer";
import { apiFetch } from "@/lib/api/client";
import { setDelegateSessionToken } from "@/lib/auth/delegate-client-session";
import { Button, FieldLabel, TextInput, cn } from "@/lib/ui";

const authAppearance = {
  elements: {
    rootBox: "w-full max-w-full",
    cardBox: "w-full max-w-full",
    card: "w-full max-w-full border border-slate-200/90 bg-white shadow-[0_28px_80px_-54px_rgba(15,23,42,0.55)] rounded-lg px-4 sm:px-6",
    main: "w-full max-w-full",
    headerTitle: "text-slate-950 text-2xl font-semibold tracking-[-0.02em]",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButton:
      "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300",
    formButtonPrimary:
      "bg-slate-950 hover:bg-black text-white shadow-[0_16px_34px_-20px_rgba(15,23,42,0.9)]",
    formFieldInput:
      "rounded-md border-slate-200 focus:border-slate-400 focus:ring-slate-300",
    footer: "hidden",
    footerPages: "hidden",
  },
};

export function AgentLoginForm({ redirectTo = "/agent/services", variant = "card" }) {
  const { showToast } = useActionToast();
  const [form, setForm] = useState({ username: "", password: "" });
  const [state, setState] = useState({ loading: false, error: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ loading: true, error: "" });

    try {
      const response = await apiFetch("/delegate/auth/login", {
        method: "POST",
        body: form,
      });
      setDelegateSessionToken(response.token);
      showToast({
        type: "success",
        action: "Agent Login",
        title: "Signed in",
        description: "Opening your assigned services.",
      });
      window.location.assign(redirectTo);
    } catch (error) {
      setState({ loading: false, error: error.message });
      showToast({
        type: "error",
        action: "Agent Login",
        title: "Sign in failed",
        description: error.message,
      });
    }
  }

  return (
    <form
      className={cn(
        "w-full max-w-full space-y-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
        variant === "standalone" && "border-white/10 bg-white/[0.97] shadow-[0_28px_80px_-54px_rgba(15,23,42,0.85)]",
      )}
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Agent Portal</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Log in as agent.</h3>
      </div>
      <div>
        <FieldLabel>Username</FieldLabel>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <TextInput
            className="pl-9"
            autoComplete="username"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            required
          />
        </div>
      </div>
      <div>
        <FieldLabel>Password</FieldLabel>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <TextInput
            className="pl-9"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
        </div>
      </div>
      {state.error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{state.error}</p> : null}
      <Button className="w-full" type="submit" disabled={state.loading}>
        {state.loading ? "Signing in..." : "Sign in as agent"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

export function LoginModePanel({ redirectTo, signupUrl }) {
  const [mode, setMode] = useState("customer");
  const modes = [
    { id: "customer", label: "Customer", icon: UserRound },
    { id: "agent", label: "Agent", icon: KeyRound },
  ];

  return (
    <>
      <div className="mb-5 grid w-full grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {modes.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                active ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {mode === "agent" ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Agent Portal</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">Agent access is separate.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Agents use a scoped workspace for assigned services and support tickets.
          </p>
          <Link href="/agent/login" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black">
            Open Agent Portal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <SignedOut>
            <AccountStatusNotice />
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Customer Portal</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-3xl">Log in to continue.</h2>
            </div>
            <SignIn
              routing="path"
              path="/login"
              signUpUrl={signupUrl}
              forceRedirectUrl={redirectTo}
              fallbackRedirectUrl={redirectTo}
              signUpForceRedirectUrl={redirectTo}
              signUpFallbackRedirectUrl={redirectTo}
              appearance={authAppearance}
            />
            <p className="mt-5 text-center text-sm text-slate-600">
              Need an account?{" "}
              <Link href={signupUrl} className="inline-flex items-center gap-1 font-semibold text-slate-950 transition hover:text-slate-700">
                Create one <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          </SignedOut>
          <SignedIn>
            <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <LogoSpinner size={60} />
              <p className="mt-5 text-lg font-semibold tracking-tight text-slate-900">Signing you in...</p>
              <p className="mt-2 text-sm text-slate-500">Taking you to your ElevenOrbits portal.</p>
            </div>
          </SignedIn>
        </>
      )}
    </>
  );
}
