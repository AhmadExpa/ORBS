import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui";
import { cn } from "@/lib/ui";

const metricToneClasses = {
  neutral: "from-slate-950 to-slate-700 text-slate-950",
  blue: "from-blue-600 to-cyan-500 text-blue-700",
  green: "from-emerald-500 to-teal-400 text-emerald-700",
  amber: "from-amber-500 to-orange-400 text-amber-700",
  rose: "from-rose-500 to-pink-400 text-rose-700",
};

export function MetricGrid({ items }) {
  return (
    <div className="dashboard-grid">
      {items.map((item) => {
        const Icon = item.icon;
        const toneClassName = metricToneClasses[item.tone] || metricToneClasses.neutral;

        return (
          <Card key={item.label} className="relative overflow-hidden">
            <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", toneClassName)} />
            <CardHeader className="border-b-0 pb-1">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-sm font-semibold text-slate-500">{item.label}</CardTitle>
                {Icon ? (
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-950/[0.06]", toneClassName)}>
                    <Icon className="h-4 w-4" />
                  </span>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">{item.value}</div>
              {item.helper ? <p className="mt-2 text-sm font-medium leading-5 text-slate-500">{item.helper}</p> : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
