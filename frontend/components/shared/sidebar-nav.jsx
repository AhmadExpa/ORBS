"use client";

import Link from "next/link";
import {
  Activity,
  BadgeDollarSign,
  Boxes,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Receipt,
  Server,
  Settings2,
  Tickets,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui";

const rootSectionHrefs = new Set(["/portal", "/eo-admin"]);

const iconMap = {
  activity: Activity,
  "badge-dollar-sign": BadgeDollarSign,
  boxes: Boxes,
  "credit-card": CreditCard,
  "layout-dashboard": LayoutDashboard,
  "life-buoy": LifeBuoy,
  package: Package,
  receipt: Receipt,
  server: Server,
  "settings-2": Settings2,
  tickets: Tickets,
  "user-round": UserRound,
  users: Users,
  wallet: Wallet,
};

function isNavItemActive(pathname, href) {
  if (pathname === href) {
    return true;
  }

  if (rootSectionHrefs.has(href)) {
    return false;
  }

  return pathname.startsWith(`${href}/`);
}

export function SidebarNav({ items }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      {items.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        const Icon = iconMap[item.icon] || LayoutDashboard;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
                active
                  ? "bg-white text-sky-700 shadow-sm ring-1 ring-sky-100"
                  : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700 group-hover:ring-1 group-hover:ring-slate-200",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
