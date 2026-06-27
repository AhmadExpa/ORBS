import React from "react";
import { cn } from "./utils.js";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white shadow-card transition-shadow duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn("space-y-1 border-b border-line p-5", className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn("text-lg font-semibold tracking-[-0.01em] text-slate-950", className)}>{children}</h3>;
}

export function CardDescription({ className, children }) {
  return <p className={cn("text-sm leading-6 text-slate-500", className)}>{children}</p>;
}

export function CardContent({ className, children }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
