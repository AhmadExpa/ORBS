"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
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
  "alert-triangle": AlertTriangle,
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

function NavLink({ item }) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, item.href);
  const Icon = iconMap[item.icon] || LayoutDashboard;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150",
        active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white",
      )}
    >
      {active ? <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent-500" aria-hidden /> : null}
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-150",
          active ? "text-accent-400" : "text-white/40 group-hover:text-white/70",
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

// Dark operations sidebar. Accepts grouped `groups` (preferred) or a flat `items` list.
export function SidebarNav({ groups, items }) {
  const resolvedGroups = groups || (items ? [{ items }] : []);

  return (
    <nav className="space-y-5">
      {resolvedGroups.map((group, index) => (
        <div key={group.label || `group-${index}`} className="space-y-1">
          {group.label ? (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">{group.label}</p>
          ) : null}
          {(group.items || []).map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      ))}
    </nav>
  );
}
