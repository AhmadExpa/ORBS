"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/shared";

const SUCCESS_STATUSES = new Set(["paid", "approved", "completed", "succeeded"]);

/**
 * Build the last `months` monthly buckets (oldest → newest) summing successful
 * payment submissions by the month they were submitted.
 */
export function buildMonthlySpend(submissions = [], months = 6) {
  const now = new Date();
  const buckets = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString(undefined, { month: "short" }),
      total: 0,
    });
  }

  const indexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]));

  submissions.forEach((submission) => {
    if (!SUCCESS_STATUSES.has(String(submission.status || "").toLowerCase())) {
      return;
    }
    if (!submission.submittedAt) {
      return;
    }
    const date = new Date(submission.submittedAt);
    if (Number.isNaN(date.getTime())) {
      return;
    }
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const index = indexByKey.get(key);
    if (index == null) {
      return;
    }
    const amount = Number(submission.amount || submission.orderId?.totalAmount || 0);
    buckets[index].total += amount > 0 ? amount : 0;
  });

  return buckets;
}

function SpendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 shadow-card">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function DashboardSpendChart({ submissions = [] }) {
  const data = buildMonthlySpend(submissions, 6);
  const hasSpend = data.some((bucket) => bucket.total > 0);

  if (!hasSpend) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-slate-50/60 text-center">
        <p className="text-sm font-semibold text-slate-700">No payments yet</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
          Your processed payments will chart here once your first charge or top-up clears.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="eo-spend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c6cf2" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#0c6cf2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} dy={6} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            width={64}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<SpendTooltip />} cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#0c6cf2"
            strokeWidth={2.5}
            fill="url(#eo-spend-fill)"
            dot={{ r: 3, fill: "#0c6cf2", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
