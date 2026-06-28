"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  FileSignature,
  LayoutDashboard,
  LifeBuoy,
  ListFilter,
  Package,
  Receipt,
  Server,
  Wallet,
  Zap,
} from "lucide-react";
import { portalFilters, portalSections } from "@/lib/shared";
import { formatCurrency } from "@/lib/shared";
import { cn } from "@/lib/ui";
import { useCustomerQuery } from "@/lib/api/hooks";

const iconMap = {
  server: Server,
  package: Package,
  receipt: Receipt,
  wallet: Wallet,
  "file-signature": FileSignature,
  "life-buoy": LifeBuoy,
  "layout-dashboard": LayoutDashboard,
};

export function getActiveSection(pathname) {
  if (!pathname) return null;
  return (
    portalSections.find((section) => section.links.some((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))) || null
  );
}

function isLinkActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isActiveSubscription(item) {
  return !["cancelled", "expired"].includes(item?.status);
}

export function PortalSectionNav({ section }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sectionId = section?.id;
  // Reuse the same query keys as the pages so React Query dedupes the requests.
  const subscriptionsQuery = useCustomerQuery({
    queryKey: ["portal-subscriptions"],
    path: "/subscriptions",
    enabled: sectionId === "services",
  });
  const invoicesQuery = useCustomerQuery({
    queryKey: ["portal-invoices"],
    path: "/invoices",
    enabled: sectionId === "billing",
  });
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-profile"],
    path: "/profile/me",
    enabled: sectionId === "billing",
  });
  const ticketsQuery = useCustomerQuery({
    queryKey: ["portal-tickets"],
    path: "/tickets",
    enabled: sectionId === "support",
  });

  if (!section) return null;

  const subscriptions = subscriptionsQuery.data?.subscriptions || [];
  const invoices = invoicesQuery.data?.invoices || [];
  const tickets = ticketsQuery.data?.tickets || [];
  const walletBalance = Number(profileQuery.data?.user?.accountBalance || 0);

  const filter = portalFilters[pathname];
  const activeFilter = filter ? searchParams.get(filter.param) || "" : "";

  function filterHref(value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(filter.param, value);
    } else {
      params.delete(filter.param);
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function filterCount(value) {
    if (pathname === "/portal/support") {
      if (!value) return tickets.length;
      return tickets.filter((ticket) => (ticket.status || "open") === value).length;
    }
    if (pathname === "/portal/invoices") {
      if (!value) return invoices.length;
      if (value === "paid") return invoices.filter((invoice) => invoice.status === "paid").length;
      if (value === "outstanding") return invoices.filter((invoice) => invoice.status !== "paid").length;
    }
    if (pathname === "/portal/subscriptions") {
      if (!value) return subscriptions.length;
      return subscriptions.filter((item) => (item.status || "") === value).length;
    }
    return null;
  }

  // Section at-a-glance stats.
  let stats = [];
  if (sectionId === "services") {
    const active = subscriptions.filter(isActiveSubscription).length;
    stats = [
      { label: "Active services", value: active },
      { label: "Total subscriptions", value: subscriptions.length },
    ];
  } else if (sectionId === "billing") {
    const outstanding = invoices.filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    stats = [
      { label: "Wallet balance", value: formatCurrency(walletBalance) },
      { label: "Outstanding", value: formatCurrency(outstanding) },
    ];
  } else if (sectionId === "support") {
    const open = tickets.filter((ticket) => ["open", "pending"].includes(ticket.status)).length;
    stats = [
      { label: "Open tickets", value: open },
      { label: "All tickets", value: tickets.length },
    ];
  }

  return (
    <aside className="border-b border-line bg-white px-3 py-5 lg:min-h-[calc(100vh-3.5rem)] lg:border-b-0 lg:border-r">
      <div className="space-y-6 lg:sticky lg:top-[4.5rem]">
        <div className="px-2">
          <p className="text-sm font-semibold text-slate-900">{section.label}</p>
          {section.description ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{section.description}</p> : null}
        </div>

        {/* Views */}
        <div>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Views</p>
          <nav className="mt-2 space-y-0.5">
            {section.links.map((link) => {
              const Icon = iconMap[link.icon] || LayoutDashboard;
              const active = isLinkActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                    active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-brand-600" : "text-slate-400")} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Filters with live counts */}
        {filter ? (
          <div className="border-t border-line pt-4">
            <p className="flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <ListFilter className="h-3.5 w-3.5" />
              {filter.label}
            </p>
            <nav className="mt-2 space-y-0.5">
              {filter.options.map((option) => {
                const active = activeFilter === option.value;
                const count = filterCount(option.value);
                return (
                  <Link
                    key={option.value || "all"}
                    href={filterHref(option.value)}
                    scroll={false}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    <span>{option.label}</span>
                    {count != null ? (
                      <span
                        className={cn(
                          "min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-xs font-semibold",
                          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : null}

        {/* At-a-glance stats */}
        {stats.length ? (
          <div className="border-t border-line pt-4">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">At a glance</p>
            <div className="mt-2 space-y-2 px-2">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between rounded-lg border border-line bg-slate-50/70 px-3 py-2">
                  <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                  <span className="text-sm font-semibold text-slate-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Quick actions */}
        {section.quickActions?.length ? (
          <div className="border-t border-line pt-4">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Quick actions</p>
            <nav className="mt-2 space-y-0.5">
              {section.quickActions.map((action) => {
                const Icon = iconMap[action.icon] || Zap;
                return (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Icon className="h-4 w-4 text-slate-400" />
                    {action.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : null}

        {/* Help footer */}
        <div className="rounded-lg border border-line bg-slate-50/70 p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
              <LifeBuoy className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Need a hand?</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                Our team replies on every ticket.{" "}
                <Link href="/portal/support" className="font-semibold text-brand-700 hover:text-brand-600">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
