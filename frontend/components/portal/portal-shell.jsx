"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  AlertTriangle,
  ChevronDown,
  FileSignature,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  Menu,
  Package,
  Plus,
  Receipt,
  Server,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { portalNavGroups } from "@/lib/shared";
import { formatCurrency } from "@/lib/shared";
import { ButtonThemeProvider, cn } from "@/lib/ui";
import { useCustomerQuery } from "@/lib/api/hooks";
import { BrandLogo } from "@/components/shared/brand-logo";
import { isContractSubmittedForPortal } from "@/components/portal/contract-gate";
import { PortalSectionNav, getActiveSection } from "@/components/portal/portal-section-nav";
import { PortalFooter } from "@/components/portal/portal-footer";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  server: Server,
  package: Package,
  receipt: Receipt,
  wallet: Wallet,
  "file-signature": FileSignature,
  "life-buoy": LifeBuoy,
  "user-round": UserRound,
};

function isLinkActive(pathname, href) {
  if (!pathname) return false;
  if (href === "/portal") return pathname === "/portal";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname, group) {
  if (group.href) return isLinkActive(pathname, group.href);
  return (group.items || []).some((item) => isLinkActive(pathname, item.href));
}

function flattenLinks(groups) {
  return groups.flatMap((group) => (group.href ? [group] : group.items || []));
}

export function PortalShell({ children, groups = portalNavGroups }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  const [openGroup, setOpenGroup] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const containerRef = useRef(null);

  const contractQuery = useCustomerQuery({
    queryKey: ["portal-contract-current"],
    path: "/contracts/current",
  });
  const contractStatus = contractQuery.data?.contract?.status || contractQuery.data?.status || "NOT_STARTED";
  const portalLocked = !isContractSubmittedForPortal(contractStatus);

  const profileQuery = useCustomerQuery({
    queryKey: ["portal-profile"],
    path: "/profile/me",
    enabled: !portalLocked,
  });
  const activeSection = getActiveSection(pathname);
  const user = profileQuery.data?.user;
  const walletBalance = Number(user?.accountBalance || 0);
  const displayName = user?.name || user?.company || user?.email || "Your account";
  const initial = String(displayName).trim().charAt(0).toUpperCase() || "A";

  // Close menus on route change.
  useEffect(() => {
    setOpenGroup("");
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Close dropdowns when clicking outside the nav.
  useEffect(() => {
    function handleClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenGroup("");
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function lockHrefFor(href) {
    return portalLocked && href !== "/portal/contracts" ? "/portal/contracts" : href;
  }

  async function handleSignOut() {
    await signOut({ redirectUrl: "/" });
  }

  return (
    <ButtonThemeProvider value="hubspot">
      <div className="flex min-h-screen flex-col bg-canvas text-slate-900">
        {/* Light, crisp top navigation */}
        <header ref={containerRef} className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
          <div className="mx-auto flex h-14 w-full max-w-[1680px] items-center gap-1 px-4 md:px-6">
            <Link href="/portal" aria-label="ElevenOrbits portal" className="mr-3 flex shrink-0 items-center">
              <BrandLogo className="h-7 w-[150px]" priority />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center lg:flex">
              {groups.map((group) => {
                const active = isGroupActive(pathname, group);
                const Icon = iconMap[group.icon] || LayoutDashboard;

                if (group.href) {
                  return (
                    <Link
                      key={group.label}
                      href={lockHrefFor(group.href)}
                      className={cn(
                        "relative flex h-14 items-center gap-2 px-3.5 text-sm font-medium transition-colors",
                        active ? "text-slate-900" : "text-slate-500 hover:text-slate-900",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {group.label}
                      {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent-600" /> : null}
                    </Link>
                  );
                }

                const isOpen = openGroup === group.label;
                return (
                  <div key={group.label} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenGroup(isOpen ? "" : group.label)}
                      className={cn(
                        "relative flex h-14 items-center gap-1.5 px-3.5 text-sm font-medium transition-colors",
                        active || isOpen ? "text-slate-900" : "text-slate-500 hover:text-slate-900",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {group.label}
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                      {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent-600" /> : null}
                    </button>
                    {isOpen ? (
                      <div className="absolute left-0 top-full mt-1 w-72 overflow-hidden rounded-lg border border-line bg-white p-1.5 shadow-card-hover">
                        {(group.items || []).map((item) => {
                          const ItemIcon = iconMap[item.icon] || Server;
                          const itemActive = isLinkActive(pathname, item.href);
                          const locked = portalLocked && item.href !== "/portal/contracts";
                          return (
                            <Link
                              key={item.href}
                              href={lockHrefFor(item.href)}
                              className={cn(
                                "flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors",
                                itemActive ? "bg-brand-50" : "hover:bg-slate-50",
                              )}
                            >
                              <span
                                className={cn(
                                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                                  itemActive ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {locked ? <Lock className="h-4 w-4" /> : <ItemIcon className="h-4 w-4" />}
                              </span>
                              <span className="min-w-0">
                                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                  {item.label}
                                  {locked ? <Lock className="h-3 w-3 text-amber-500" /> : null}
                                </span>
                                {item.description ? <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.description}</span> : null}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              {!portalLocked ? (
                <Link
                  href="/portal/payments"
                  className="hidden items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:flex"
                >
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  {formatCurrency(walletBalance)}
                </Link>
              ) : null}

              {!portalLocked ? (
                <Link
                  href="/portal/services"
                  className="hidden items-center gap-1.5 rounded-md bg-accent-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-700 sm:flex"
                >
                  <Plus className="h-4 w-4" />
                  Order an app
                </Link>
              ) : null}

              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-sm font-semibold text-white">{initial}</span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
                </button>
                {userMenuOpen ? (
                  <div className="absolute right-0 top-full mt-1 w-60 overflow-hidden rounded-lg border border-line bg-white p-1.5 shadow-card-hover">
                    <div className="border-b border-line px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                      {user?.email ? <p className="truncate text-xs text-slate-500">{user.email}</p> : null}
                    </div>
                    <Link href="/portal/account" className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      <UserRound className="h-4 w-4 text-slate-400" />
                      Account settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
                aria-label="Toggle navigation"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile nav sheet */}
          {mobileOpen ? (
            <div className="border-t border-line bg-white px-4 py-3 lg:hidden">
              <nav className="space-y-1">
                {flattenLinks(groups).map((item) => {
                  const ItemIcon = iconMap[item.icon] || LayoutDashboard;
                  const active = isLinkActive(pathname, item.href);
                  const locked = portalLocked && item.href !== "/portal/contracts";
                  return (
                    <Link
                      key={item.href}
                      href={lockHrefFor(item.href)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
                        active ? "bg-accent-50 text-accent-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      )}
                    >
                      {locked ? <Lock className="h-4 w-4 text-amber-500" /> : <ItemIcon className={cn("h-4 w-4", active ? "text-accent-600" : "text-slate-400")} />}
                      {item.label}
                    </Link>
                  );
                })}
                <Link href="/portal/services" className="mt-2 flex items-center justify-center gap-1.5 rounded-md bg-accent-600 px-3 py-2.5 text-sm font-semibold text-white">
                  <Plus className="h-4 w-4" />
                  Order an app
                </Link>
              </nav>
            </div>
          ) : null}
        </header>

        {portalLocked ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 md:px-6">
            <div className="mx-auto flex w-full max-w-[1680px] items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <span>Sign your current ElevenOrbits service agreement to unlock your workspace.</span>
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          {activeSection && !portalLocked ? (
            <div className="grid grid-cols-1 lg:grid-cols-[256px_minmax(0,1fr)]">
              <PortalSectionNav section={activeSection} />
              <div className="min-w-0">{children}</div>
            </div>
          ) : (
            children
          )}
        </main>

        <PortalFooter />
      </div>
    </ButtonThemeProvider>
  );
}
