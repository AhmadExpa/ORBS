"use client";

import Link from "next/link";
import { AlertTriangle, CreditCard, Lock, LogOut, UserRound, Wallet } from "lucide-react";
import { UserButton, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { clearStaffSessionToken } from "@/lib/auth/staff-client-session";
import { useCustomerQuery } from "@/lib/api/hooks";
import { formatCurrency, getMonthlyRecurringAmount } from "@/lib/shared";
import { Button, ButtonThemeProvider, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui";
import { isContractSubmittedForPortal } from "@/components/portal/contract-gate";
import { useActionToast } from "./feedback-layer";
import { BrandLogo } from "./brand-logo";
import { SidebarNav } from "./sidebar-nav";

export function AppShell({
  items,
  groups,
  children,
  roleLabel = "Portal",
  authMode = "clerk",
  logoutEndpoint = "/staff/auth/logout",
  logoutRedirectUrl = "/",
  logoSrc = "/logo.png",
  logoWidth = 1019,
  logoHeight = 284,
  sidebarHref = "/",
}) {
  const { signOut } = useClerk();
  const router = useRouter();
  const { showToast } = useActionToast();
  const [logoutState, setLogoutState] = useState({ loading: false, error: "" });
  const [staffSessionState, setStaffSessionState] = useState({ checking: authMode === "staff", error: "" });
  const contractQuery = useCustomerQuery({
    queryKey: ["portal-sidebar-contract-gate"],
    path: "/contracts/current",
    enabled: authMode === "clerk",
  });
  const contractStatus = contractQuery.data?.contract?.status || contractQuery.data?.status || "NOT_STARTED";
  const portalLocked = authMode === "clerk" && !isContractSubmittedForPortal(contractStatus);
  const canLoadPortalSnapshot = authMode === "clerk" && isContractSubmittedForPortal(contractStatus);
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-sidebar-profile"],
    path: "/profile/me",
    enabled: canLoadPortalSnapshot,
  });
  const subscriptionsQuery = useCustomerQuery({
    queryKey: ["portal-sidebar-subscriptions"],
    path: "/subscriptions",
    enabled: canLoadPortalSnapshot,
  });
  const walletBalance = Number(profileQuery.data?.user?.accountBalance || 0);
  const monthlyAmount = getMonthlyRecurringAmount(subscriptionsQuery.data?.subscriptions || []);

  useEffect(() => {
    let isActive = true;

    if (authMode !== "staff") {
      setStaffSessionState({ checking: false, error: "" });
      return () => {
        isActive = false;
      };
    }

    async function verifyStaffSession() {
      setStaffSessionState({ checking: true, error: "" });

      try {
        await apiFetch("/staff/auth/me", { authMode: "staff" });

        if (isActive) {
          setStaffSessionState({ checking: false, error: "" });
        }
      } catch (error) {
        if (isActive) {
          setStaffSessionState({
            checking: false,
            error: error.message || "Unable to verify your admin session.",
          });
        }
      }
    }

    verifyStaffSession();

    return () => {
      isActive = false;
    };
  }, [authMode]);

  async function handleLogout() {
    setLogoutState({ loading: true, error: "" });

    try {
      if (authMode === "staff") {
        await apiFetch(logoutEndpoint, { method: "POST", authMode: "staff" });
        clearStaffSessionToken();
        showToast({
          type: "info",
          action: "Session",
          title: "Staff session closed",
          description: "You have been signed out of the admin portal.",
        });
        router.replace(logoutRedirectUrl);
        return;
      }

      await signOut({ redirectUrl: logoutRedirectUrl });
    } catch (error) {
      setLogoutState({ loading: false, error: error.message || "Unable to log out right now." });
      showToast({
        type: "error",
        action: "Session",
        title: "Log out failed",
        description: error.message || "Unable to log out right now.",
      });
      return;
    }

    setLogoutState({ loading: false, error: "" });
  }

  if (authMode === "staff" && staffSessionState.checking) {
    return (
      <ButtonThemeProvider value="portal">
        <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-16">
          <Card className="w-full max-w-md shadow-panel">
            <CardHeader>
              <CardTitle>Checking session</CardTitle>
              <CardDescription>Validating your admin access before loading the dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Please wait while we confirm the current staff session.</p>
            </CardContent>
          </Card>
        </div>
      </ButtonThemeProvider>
    );
  }

  if (authMode === "staff" && staffSessionState.error) {
    return (
      <ButtonThemeProvider value="portal">
        <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-16">
          <Card className="w-full max-w-md shadow-panel">
            <CardHeader>
              <CardTitle>Session unavailable</CardTitle>
              <CardDescription>{staffSessionState.error}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">Retry after signing in again or refreshing the admin page.</p>
              <Button className="w-full" type="button" onClick={() => router.refresh()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </ButtonThemeProvider>
    );
  }

  return (
    <ButtonThemeProvider value="portal">
      <div className="min-h-screen bg-canvas text-slate-900">
        <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[264px_minmax(0,1fr)]">
          <aside className="z-40 flex h-full min-w-0 flex-col border-r border-white/10 bg-[#0f1115] px-3 py-4 text-slate-300 lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
            <Link
              href={sidebarHref}
              className="block rounded-lg border border-white/10 bg-white/5 px-3 py-3 transition-colors hover:border-white/20"
            >
              <div className="flex min-h-[76px] flex-col items-center justify-center text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">{roleLabel}</p>
                <BrandLogo
                  className="mt-3 h-8 w-full justify-center"
                  imageClassName="max-w-[150px] brightness-0 invert"
                  src={logoSrc}
                  width={logoWidth}
                  height={logoHeight}
                />
                <p className="mt-2 text-xs font-medium text-white/45">
                  {authMode === "staff" ? "Operations workspace" : "Customer workspace"}
                </p>
              </div>
            </Link>
            {authMode === "clerk" && portalLocked ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-amber-900">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                    <Lock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]">Portal locked</p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">Sign the Managed Service Agreement to unlock your workspace.</p>
                  </div>
                </div>
              </div>
            ) : authMode === "clerk" ? (
              <div className="mt-3 rounded-lg border border-line bg-slate-50/70 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Billing snapshot</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-line bg-white px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                        <Wallet className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-[11px] font-semibold text-slate-500">Wallet</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">{formatCurrency(walletBalance)}</p>
                  </div>
                  <div className="rounded-md border border-line bg-white px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                        <CreditCard className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-[11px] font-semibold text-slate-500">This month</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">{formatCurrency(monthlyAmount)}</p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="eo-scrollbar-none mt-5 min-h-0 flex-1 overflow-y-auto">
              <SidebarNav groups={groups} items={items} />
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3.5">
              <div className="flex items-center gap-3">
                {authMode === "clerk" ? (
                  <UserButton />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-white/70">
                    <UserRound className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">Signed in</p>
                  <p className="text-xs font-medium text-white/45">{authMode === "clerk" ? "Customer account" : "Staff account"}</p>
                </div>
              </div>
              {logoutState.error ? <p className="mt-3 text-xs font-medium text-rose-400">{logoutState.error}</p> : null}
              <button
                type="button"
                disabled={logoutState.loading}
                onClick={handleLogout}
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {logoutState.loading ? "Logging out…" : "Log out"}
              </button>
            </div>
          </aside>
          <main className="min-w-0 overflow-x-hidden">
            {portalLocked ? (
              <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-900">
                <div className="mx-auto flex w-full max-w-[1680px] items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <span>Sign your current ElevenOrbits Managed Service Agreement to unlock your workspace.</span>
                </div>
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </ButtonThemeProvider>
  );
}
