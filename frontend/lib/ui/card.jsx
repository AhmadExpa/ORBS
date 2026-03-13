import React from "react";
import { cn } from "./utils.js";

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn("space-y-1 border-b border-slate-100 p-6", className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn("text-lg font-semibold text-slate-950", className)}>{children}</h3>;
}

export function CardDescription({ className, children }) {
  return <p className={cn("text-sm text-slate-500", className)}>{children}</p>;
}

export function CardContent({ className, children }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
