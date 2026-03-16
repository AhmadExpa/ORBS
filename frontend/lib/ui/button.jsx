"use client";

import React from "react";
import { cn } from "./utils.js";

const ButtonThemeContext = React.createContext("default");

const variantThemes = {
  default: {
    primary:
      "border border-sky-600 bg-sky-600 text-white shadow-[0_12px_30px_rgba(2,132,199,0.22)] hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-[0_18px_38px_rgba(2,132,199,0.26)] active:translate-y-0 active:shadow-[0_10px_22px_rgba(2,132,199,0.2)] focus-visible:ring-sky-300",
    secondary:
      "border border-slate-900 bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-black hover:shadow-[0_18px_36px_rgba(15,23,42,0.2)] active:translate-y-0 active:shadow-[0_10px_22px_rgba(15,23,42,0.14)] focus-visible:ring-slate-300",
    ghost:
      "border border-slate-200 bg-white text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(15,23,42,0.05)] focus-visible:ring-slate-300",
  },
  portal: {
    primary:
      "border border-black bg-black text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:bg-slate-950 hover:shadow-[0_20px_40px_rgba(15,23,42,0.24)] active:translate-y-0 active:shadow-[0_10px_22px_rgba(15,23,42,0.16)] focus-visible:ring-slate-400",
    secondary:
      "border border-slate-900 bg-slate-900 text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:bg-black hover:shadow-[0_20px_40px_rgba(15,23,42,0.24)] active:translate-y-0 active:shadow-[0_10px_22px_rgba(15,23,42,0.16)] focus-visible:ring-slate-400",
    ghost:
      "border border-slate-200 bg-white text-slate-900 shadow-[0_10px_26px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-black hover:shadow-[0_16px_34px_rgba(15,23,42,0.1)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(15,23,42,0.06)] focus-visible:ring-slate-300",
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
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold leading-5 tracking-[0.01em] transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
        resolvedVariants[variant] || resolvedVariants.primary,
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
