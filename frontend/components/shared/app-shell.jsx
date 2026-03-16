"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { UserButton, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { clearStaffSessionToken } from "@/lib/auth/staff-client-session";
import { Button, ButtonThemeProvider } from "@/lib/ui";
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

  return (
    <ButtonThemeProvider value="portal">
      <div className="min-h-screen bg-surface">
        <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[296px_minmax(0,1fr)]">
          <aside className="flex h-full flex-col border-r border-slate-200 bg-white px-5 py-6">
            <Link href={sidebarHref} className="block rounded-[28px] border border-slate-200 bg-gradient-to-br from-stone-50 via-white to-sky-50 px-5 py-5 shadow-sm">
              <div className="flex min-h-[164px] flex-col items-center justify-center text-center">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{roleLabel}</p>
                <BrandLogo
                  className="mt-5 h-12 w-full justify-center"
                  imageClassName="max-w-[220px]"
                  src={logoSrc}
                  width={logoWidth}
                  height={logoHeight}
                />
                <p className="mt-4 text-sm text-slate-500">Managed by ElevenOrbits Team</p>
              </div>
            </Link>
            <div className="mt-6 flex-1">
              <SidebarNav items={items} />
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                {authMode === "clerk" ? (
                  <UserButton />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                    <UserRound className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">Session Controls</p>
                  <p className="text-xs text-slate-500">
                    {authMode === "clerk" ? "Manage your account settings or sign out from here." : "End the current staff session from here."}
                  </p>
                </div>
              </div>
              {logoutState.error ? <p className="mt-3 text-xs font-medium text-rose-600">{logoutState.error}</p> : null}
              <Button className="mt-4 w-full justify-center" type="button" variant="ghost" disabled={logoutState.loading} onClick={handleLogout}>
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
