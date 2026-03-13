import React from "react";
import { cn } from "./utils.js";

const variants = {
  primary: "bg-sky-600 text-white hover:bg-sky-700",
  secondary: "bg-slate-900 text-white hover:bg-slate-800",
  ghost: "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200",
};

export function Button({ asChild = false, className, variant = "primary", children, ...props }) {
  const isActionButton = asChild ? false : Boolean(props.onClick || props.type || props.disabled);
  const Component = isActionButton ? "button" : "span";

  return (
    <Component
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
