"use client";

import { Card, CardContent } from "@/lib/ui";

function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton-shimmer rounded-full bg-slate-200/80 ${className}`} />;
}

function LoadingCard({ lines = 3, index = 0 }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-5 border-b border-slate-950/[0.06] pb-5">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <SkeletonBlock className="h-11 w-11 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <SkeletonBlock className="h-4 w-44 max-w-full" />
              <SkeletonBlock className="h-3 w-72 max-w-full bg-slate-100/90" />
            </div>
          </div>
          <SkeletonBlock className="hidden h-9 w-28 rounded-full bg-slate-100/90 sm:block" />
        </div>

        <div className="mt-5 grid gap-3">
          {Array.from({ length: lines }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid min-h-14 grid-cols-[minmax(0,1fr)_80px_96px] items-center gap-4 rounded-[18px] border border-slate-950/[0.05] bg-white/70 px-4"
            >
              <SkeletonBlock className={`h-3.5 ${rowIndex % 2 === 0 ? "w-4/5" : "w-3/5"} bg-slate-100/90`} />
              <SkeletonBlock className="h-3.5 w-14 justify-self-end bg-slate-100/90" />
              <SkeletonBlock className="h-7 w-20 justify-self-end bg-slate-100/90" />
            </div>
          ))}
        </div>

        {index === 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SkeletonBlock className="h-20 rounded-[18px] bg-slate-100/90" />
            <SkeletonBlock className="h-20 rounded-[18px] bg-slate-100/90" />
            <SkeletonBlock className="h-20 rounded-[18px] bg-slate-100/90" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LoadingTopbar({ title }) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/70 bg-white/78 px-6 py-5 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.45)] backdrop-blur-2xl md:px-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">ElevenOrbits</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950 md:text-[28px]">{title}</h1>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
              <div className="loader-progress h-full rounded-full bg-slate-950" />
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <SkeletonBlock className="h-11 w-32 bg-slate-100/90" />
          <SkeletonBlock className="h-11 w-36 bg-slate-100/90" />
        </div>
      </div>
    </div>
  );
}

function LoadingMetrics() {
  return (
    <div className="dashboard-grid">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <SkeletonBlock className="h-3 w-28 bg-slate-100/90" />
                <SkeletonBlock className="h-8 w-20 rounded-xl" />
              </div>
              <SkeletonBlock className="h-9 w-9 bg-slate-100/90" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PageLoader({ title = "Loading", cardCount = 1, lines = 3 }) {
  const sectionCount = Math.min(Math.max(cardCount, 1), 2);

  return (
    <div>
      <LoadingTopbar title={title} />
      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-6 md:p-8">
        <LoadingMetrics />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          {Array.from({ length: sectionCount }).map((_, index) => (
            <LoadingCard key={index} index={index} lines={lines} />
          ))}
        </div>
      </div>
    </div>
  );
}
