"use client";

import React from "react";
import { cn } from "./utils.js";

/**
 * Lightweight underline tabs. Controlled or uncontrolled.
 * items: [{ value, label, icon }]
 */
export function Tabs({ items = [], value, defaultValue, onChange, className }) {
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.value);
  const active = value ?? internal;

  function select(next) {
    if (value === undefined) {
      setInternal(next);
    }
    onChange?.(next);
  }

  return (
    <div className={cn("flex items-center gap-1 border-b border-line", className)} role="tablist">
      {items.map((item) => {
        const isActive = item.value === active;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => select(item.value)}
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors",
              isActive
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
