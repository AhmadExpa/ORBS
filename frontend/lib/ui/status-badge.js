import React from "react";
import { cn } from "./utils.js";

const colors = {
  active: "bg-emerald-50 text-emerald-700",
  approved: "bg-emerald-50 text-emerald-700",
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  pending_verification: "bg-amber-50 text-amber-700",
  suspended: "bg-rose-50 text-rose-700",
  rejected: "bg-rose-50 text-rose-700",
  cancelled: "bg-slate-100 text-slate-700",
  resolved: "bg-sky-50 text-sky-700",
};

export function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
        colors[status] || "bg-slate-100 text-slate-700",
        className,
      )}
    >
      {String(status).replaceAll("_", " ")}
    </span>
  );
}
