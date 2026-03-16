"use client";

import { Card, CardContent, CardHeader } from "@/lib/ui";
import { Topbar } from "./topbar";

function LoadingCard({ lines = 3 }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-72 animate-pulse rounded-full bg-slate-100" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </CardContent>
    </Card>
  );
}

export function PageLoader({
  title = "Loading",
  subtitle = "Fetching the latest data for this screen.",
  cardCount = 1,
  lines = 3,
}) {
  const sectionCount = Math.min(Math.max(cardCount, 1), 1);

  return (
    <div>
      <Topbar title={title} subtitle={subtitle} />
      <div className="space-y-6 p-6">
        {Array.from({ length: sectionCount }).map((_, index) => (
          <LoadingCard key={index} lines={lines} />
        ))}
      </div>
    </div>
  );
}
