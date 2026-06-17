import React from "react";
import { cn } from "./utils.js";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-white/80 bg-white/88 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.55)] ring-1 ring-slate-950/[0.04] backdrop-blur-xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn("space-y-1 border-b border-slate-950/[0.06] p-6", className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn("text-lg font-semibold tracking-[-0.01em] text-slate-950", className)}>{children}</h3>;
}

export function CardDescription({ className, children }) {
  return <p className={cn("text-sm leading-6 text-slate-500", className)}>{children}</p>;
}

export function CardContent({ className, children }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
