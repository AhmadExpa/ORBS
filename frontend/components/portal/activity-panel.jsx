"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ClipboardCheck,
  CreditCard,
  LifeBuoy,
  ListFilter,
  PackageCheck,
  UsersRound,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge, cn } from "@/lib/ui";

const activityFilters = [
  { id: "all", label: "All", types: [] },
  { id: "payment", label: "Payments", types: ["payment"] },
  { id: "support", label: "Support", types: ["ticket"] },
  { id: "service", label: "Services", types: ["service", "order", "subscription"] },
  { id: "access", label: "Access", types: ["delegate", "contract"] },
];

function relativeTime(value) {
  if (!value) return "";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function activityIconFor(type) {
  if (type === "payment") return CreditCard;
  if (type === "ticket") return LifeBuoy;
  if (type === "delegate") return UsersRound;
  if (type === "contract") return ClipboardCheck;
  if (type === "service" || type === "order" || type === "subscription") return PackageCheck;
  return Activity;
}

function activityToneFor(type) {
  if (type === "payment") return "bg-emerald-50 text-emerald-600 ring-emerald-100";
  if (type === "ticket") return "bg-sky-50 text-sky-600 ring-sky-100";
  if (type === "delegate") return "bg-violet-50 text-violet-600 ring-violet-100";
  if (type === "contract") return "bg-amber-50 text-amber-600 ring-amber-100";
  if (type === "service" || type === "order" || type === "subscription") return "bg-blue-50 text-blue-600 ring-blue-100";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function activityTypeLabel(type) {
  if (type === "payment") return "Payment";
  if (type === "ticket") return "Support";
  if (type === "delegate") return "Access";
  if (type === "contract") return "Agreement";
  if (type === "service" || type === "order" || type === "subscription") return "Service";
  return "Portal";
}

function ActivitySkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3">
          <span className="h-9 w-9 shrink-0 animate-pulse rounded-md bg-slate-100" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            <span className="block h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </span>
          <span className="h-6 w-14 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function PortalActivityPanel({
  activities = [],
  loading = false,
  title = "Recent activity",
  description = "Portal actions, payments, support, and access changes.",
  maxItems = 8,
  compact = false,
  className,
  emptyMessage = "No recent activity yet.",
}) {
  const [activeFilter, setActiveFilter] = useState("all");

  const counts = useMemo(() => {
    return activityFilters.reduce((result, filter) => {
      result[filter.id] = filter.types.length
        ? activities.filter((item) => filter.types.includes(item.type)).length
        : activities.length;
      return result;
    }, {});
  }, [activities]);

  const activeTypes = activityFilters.find((filter) => filter.id === activeFilter)?.types || [];
  const filteredActivities = activeTypes.length ? activities.filter((item) => activeTypes.includes(item.type)) : activities;
  const visibleActivities = filteredActivities.slice(0, maxItems);

  return (
    <Card className={className}>
      <CardHeader className={cn("flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between", compact && "p-4")}>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          <ListFilter className="h-3.5 w-3.5" />
          {counts[activeFilter] || 0}
        </span>
      </CardHeader>
      <CardContent className={cn("space-y-4", compact && "p-4")}>
        <div className="flex flex-wrap gap-2">
          {activityFilters.map((filter) => {
            const active = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "inline-flex min-h-8 items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-line bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {filter.label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[11px]", active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500")}>
                  {counts[filter.id] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {loading && !activities.length ? (
          <ActivitySkeleton />
        ) : visibleActivities.length ? (
          <div className={cn("space-y-2.5", !compact && "max-h-[520px] overflow-y-auto pr-1")}>
            {visibleActivities.map((item) => {
              const Icon = activityIconFor(item.type);
              const timeLabel = relativeTime(item.at);
              const body = (
                <div className="group flex items-center gap-3 rounded-lg border border-line bg-white p-3 transition-colors hover:border-slate-300 hover:bg-slate-50/60">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md ring-1", activityToneFor(item.type))}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.title || "Portal activity"}</p>
                      <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 sm:inline-flex">
                        {activityTypeLabel(item.type)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
                      {item.description ? `${item.description}${timeLabel ? " - " : ""}` : ""}
                      {timeLabel}
                    </p>
                  </div>
                  {item.status ? <StatusBadge status={item.status} /> : null}
                  {item.href ? <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500 sm:block" /> : null}
                </div>
              );

              return item.href ? (
                <Link key={item.id} href={item.href} className="block">
                  {body}
                </Link>
              ) : (
                <div key={item.id}>{body}</div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-slate-50 p-5 text-sm font-medium text-slate-500">
            {emptyMessage}
          </div>
        )}

        {filteredActivities.length > visibleActivities.length ? (
          <p className="text-xs font-medium text-slate-400">
            Showing {visibleActivities.length} of {filteredActivities.length} matching events.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
