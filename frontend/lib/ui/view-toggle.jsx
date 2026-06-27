"use client";

import React from "react";
import { cn } from "./utils.js";

/**
 * Segmented control for switching between views (e.g. Table / Board).
 * options: [{ value, label, icon }]
 */
export function ViewToggle({ options = [], value, onChange, className }) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-lg border border-line bg-slate-50 p-1", className)} role="tablist">
      {options.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
              isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800",
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
