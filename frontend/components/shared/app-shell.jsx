"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { UserButton, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { clearStaffSessionToken } from "@/lib/auth/staff-client-session";
import { Button, ButtonThemeProvider, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui";
import { useActionToast } from "./feedback-layer";
import { BrandLogo } from "./brand-logo";
import { SidebarNav } from "./sidebar-nav";

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
      <div className="min-h-screen bg-[linear-gradient(180deg,#fbfcff_0%,#f4f6fa_48%,#eef2f7_100%)] text-slate-950">
        <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[292px_minmax(0,1fr)]">
          <aside className="z-40 flex h-full flex-col border-r border-white/70 bg-white/72 px-4 py-5 shadow-[18px_0_60px_-48px_rgba(15,23,42,0.35)] backdrop-blur-2xl lg:sticky lg:top-0 lg:h-screen">
            <Link
              href={sidebarHref}
              className="block rounded-[26px] border border-white/80 bg-white/82 px-5 py-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.5)] ring-1 ring-slate-950/[0.04]"
            >
              <div className="flex min-h-[158px] flex-col items-center justify-center text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">{roleLabel}</p>
                <BrandLogo
                  className="mt-5 h-12 w-full justify-center"
                  imageClassName="max-w-[220px]"
                  src={logoSrc}
                  width={logoWidth}
                  height={logoHeight}
                />
                <p className="mt-4 text-sm font-medium text-slate-500">Managed by ElevenOrbits Team</p>
              </div>
            </Link>
            <div className="mt-5 flex-1 overflow-y-auto pr-1">
              <SidebarNav items={items} />
            </div>
            <div className="mt-5 rounded-[24px] border border-white/80 bg-white/76 p-4 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.5)] ring-1 ring-slate-950/[0.04]">
              <div className="flex items-center gap-3">
                {authMode === "clerk" ? (
                  <UserButton />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
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
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </ButtonThemeProvider>
  );
}
