import { Check, CreditCard, Settings2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/ui";

const steps = [
  { id: "configure", label: "Configure", description: "Choose your service", icon: Settings2 },
  { id: "cart", label: "Review", description: "Confirm your cart", icon: ShoppingBag },
  { id: "payment", label: "Checkout", description: "Secure payment", icon: CreditCard },
];

export function OrderJourney({ current = "configure", className }) {
  const currentIndex = Math.max(steps.findIndex((step) => step.id === current), 0);

  return (
    <div className={cn("rounded-xl border border-line bg-white px-4 py-4 shadow-card sm:px-6", className)} aria-label="Order progress">
      <ol className="grid grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const complete = index < currentIndex;
          const active = index === currentIndex;

          return (
            <li key={step.id} className="relative flex min-w-0 items-center">
              {index ? (
                <span
                  className={cn(
                    "absolute right-1/2 top-5 h-px w-full -translate-y-1/2",
                    index <= currentIndex ? "bg-accent-500" : "bg-slate-200",
                  )}
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative z-10 flex min-w-0 items-center gap-3 bg-white pr-2 sm:pr-5">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    complete && "border-accent-600 bg-accent-600 text-white",
                    active && "border-accent-600 bg-accent-50 text-accent-700 ring-4 ring-accent-50",
                    !complete && !active && "border-slate-200 bg-slate-50 text-slate-400",
                  )}
                >
                  {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className={cn("block truncate text-xs font-semibold sm:text-sm", active || complete ? "text-slate-950" : "text-slate-400")}>
                    {step.label}
                  </span>
                  <span className="hidden truncate text-xs text-slate-500 md:block">{step.description}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
