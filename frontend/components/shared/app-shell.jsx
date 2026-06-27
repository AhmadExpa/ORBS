"use client";

import Link from "next/link";
import { CreditCard, LogOut, UserRound, Wallet } from "lucide-react";
import { UserButton, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { clearStaffSessionToken } from "@/lib/auth/staff-client-session";
import { useCustomerQuery } from "@/lib/api/hooks";
import { formatCurrency } from "@/lib/shared";
import { Button, ButtonThemeProvider, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui";
import { isContractSubmittedForPortal } from "@/components/portal/contract-gate";
import { useActionToast } from "./feedback-layer";
import { BrandLogo } from "./brand-logo";
import { SidebarNav } from "./sidebar-nav";

function getSidebarMonthlyAmount(subscriptions = []) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return subscriptions
    .filter((subscription) => !["cancelled", "expired"].includes(subscription.status))
    .reduce((sum, subscription) => {
      const amount = Number(subscription.metadata?.billingAmount || 0);
      if (amount <= 0) {
        return sum;
      }

      if (subscription.billingCycle === "monthly") {
        return sum + amount;
      }

      if (!subscription.renewalDate) {
        return sum;
      }

      const renewalDate = new Date(subscription.renewalDate);
      return renewalDate.getMonth() === currentMonth && renewalDate.getFullYear() === currentYear ? sum + amount : sum;
    }, 0);
}

export function AppShell({
  items,
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
  const monthlyAmount = getSidebarMonthlyAmount(subscriptionsQuery.data?.subscriptions || []);

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
      <div className="min-h-screen bg-[linear-gradient(180deg,#f9fafb_0%,#f4f6fa_52%,#eef2f6_100%)] text-slate-950">
        <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="z-40 flex h-full min-w-0 flex-col border-r border-slate-200/80 bg-white/88 px-4 py-4 shadow-[18px_0_52px_-46px_rgba(15,23,42,0.42)] backdrop-blur-2xl lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
            <Link
              href={sidebarHref}
              className="block rounded-lg border border-slate-200/80 bg-white/94 px-4 py-4 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.5)] ring-1 ring-white/70"
            >
              <div className="flex min-h-[130px] flex-col items-center justify-center text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">{roleLabel}</p>
                <BrandLogo
                  className="mt-5 h-12 w-full justify-center"
                  imageClassName="max-w-[220px]"
                  src={logoSrc}
                  width={logoWidth}
                  height={logoHeight}
                />
                <p className="mt-4 text-sm font-medium text-slate-500">Customer operations portal</p>
              </div>
            </Link>
            {authMode === "clerk" ? (
              <div className="mt-3 rounded-lg border border-slate-200/80 bg-white/92 px-3 py-2.5 shadow-[0_14px_34px_-32px_rgba(15,23,42,0.5)] ring-1 ring-white/70">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Billing Snapshot</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-slate-50 px-2 py-2 ring-1 ring-slate-950/[0.05]">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                        <Wallet className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-[11px] font-semibold text-slate-500">Wallet</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-950">{formatCurrency(walletBalance)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 px-2 py-2 ring-1 ring-slate-950/[0.05]">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-slate-700 ring-1 ring-slate-950/[0.07]">
                        <CreditCard className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-[11px] font-semibold text-slate-500">Month</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-950">{formatCurrency(monthlyAmount)}</p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="eo-scrollbar-none mt-4 min-h-0 flex-1 overflow-y-auto">
              <SidebarNav items={items} />
            </div>
            <div className="mt-4 rounded-lg border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_42px_-36px_rgba(15,23,42,0.48)] ring-1 ring-white/70">
              <div className="flex items-center gap-3">
                {authMode === "clerk" ? (
                  <UserButton />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                    <UserRound className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-950">Signed in</p>
                  <p className="text-xs font-medium text-slate-500">{authMode === "clerk" ? "Customer account" : "Staff account"}</p>
                </div>
              </div>
              {logoutState.error ? <p className="mt-3 text-xs font-medium text-rose-600">{logoutState.error}</p> : null}
              <Button className="mt-4 w-full justify-center" type="button" variant="ghost" disabled={logoutState.loading} onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                {logoutState.loading ? "Logging out..." : "Log Out"}
              </Button>
            </div>
          </aside>
          <main className="min-w-0 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </ButtonThemeProvider>
  );
}
