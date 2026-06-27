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
    queryKey: ["portal-shell-contract-gate"],
    path: "/contracts/current",
  });
  const contractStatus = contractQuery.data?.contract?.status || contractQuery.data?.status || "NOT_STARTED";
  const portalLocked = !isContractSubmittedForPortal(contractStatus);

  const profileQuery = useCustomerQuery({
    queryKey: ["portal-shell-profile"],
    path: "/profile/me",
    enabled: !portalLocked,
  });
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
      <div className="flex min-h-screen flex-col bg-[#faf8f4] text-slate-900">
        {/* HubSpot-style dark top navigation */}
        <header ref={containerRef} className="sticky top-0 z-40 border-b-2 border-accent-600 bg-[#1b2433]">
          <div className="mx-auto flex h-14 w-full max-w-[1680px] items-center gap-2 px-4 md:px-6">
            <Link href="/portal" aria-label="ElevenOrbits portal" className="mr-2 flex shrink-0 items-center">
              <BrandLogo className="h-7 w-[150px]" imageClassName="brightness-0 invert" priority />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 lg:flex">
              {groups.map((group) => {
                const active = isGroupActive(pathname, group);
                const Icon = iconMap[group.icon] || LayoutDashboard;

                if (group.href) {
                  return (
                    <Link
                      key={group.label}
                      href={lockHrefFor(group.href)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                        active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {group.label}
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
                        "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                        active || isOpen ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {group.label}
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
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
                  className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 sm:flex"
                >
                  <Wallet className="h-4 w-4 text-emerald-300" />
                  {formatCurrency(walletBalance)}
                </Link>
              ) : null}

              {!portalLocked ? (
                <Link
                  href="/portal/services"
                  className="hidden items-center gap-1.5 rounded-md bg-accent-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700 sm:flex"
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
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-white transition-colors hover:bg-white/10"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-sm font-semibold text-white">{initial}</span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-white/70 sm:block" />
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
                className="flex h-9 w-9 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 lg:hidden"
                aria-label="Toggle navigation"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile nav sheet */}
          {mobileOpen ? (
            <div className="border-t border-white/10 bg-[#1b2433] px-4 py-3 lg:hidden">
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
                        active ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/8 hover:text-white",
                      )}
                    >
                      {locked ? <Lock className="h-4 w-4 text-amber-400" /> : <ItemIcon className="h-4 w-4" />}
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

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </ButtonThemeProvider>
  );
}
