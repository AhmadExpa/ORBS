"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ListFilter } from "lucide-react";
import { portalFilters, portalSections } from "@/lib/shared";
import { cn } from "@/lib/ui";

export function getActiveSection(pathname) {
  if (!pathname) return null;
  return (
    portalSections.find((section) => section.links.some((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))) || null
  );
}

function isLinkActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalSectionNav({ section }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (!section) return null;

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

  return (
    <aside className="border-b border-line bg-white px-4 py-5 lg:border-b-0 lg:border-r lg:min-h-[calc(100vh-3.5rem)]">
      <div className="lg:sticky lg:top-[4.5rem]">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{section.label}</p>
        <nav className="mt-2 space-y-0.5">
          {section.links.map((link) => {
            const active = isLinkActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {filter ? (
          <div className="mt-6 border-t border-line pt-4">
            <p className="flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <ListFilter className="h-3.5 w-3.5" />
              {filter.label}
            </p>
            <nav className="mt-2 space-y-0.5">
              {filter.options.map((option) => {
                const active = activeFilter === option.value;
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
                    {option.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
