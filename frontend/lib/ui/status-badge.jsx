import React from "react";
import { cn } from "./utils.js";

const colors = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  pending_verification: "border-amber-200 bg-amber-50 text-amber-700",
  pending_signature: "border-amber-200 bg-amber-50 text-amber-700",
  ready_to_sign: "border-sky-200 bg-sky-50 text-sky-700",
  signed_pending_storage: "border-amber-200 bg-amber-50 text-amber-700",
  signed_pending_admin: "border-amber-200 bg-amber-50 text-amber-700",
  suspended: "border-rose-200 bg-rose-50 text-rose-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
  resolved: "border-sky-200 bg-sky-50 text-sky-700",
};

export function StatusBadge({ status, className }) {
  const normalizedStatus = String(status || "").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize shadow-sm",
        colors[normalizedStatus] || "border-slate-200 bg-slate-100 text-slate-700",
        className,
      )}
    >
      {normalizedStatus.replaceAll("_", " ")}
    </span>
  );
}
