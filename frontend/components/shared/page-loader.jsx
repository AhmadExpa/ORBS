"use client";

import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/ui";

function LoaderPanel({ title, subtitle, className = "" }) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-[28px] border border-white/80 bg-white/92 px-6 py-6 text-center shadow-[0_34px_120px_-52px_rgba(15,23,42,0.7)] ring-1 ring-slate-950/[0.04] backdrop-blur-2xl",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_22px_44px_-26px_rgba(15,23,42,0.9)]">
        <LoaderCircle className="h-7 w-7 animate-spin" />
      </div>
      <p className="mt-5 text-lg font-semibold tracking-tight text-slate-950">{title}</p>
      {subtitle ? <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{subtitle}</p> : null}
      <div className="mx-auto mt-5 h-1.5 w-44 overflow-hidden rounded-full bg-slate-200">
        <div className="loader-progress h-full rounded-full bg-slate-950" />
      </div>
    </div>
  );
}

export function PageLoader({ title = "Loading", subtitle = "Preparing your workspace..." }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <LoaderPanel title={title} subtitle={subtitle} />
    </div>
  );
}

export function CenterLoader({ title = "Loading", subtitle = "Fetching the latest data...", className = "" }) {
  return <LoaderPanel title={title} subtitle={subtitle} className={className} />;
}
