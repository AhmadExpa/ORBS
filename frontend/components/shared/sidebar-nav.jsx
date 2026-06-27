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
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              itemLocked && "text-slate-400 hover:bg-amber-50 hover:text-slate-500",
            )}
          >
            {active ? <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-brand-600" aria-hidden /> : null}
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-150",
                active ? "text-brand-600" : itemLocked ? "text-amber-500" : "text-slate-400 group-hover:text-slate-600",
              )}
            >
              {itemLocked ? <Lock className="h-[17px] w-[17px]" strokeWidth={2.2} /> : <Icon className="h-[18px] w-[18px]" strokeWidth={2} />}
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
