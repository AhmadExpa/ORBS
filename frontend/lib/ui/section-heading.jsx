import React from "react";
import { cn } from "./utils.js";

export function SectionHeading({ eyebrow, title, description, className }) {
  return (
    <div className={cn("space-y-3", className)}>
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">{eyebrow}</p> : null}
      <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{title}</h2>
      {description ? <p className="max-w-2xl text-base leading-7 text-slate-600">{description}</p> : null}
    </div>
  );
}
