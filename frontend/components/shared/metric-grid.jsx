import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui";
import { cn } from "@/lib/ui";

const metricToneClasses = {
  neutral: "bg-slate-100 text-slate-600",
  blue: "bg-brand-50 text-brand-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-accent-50 text-accent-600",
  rose: "bg-rose-50 text-rose-600",
};

export function MetricGrid({ items }) {
  return (
    <div className="dashboard-grid">
      {items.map((item) => {
        const Icon = item.icon;
        const toneClassName = metricToneClasses[item.tone] || metricToneClasses.neutral;

        return (
          <Card key={item.label}>
            <CardHeader className="border-b-0 pb-1">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-sm font-semibold text-slate-500">{item.label}</CardTitle>
                {Icon ? (
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneClassName)}>
                    <Icon className="h-4 w-4" />
                  </span>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-semibold tracking-[-0.02em] text-slate-900">{item.value}</div>
              {item.helper ? <p className="mt-2 text-sm font-medium leading-5 text-slate-500">{item.helper}</p> : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
