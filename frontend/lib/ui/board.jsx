import React from "react";
import { cn } from "./utils.js";

/**
 * Kanban-style board layout primitive (presentational only — no drag/drop).
 * Use <Board> as the horizontal column container and <BoardColumn> per status.
 */
export function Board({ className, children }) {
  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-2", className)}>
      {children}
    </div>
  );
}

export function BoardColumn({ title, count, accentClassName = "bg-slate-300", emptyMessage = "Nothing here", children, className }) {
  const hasItems = React.Children.count(children) > 0;
  return (
    <section className={cn("flex w-[300px] shrink-0 flex-col rounded-xl border border-line bg-slate-50/60", className)}>
      <header className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", accentClassName)} aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">{title}</span>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-line">{count}</span>
      </header>
      <div className="flex flex-1 flex-col gap-2.5 p-2.5">
        {hasItems ? children : <p className="px-2 py-6 text-center text-xs font-medium text-slate-400">{emptyMessage}</p>}
      </div>
    </section>
  );
}

export function BoardCard({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-white p-3 shadow-card transition-shadow hover:shadow-card-hover",
        props.onClick ? "cursor-pointer" : "",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
