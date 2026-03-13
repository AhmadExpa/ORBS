import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui";

export function MetricGrid({ items }) {
  return (
    <div className="dashboard-grid">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="border-b-0 pb-1">
            <CardTitle className="text-sm text-slate-500">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-slate-950">{item.value}</div>
            {item.helper ? <p className="mt-2 text-sm text-slate-500">{item.helper}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
