"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileSignature,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  Package,
  Plus,
  Receipt,
  Server,
  ShoppingBag,
  UserRound,
  Wallet,
} from "lucide-react";
import { portalNavGroups } from "@/lib/shared";
import { formatCurrency } from "@/lib/shared";
import { ButtonThemeProvider, cn } from "@/lib/ui";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { clearDelegateSessionToken } from "@/lib/auth/delegate-client-session";
import { BrandLogo } from "@/components/shared/brand-logo";
import { isContractSubmittedForPortal } from "@/components/portal/contract-gate";
import { PortalSectionNav, getActiveSection } from "@/components/portal/portal-section-nav";
import { PortalFooter } from "@/components/portal/portal-footer";
import { useCart } from "@/lib/cart/use-cart";
import { AnimatedMenuButton, FullScreenMobileMenu } from "@/components/shared/mobile-menu";

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

export function PortalShell({ children, groups = portalNavGroups, isAgentPortal = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { userId } = useAuth();
  const { itemCount } = useCart(userId);

  const [openGroup, setOpenGroup] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const containerRef = useRef(null);
  const routeIsAgent = isAgentPortal || pathname?.startsWith("/agent");

  const contractQuery = useCustomerQuery({
    queryKey: ["portal-contract-current"],
    path: "/contracts/current",
    enabled: !routeIsAgent,
  });
  const contractStatus = contractQuery.data?.contract?.status || contractQuery.data?.status || "NOT_STARTED";
  const hasContractStatus = !routeIsAgent && contractQuery.isSuccess && Boolean(contractQuery.data);
  const portalLocked = hasContractStatus && !isContractSubmittedForPortal(contractStatus);

  const profileQuery = useCustomerQuery({
    queryKey: ["portal-profile"],
    path: "/profile/me",
    enabled: !portalLocked,
  });
  const activeSection = getActiveSection(pathname);
  const isDelegate = profileQuery.data?.actorType === "delegate";
  const isAgent = routeIsAgent || isDelegate;

  const visibleGroups = isAgent
    ? [
        {
          label: "Services",
          icon: "server",
          items: [
            { href: "/agent/services", label: "Services", icon: "server", description: "Assigned services and access details" },
            { href: "/agent/subscriptions", label: "Subscriptions", icon: "package", description: "Services assigned to your agent login" },
          ],
        },
        { label: "Support", href: "/agent/support", icon: "life-buoy" },
      ]
    : groups;
  const user = profileQuery.data?.user;
  const delegate = profileQuery.data?.delegate;
  const walletBalance = Number(user?.accountBalance || 0);
  const displayName = isAgent ? delegate?.displayName || delegate?.username || "Agent access" : user?.name || user?.company || user?.email || "Your account";
  const displayEmail = isAgent ? user?.company || user?.email || "Assigned account" : user?.email;
  const initial = String(displayName).trim().charAt(0).toUpperCase() || "A";

  useEffect(() => {
    if (!isAgent) {
      return;
    }

    if (pathname === "/agent") {
      router.replace("/agent/services");
    }
  }, [isAgent, pathname, router]);

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
    setMobileOpen(false);
    if (isAgent) {
      try {
        await apiFetch("/delegate/auth/logout", { method: "POST", authMode: "delegate" });
      } catch {
        // The local token is cleared either way; a stale server cookie is handled on the next request.
      }
      clearDelegateSessionToken();
      router.replace("/login");
      return;
    }

    await signOut({ redirectUrl: "/" });
  }

  return (
    <ButtonThemeProvider value="hubspot">
      <div className="flex min-h-screen flex-col bg-canvas text-slate-900">
        {/* Refined dark top navigation — anchors the app and frames the light content */}
        <header
          ref={containerRef}
          className={cn(
            "sticky top-0 z-40 border-b border-white/10 backdrop-blur",
            isAgent ? "bg-[#07111f]/95 supports-[backdrop-filter]:bg-[#07111f]/88" : "bg-[#0f1115]/95 supports-[backdrop-filter]:bg-[#0f1115]/85",
          )}
        >
          <div className="mx-auto flex h-14 w-full max-w-[1680px] items-center gap-1 px-4 md:px-6">
            <Link href={isAgent ? "/agent/services" : "/portal"} aria-label={isAgent ? "ElevenOrbits agent portal" : "ElevenOrbits portal"} className="mr-3 flex shrink-0 items-center gap-3">
              <BrandLogo className="h-7 w-[150px]" imageClassName="brightness-0 invert" priority />
              {isAgent ? (
                <span className="hidden rounded-full border border-sky-300/25 bg-sky-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-100 sm:inline-flex">
                  Agent Portal
                </span>
              ) : null}
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center lg:flex">
              {visibleGroups.map((group) => {
                const active = isGroupActive(pathname, group);
                const Icon = iconMap[group.icon] || LayoutDashboard;

                if (group.href) {
                  return (
                    <Link
                      key={group.label}
                      href={lockHrefFor(group.href)}
                      className={cn(
                        "relative flex h-14 items-center gap-2 px-3.5 text-sm font-medium transition-colors",
                        active ? "text-white" : "text-white/60 hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {group.label}
                      {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent-500" /> : null}
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
                        active || isOpen ? "text-white" : "text-white/60 hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {group.label}
                      <ChevronDown className={cn("h-3.5 w-3.5 text-white/40 transition-transform", isOpen && "rotate-180 text-white/70")} />
                      {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent-500" /> : null}
                    </button>
                    {isOpen ? (
                      <div className="eo-menu eo-menu-shadow absolute left-0 top-full mt-1.5 w-[300px] overflow-hidden rounded-xl border border-line bg-white p-1.5">
                        <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>
                        {(group.items || []).map((item) => {
                          const ItemIcon = iconMap[item.icon] || Server;
                          const itemActive = isLinkActive(pathname, item.href);
                          const locked = portalLocked && item.href !== "/portal/contracts";
                          return (
                            <Link
                              key={item.href}
                              href={lockHrefFor(item.href)}
                              className={cn(
                                "group/menu flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
                                itemActive ? "bg-slate-50" : "hover:bg-slate-50",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                                  itemActive ? "border-accent-200 bg-accent-50 text-accent-600" : "border-line bg-white text-slate-500 group-hover/menu:text-slate-700",
                                )}
                              >
                                {locked ? <Lock className="h-4 w-4" /> : <ItemIcon className="h-[18px] w-[18px]" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                  {item.label}
                                  {locked ? <Lock className="h-3 w-3 text-amber-500" /> : null}
                                </span>
                                {item.description ? <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.description}</span> : null}
                              </span>
                              {itemActive ? <Check className="h-4 w-4 shrink-0 text-accent-600" /> : null}
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
              {!portalLocked && !isAgent ? (
                <Link
                  href="/portal/cart"
                  aria-label={itemCount ? `Cart with ${itemCount} item` : "Cart"}
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-md border text-white transition-colors",
                    pathname === "/portal/cart"
                      ? "border-accent-400 bg-accent-600"
                      : "border-white/15 bg-white/5 hover:bg-white/10",
                  )}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {itemCount ? (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-slate-950 ring-2 ring-[#0f1115]">
                      {itemCount}
                    </span>
                  ) : null}
                </Link>
              ) : null}

              {!portalLocked && !isAgent ? (
                <Link
                  href="/portal/payments"
                  className="hidden items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:flex"
                >
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  {formatCurrency(walletBalance)}
                </Link>
              ) : null}

              {!portalLocked && !isAgent ? (
                <Link
                  href="/portal/services"
                  className="hidden items-center gap-1.5 rounded-md bg-accent-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-500 sm:flex"
                >
                  <Plus className="h-4 w-4" />
                  Order an app
                </Link>
              ) : null}

              {/* User menu */}
              <div className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 text-white transition-colors hover:bg-white/10"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-sm font-semibold text-white ring-1 ring-white/15">{initial}</span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-white/50 sm:block" />
                </button>
                {userMenuOpen ? (
                  <div className="eo-menu eo-menu-shadow absolute right-0 top-full mt-1.5 w-64 overflow-hidden rounded-xl border border-line bg-white p-1.5">
                    <div className="flex items-center gap-3 border-b border-line px-2.5 pb-2.5 pt-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-600 text-sm font-semibold text-white">{initial}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                        {displayEmail ? <p className="truncate text-xs text-slate-500">{displayEmail}</p> : null}
                      </div>
                    </div>
                    {!isAgent ? (
                      <Link href="/portal/account" className="mt-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                        <UserRound className="h-4 w-4 text-slate-400" />
                        Account settings
                      </Link>
                    ) : null}
                    <Link href={isAgent ? "/agent/support" : "/portal/support"} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                      <LifeBuoy className="h-4 w-4 text-slate-400" />
                      Support
                    </Link>
                    <div className="my-1 border-t border-line" />
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Mobile menu toggle */}
              <AnimatedMenuButton
                open={mobileOpen}
                controls="portal-mobile-menu"
                onClick={() => setMobileOpen((open) => !open)}
                className="h-9 w-9 text-white transition-colors hover:bg-white/10 lg:hidden"
              />
            </div>
          </div>

          <FullScreenMobileMenu
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            id="portal-mobile-menu"
            label={isAgent ? "Agent portal navigation" : "Customer portal navigation"}
            breakpointClassName="lg:hidden"
            desktopMinWidth={1024}
            className={isAgent ? "bg-[#07111f] text-white" : "bg-[#0f1115] text-white"}
          >
            <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-4 sm:px-6 sm:py-5">
              <div className="eo-mobile-menu-item flex items-center justify-between gap-3" style={{ "--eo-menu-index": 0 }}>
                <Link
                  href={isAgent ? "/agent/services" : "/portal"}
                  aria-label={isAgent ? "ElevenOrbits agent portal" : "ElevenOrbits customer portal"}
                  onClick={() => setMobileOpen(false)}
                >
                  <BrandLogo className="h-8 w-[170px]" imageClassName="brightness-0 invert" priority />
                </Link>
                <AnimatedMenuButton
                  open
                  controls="portal-mobile-menu"
                  label="Close navigation"
                  onClick={() => setMobileOpen(false)}
                  className="border border-white/15 bg-white/5 text-white hover:bg-white/10"
                />
              </div>

              <div
                className="eo-mobile-menu-item mt-7 rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                style={{ "--eo-menu-index": 1 }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-600 text-base font-semibold text-white ring-1 ring-white/15">
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{displayName}</p>
                    {displayEmail ? <p className="mt-1 truncate text-sm text-white/50">{displayEmail}</p> : null}
                  </div>
                </div>
                {!isAgent ? (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/10 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-white/60">
                      <Wallet className="h-4 w-4 text-emerald-400" />
                      Wallet balance
                    </span>
                    <span className="text-sm font-semibold text-white">{formatCurrency(walletBalance)}</span>
                  </div>
                ) : null}
              </div>

              <nav className="mt-7 flex-1 border-t border-white/10 pt-4" aria-label="Portal pages">
                {flattenLinks(visibleGroups).map((item, index) => {
                  const ItemIcon = iconMap[item.icon] || LayoutDashboard;
                  const active = isLinkActive(pathname, item.href);
                  const locked = portalLocked && item.href !== "/portal/contracts";
                  return (
                    <Link
                      key={item.href}
                      href={lockHrefFor(item.href)}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "eo-mobile-menu-item mb-1 flex items-center gap-3 rounded-xl border px-3.5 py-3.5 transition-colors",
                        active
                          ? "border-white/15 bg-white/10 text-white"
                          : "border-transparent text-white/65 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
                      )}
                      style={{ "--eo-menu-index": index + 2 }}
                    >
                      <span className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                        active ? "border-accent-400/30 bg-accent-500/15 text-accent-300" : "border-white/10 bg-white/5 text-white/45",
                      )}>
                        {locked ? <Lock className="h-4 w-4 text-amber-400" /> : <ItemIcon className="h-[18px] w-[18px]" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{item.label}</span>
                        {item.description ? <span className="mt-0.5 block text-xs leading-5 text-white/40">{item.description}</span> : null}
                      </span>
                      {active ? <Check className="h-4 w-4 text-accent-400" /> : null}
                    </Link>
                  );
                })}
              </nav>

              <div
                className="eo-mobile-menu-item mt-6 space-y-3 border-t border-white/10 pt-5"
                style={{ "--eo-menu-index": flattenLinks(visibleGroups).length + 2 }}
              >
                {!isAgent ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/portal/cart"
                      onClick={() => setMobileOpen(false)}
                      className="relative flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm font-semibold text-white"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Cart
                      {itemCount ? <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-950">{itemCount}</span> : null}
                    </Link>
                    <Link
                      href="/portal/services"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-accent-600 px-3 py-3 text-sm font-semibold text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Order an app
                    </Link>
                  </div>
                ) : null}
                <div className={cn("grid gap-2", isAgent ? "grid-cols-1" : "grid-cols-2")}>
                  {!isAgent ? (
                    <Link
                      href="/portal/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-3 text-sm font-semibold text-white"
                    >
                      <UserRound className="h-4 w-4" />
                      Account
                    </Link>
                  ) : null}
                  <Link
                    href={isAgent ? "/agent/support" : "/portal/support"}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-3 text-sm font-semibold text-white"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    Support
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-3 text-sm font-semibold text-rose-200"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </FullScreenMobileMenu>
        </header>

        {portalLocked ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 md:px-6">
            <div className="mx-auto flex w-full max-w-[1680px] items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <span>Sign your current ElevenOrbits Managed Service Agreement to unlock your workspace.</span>
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
           {activeSection && !portalLocked ? (
            <div className="grid grid-cols-1 lg:grid-cols-[256px_minmax(0,1fr)]">
              <PortalSectionNav section={activeSection} isDelegate={isAgent} />
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
