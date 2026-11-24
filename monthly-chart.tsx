import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthPoint } from "@/lib/metrics";

function SalesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const sales = payload.find((item) => item.dataKey === "sales")?.value ?? 0;
  const income = payload.find((item) => item.dataKey === "income")?.value ?? 0;
  return (
    <div className="lift rounded-lg border border-border bg-surface px-3 py-2 text-xs">
      <p className="font-medium text-fg tabular-nums">
        {label} / sales : {sales}
      </p>
      <p className="text-muted tabular-nums">
        {label} / income : {income}
      </p>
    </div>
  );
}

export function MonthlyChart({ data }: { data: MonthPoint[] }) {
  const [active, setActive] = useState(Math.max(0, data.length - 1));
  const row = data[active] ?? data[data.length - 1];
  const peak = Math.max(1000, ...data.map((item) => item.sales), ...data.map((item) => item.income));
  const top = Math.ceil(peak / 1000) * 1000;

  return (
    <div>
      <div className="mb-3 flex gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-sm bg-primary" aria-hidden="true" />
          Sales
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-sm bg-primary-ink" aria-hidden="true" />
          Income
        </span>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--color-muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              width={44}
              domain={[0, top]}
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => (value >= 1000 ? `₱${Math.round(value / 1000)}k` : `₱${value}`)}
            />
            <Tooltip content={<SalesTooltip />} cursor={{ fill: "var(--color-primary-soft)" }} />
            <Bar dataKey="sales" radius={[4, 4, 0, 0]} onClick={(_, index) => setActive(index)}>
              {data.map((item, index) => (
                <Cell
                  key={`${item.month}-sales`}
                  fill={index === active ? "var(--color-primary-ink)" : "var(--color-primary)"}
                  cursor="pointer"
                />
              ))}
            </Bar>
            <Bar dataKey="income" radius={[4, 4, 0, 0]} onClick={(_, index) => setActive(index)}>
              {data.map((item, index) => (
                <Cell
                  key={`${item.month}-income`}
                  fill={index === active ? "var(--color-fg)" : "var(--color-primary-ink)"}
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {row ? (
        <div className="mt-3 rounded-lg bg-primary-soft px-3 py-2">
          <p className="text-sm font-medium text-primary-ink tabular-nums">
            {row.month} / sales : {row.sales}
          </p>
          <p className="text-sm text-muted tabular-nums">
            {row.month} / income : {row.income}
          </p>
        </div>
      ) : null}
    </div>
  );
}
