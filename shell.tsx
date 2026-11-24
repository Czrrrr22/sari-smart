import { Home, Package, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Dashboard } from "@/components/app/dashboard";
import { Device } from "@/components/app/device";
import { Inventory } from "@/components/app/inventory";
import { PosScreen } from "@/components/app/pos";
import { useApp } from "@/lib/sarismart-store";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "checkout", label: "Checkout", icon: ShoppingCart },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AppShell() {
  const [tab, setTab] = useState<TabId>("dashboard");
  const notice = useApp((state) => state.notice);
  const clearNotice = useApp((state) => state.clearNotice);
  const cartCount = useApp((state) => state.cart.reduce((sum, line) => sum + line.qty, 0));

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(clearNotice, 4500);
    return () => window.clearTimeout(timer);
  }, [notice, clearNotice]);

  return (
    <Device>
      <div className="flex h-full min-h-0 flex-col">
        <main className="min-h-0 flex-1 overflow-hidden">
          {tab === "dashboard" ? (
            <div className="h-full overflow-y-auto">
              <Dashboard />
            </div>
          ) : null}
          {tab === "inventory" ? <Inventory /> : null}
          {tab === "checkout" ? <PosScreen /> : null}
        </main>
        <nav className="tabbar grid grid-cols-3 border-t border-border bg-surface" aria-label="Main">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
                  active ? "text-primary-ink" : "text-muted",
                )}
                aria-current={active ? "page" : undefined}
                onClick={() => setTab(item.id)}
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden="true" />
                  {item.id === "checkout" && cartCount > 0 ? (
                    <span className="absolute -top-2 -right-3 rounded-full bg-primary px-1.5 text-xs leading-4 font-semibold text-on-primary tabular-nums">
                      {cartCount}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </Device>
  );
}
