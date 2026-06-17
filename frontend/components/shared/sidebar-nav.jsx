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
    <nav className="space-y-1">
      {items.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        const Icon = iconMap[item.icon] || LayoutDashboard;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-[20px] px-3 py-2.5 text-sm font-semibold transition-colors duration-150",
              active
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-950/[0.05] hover:text-slate-950",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors duration-150",
                active
                  ? "bg-white text-slate-950 shadow-sm"
                  : "bg-white/80 text-slate-500 ring-1 ring-slate-950/[0.05] group-hover:bg-white group-hover:text-slate-800",
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
