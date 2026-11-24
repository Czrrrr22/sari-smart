import { LogOut, Store } from "lucide-react";
import { useMemo } from "react";
import { MonthlyChart } from "@/components/app/monthly-chart";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/category";
import { formatPeso } from "@/lib/money";
import { addDays, growthLabel, lowStock, monthlySeries, summarizeDay } from "@/lib/metrics";
import { useApp } from "@/lib/sarismart-store";

export function Dashboard() {
  const store = useApp((state) => state.store);
  const sales = useApp((state) => state.sales);
  const products = useApp((state) => state.products);
  const logout = useApp((state) => state.logout);
  const now = useMemo(() => new Date(), []);
  const today = summarizeDay(sales, now);
  const yesterday = summarizeDay(sales, addDays(now, -1));
  const growth = growthLabel(today.total, yesterday.total);
  const series = useMemo(() => monthlySeries(sales, now), [sales, now]);
  const short = lowStock(products);

  return (
    <div className="space-y-3 px-4 py-4">
      <section className="lift flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Store className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold">{store.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted">
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            Naka-save sa device
          </p>
        </div>
        <Button variant="ghost" className="size-11 px-0" aria-label="Mag-logout" onClick={logout}>
          <LogOut className="size-5" />
        </Button>
      </section>

      <section className="rounded-2xl bg-primary p-5 text-on-primary">
        <p className="text-xs font-semibold tracking-wide uppercase">Today's sales summary</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="font-display text-4xl font-semibold tabular-nums">{formatPeso(today.total)}</p>
          {growth ? (
            <span className="mb-1 rounded-full bg-on-primary/15 px-2 py-1 text-xs font-semibold tabular-nums">
              {growth}
            </span>
          ) : null}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-on-primary/20 pt-4 text-sm">
          <div>
            <p className="text-on-primary/75">Estimated profit</p>
            <p className="mt-1 font-semibold tabular-nums">{formatPeso(today.profit)}</p>
          </div>
          <div>
            <p className="text-on-primary/75">Sales count</p>
            <p className="mt-1 font-semibold tabular-nums">{today.count}</p>
          </div>
        </div>
      </section>

      <section className="lift rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-base font-semibold">Monthly Sales & Income</h2>
        <p className="mt-1 text-sm text-muted">Pindutin ang bar para sa exact na halaga.</p>
        <div className="mt-4">
          <MonthlyChart data={series} />
        </div>
      </section>

      {short.length > 0 ? (
        <section className="lift rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-base font-semibold">Mababang stock</h2>
          <p className="mt-1 text-sm text-muted">Para hindi maubusan bago ang susunod na bili.</p>
          <ul className="mt-3 divide-y divide-border">
            {short.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-xs text-muted">{categoryLabel(product.category)}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-danger tabular-nums">{product.stock} left</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
