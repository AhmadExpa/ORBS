"use client";

import React from "react";
import { cn } from "./utils.js";

const ButtonThemeContext = React.createContext("default");

// Flat enterprise variants. Brand blue drives primary actions; orange accent and
// destructive/outline cover the remaining intents. No lift/heavy-shadow effects.
const sharedVariants = {
  primary:
    "border border-brand-600 bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:border-brand-700 active:bg-brand-700 focus-visible:ring-brand-600/40",
  secondary:
    "border border-slate-900 bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-900 focus-visible:ring-slate-400",
  accent:
    "border border-accent-600 bg-accent-600 text-white shadow-sm hover:bg-accent-700 hover:border-accent-700 active:bg-accent-700 focus-visible:ring-accent-600/40",
  outline:
    "border border-line bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 focus-visible:ring-slate-300",
  ghost:
    "border border-transparent bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-slate-300",
  destructive:
    "border border-rose-600 bg-rose-600 text-white shadow-sm hover:bg-rose-700 hover:border-rose-700 active:bg-rose-700 focus-visible:ring-rose-600/40",
};

const portalGhost =
  "border border-line bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 focus-visible:ring-slate-300";

const variantThemes = {
  default: { ...sharedVariants },
  // Admin chrome: brand-blue primary, bordered neutral default.
  portal: {
    ...sharedVariants,
    ghost: portalGhost,
  },
  // Customer portal (HubSpot-style): orange primary CTA.
  hubspot: {
    ...sharedVariants,
    primary: sharedVariants.accent,
    ghost: portalGhost,
  },
};

export function ButtonThemeProvider({ value = "default", children }) {
  return <ButtonThemeContext.Provider value={value}>{children}</ButtonThemeContext.Provider>;
}

export function Button({ asChild = false, className, variant = "primary", children, ...props }) {
  const theme = React.useContext(ButtonThemeContext);
  const isActionButton = asChild ? false : Boolean(props.onClick || props.type || props.disabled);
  const Component = isActionButton ? "button" : "span";
  const resolvedVariants = variantThemes[theme] || variantThemes.default;

  return (
    <Component
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold leading-5 tracking-[0.01em] transition-colors duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
        resolvedVariants[variant] || resolvedVariants.primary,
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
