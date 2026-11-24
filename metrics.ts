import type { Product, Sale } from "@/lib/types";

export function dayKey(ts: number): string {
  const date = new Date(ts);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function summarizeDay(sales: Sale[], day: Date) {
  const key = dayKey(day.getTime());
  let total = 0;
  let profit = 0;
  let count = 0;
  for (const sale of sales) {
    if (dayKey(sale.createdAt) !== key) continue;
    total += sale.total;
    profit += sale.profit;
    count += 1;
  }
  return { total, profit, count };
}

export function growthLabel(today: number, yesterday: number): string | null {
  if (yesterday <= 0) return today > 0 ? "Bago" : null;
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

export type MonthPoint = {
  month: string;
  sales: number;
  income: number;
};

export function monthlySeries(sales: Sale[], now = new Date()): MonthPoint[] {
  const buckets: { key: string; month: string; sales: number; income: number }[] = [];
  for (let i = 4; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleString("en-PH", { month: "short" }),
      sales: 0,
      income: 0,
    });
  }
  for (const sale of sales) {
    const date = new Date(sale.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = buckets.find((item) => item.key === key);
    if (!bucket) continue;
    bucket.sales += sale.total;
    bucket.income += sale.profit;
  }
  return buckets.map((bucket) => ({
    month: bucket.month,
    sales: Math.round(bucket.sales / 100),
    income: Math.round(bucket.income / 100),
  }));
}

export function lowStock(products: Product[], limit = 5): Product[] {
  return products.filter((product) => product.stock <= limit).sort((a, b) => a.stock - b.stock);
}
