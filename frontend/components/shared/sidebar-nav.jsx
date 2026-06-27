"use client";

import Link from "next/link";
import {
  Activity,
  BadgeDollarSign,
  Boxes,
  CreditCard,
  FileSignature,
  LayoutDashboard,
  LifeBuoy,
  Lock,
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
  "file-signature": FileSignature,
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

export function SidebarNav({ items, locked = false, lockHref = "/portal/contracts" }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        const Icon = iconMap[item.icon] || LayoutDashboard;
        const itemLocked = locked && item.href !== lockHref;
        const href = itemLocked ? lockHref : item.href;

        return (
          <Link
            key={item.href}
            href={href}
            aria-disabled={itemLocked}
            className={cn(
              "group relative flex items-center gap-3 rounded-[20px] px-3 py-2.5 text-sm font-semibold transition-colors duration-150",
              active
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-950/[0.05] hover:text-slate-950",
              itemLocked && "overflow-hidden border border-amber-200/70 bg-amber-50/45 text-slate-500 hover:bg-amber-50 hover:text-slate-700",
            )}
          >
            {itemLocked ? <span className="absolute inset-0 bg-white/35 backdrop-blur-[1.5px]" /> : null}
            <span
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors duration-150",
                active
                  ? "bg-white text-slate-950 shadow-sm"
                  : itemLocked
                    ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                    : "bg-white/80 text-slate-500 ring-1 ring-slate-950/[0.05] group-hover:bg-white group-hover:text-slate-800",
              )}
            >
              {itemLocked ? <Lock className="h-[17px] w-[17px]" strokeWidth={2.2} /> : <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />}
            </span>
            <span className={cn("relative z-10 truncate", itemLocked && "blur-[0.4px]")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
