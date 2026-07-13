import React from "react";
import { cn } from "./utils.js";

const colors = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  open: "border-amber-200 bg-amber-50 text-amber-700",
  pending_verification: "border-amber-200 bg-amber-50 text-amber-700",
  trial_requested: "border-sky-200 bg-sky-50 text-sky-700",
  pending_signature: "border-amber-200 bg-amber-50 text-amber-700",
  new: "border-sky-200 bg-sky-50 text-sky-700",
  reviewing: "border-amber-200 bg-amber-50 text-amber-700",
  responded: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ready_to_sign: "border-sky-200 bg-sky-50 text-sky-700",
  signed_pending_storage: "border-amber-200 bg-amber-50 text-amber-700",
  signed_pending_admin: "border-amber-200 bg-amber-50 text-amber-700",
  suspended: "border-amber-200 bg-amber-50 text-amber-700",
  disputed: "border-orange-200 bg-orange-50 text-orange-700",
  blocked: "border-rose-300 bg-rose-100 text-rose-800",
  charged_back: "border-rose-300 bg-rose-100 text-rose-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600",
  deleted: "border-slate-200 bg-slate-100 text-slate-600",
  expired: "border-slate-200 bg-slate-100 text-slate-600",
  closed: "border-slate-200 bg-slate-100 text-slate-600",
  not_started: "border-slate-200 bg-slate-100 text-slate-600",
  draft: "border-slate-200 bg-slate-100 text-slate-600",
  resolved: "border-sky-200 bg-sky-50 text-sky-700",
};

export function StatusBadge({ status, className }) {
  const normalizedStatus = String(status || "").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        colors[normalizedStatus] || "border-slate-200 bg-slate-100 text-slate-600",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {normalizedStatus.replaceAll("_", " ")}
    </span>
  );
}
