"use client";

import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/ui";

function LoaderPanel({ title, subtitle, className = "" }) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-xl border border-line bg-white px-6 py-6 text-center shadow-card",
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <LoaderCircle className="h-7 w-7 animate-spin" />
      </div>
      <p className="mt-5 text-lg font-semibold tracking-tight text-slate-900">{title}</p>
      {subtitle ? <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{subtitle}</p> : null}
      <div className="mx-auto mt-5 h-1.5 w-44 overflow-hidden rounded-full bg-slate-200">
        <div className="loader-progress h-full rounded-full bg-brand-600" />
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
