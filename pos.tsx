import { Camera, Minus, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { BarcodeScanner } from "@/components/app/scanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { centavosToField, formatPeso, pesosToCentavos } from "@/lib/money";
import { cartTotals, useApp } from "@/lib/sarismart-store";
import type { CartLine } from "@/lib/types";
import { cn } from "@/lib/utils";

const QUICK_IDS = ["p-coke", "p-pancit", "p-safe", "p-egg"];

export function PosScreen() {
  const products = useApp((state) => state.products);
  const cart = useApp((state) => state.cart);
  const notice = useApp((state) => state.notice);
  const addToCart = useApp((state) => state.addToCart);
  const setQty = useApp((state) => state.setQty);
  const setLinePrice = useApp((state) => state.setLinePrice);
  const removeLine = useApp((state) => state.removeLine);
  const completeSale = useApp((state) => state.completeSale);
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<CartLine | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
  const totals = cartTotals(cart);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((product) => product.name.toLowerCase().includes(q) || product.barcode.includes(q))
      .slice(0, 8);
  }, [products, query]);

  const quick = QUICK_IDS.map((id) => products.find((product) => product.id === id)).filter(
    (product): product is NonNullable<typeof product> => Boolean(product),
  );

  const add = (productId: string) => {
    const result = addToCart(productId);
    setError(result);
    if (!result) setQuery("");
  };

  const onSearchSubmit = () => {
    const q = query.trim();
    if (!q) return;
    const exact = products.find((product) => product.barcode === q);
    if (exact) {
      add(exact.id);
      return;
    }
    if (matches.length === 1) add(matches[0]!.id);
  };

  const openPrice = (line: CartLine) => {
    setPricing(line);
    setPriceDraft(centavosToField(line.srp));
  };

  const nextPrice = pesosToCentavos(priceDraft);
  const liveMargin = pricing && nextPrice !== null ? nextPrice - pricing.unitCost : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pt-5 pb-4">
        <h1 className="text-xl font-semibold">Checkout</h1>
        <p className="text-sm text-muted">I-scan o hanapin, tapos kitain agad ang tubo.</p>
        {notice ? (
          <p className="rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary-ink" role="status">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit();
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-3 left-3 size-5 text-subtle" aria-hidden="true" />
            <Input
              className="pl-10"
              value={query}
              placeholder="Pangalan o barcode"
              aria-label="Hanapin ang item"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Button
            variant={scanning ? "primary" : "soft"}
            className="size-11 shrink-0 px-0"
            aria-label={scanning ? "Itigil ang scan" : "I-scan ang barcode"}
            onClick={() => setScanning((value) => !value)}
          >
            <Camera className="size-5" />
          </Button>
        </form>
        <BarcodeScanner
          active={scanning}
          onScan={(code) => {
            const product = products.find((item) => item.barcode === code);
            if (!product) {
              setError(`Walang item na may code na ${code}. Idagdag muna sa Inventory.`);
              return;
            }
            const result = addToCart(product.id);
            setError(result);
          }}
        />
        {query.trim() ? (
          matches.length === 0 ? (
            <p className="text-sm text-muted">Walang tumugma.</p>
          ) : (
            <ul className="overflow-hidden rounded-xl border border-border bg-surface">
              {matches.map((product) => (
                <li key={product.id} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left"
                    onClick={() => add(product.id)}
                    disabled={product.stock <= 0}
                  >
                    <img src={product.image} alt="" className="size-10 rounded-md object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{product.name}</span>
                      <span className="text-xs text-muted tabular-nums">
                        {formatPeso(product.srp)} · Stock {product.stock}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {quick.map((product) => (
              <button
                key={product.id}
                type="button"
                className="h-11 shrink-0 rounded-full border border-border bg-surface px-3 text-sm font-medium"
                onClick={() => add(product.id)}
              >
                {product.name.split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        {cart.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Walang laman ang cart. Mag-scan o pumili ng item.
          </p>
        ) : (
          <ul className="space-y-2">
            {cart.map((line) => {
              const custom = line.srp !== line.defaultSrp;
              return (
                <li key={line.lineId} className="lift rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{line.name}</p>
                      <button type="button" className="mt-1 text-left text-sm" onClick={() => openPrice(line)}>
                        <span className="font-semibold text-primary-ink tabular-nums">{formatPeso(line.srp)}</span>
                        <span className="text-muted"> · {custom ? "Custom SRP" : "Default SRP"}</span>
                      </button>
                      <p className={cn("text-xs tabular-nums", line.srp < line.unitCost ? "text-danger" : "text-muted")}>
                        Tubo {formatPeso((line.srp - line.unitCost) * line.qty)}
                      </p>
                    </div>
                    <button type="button" className="text-xs font-medium text-muted" onClick={() => removeLine(line.lineId)}>
                      Alisin
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="soft" className="size-11 px-0" aria-label="Bawasan" onClick={() => setQty(line.lineId, line.qty - 1)}>
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold tabular-nums">{line.qty}</span>
                    <Button variant="soft" className="size-11 px-0" aria-label="Dagdagan" onClick={() => setQty(line.lineId, line.qty + 1)}>
                      <Plus className="size-4" />
                    </Button>
                    <span className="ml-auto font-semibold tabular-nums">{formatPeso(line.srp * line.qty)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <footer className="border-t border-border bg-surface px-4 py-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted">Total bill</p>
            <p className="text-2xl font-semibold tabular-nums">{formatPeso(totals.total)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Estimated profit</p>
            <p className={cn("font-semibold tabular-nums", totals.profit < 0 ? "text-danger" : "text-primary-ink")}>
              {formatPeso(totals.profit)}
            </p>
            <p className="text-xs text-muted tabular-nums">{totals.qty} pcs</p>
          </div>
        </div>
        <Button
          className="mt-3 w-full"
          disabled={cart.length === 0}
          onClick={() => {
            const result = completeSale();
            setError(result);
          }}
        >
          Complete Sale
        </Button>
      </footer>

      <Dialog open={pricing !== null} onOpenChange={(next) => !next && setPricing(null)}>
        {pricing ? (
          <DialogContent title="Custom SRP" description={`${pricing.name}. Hindi magbabago ang unit cost.`}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (nextPrice === null) return;
                setLinePrice(pricing.lineId, nextPrice);
                setPricing(null);
              }}
            >
              <p className="text-sm text-muted">
                Default {formatPeso(pricing.defaultSrp)} · Cost {formatPeso(pricing.unitCost)}
              </p>
              <label className="mt-3 block text-xs font-semibold tracking-wide text-muted uppercase" htmlFor="override">
                Bagong presyo
              </label>
              <Input
                id="override"
                className="mt-2"
                inputMode="decimal"
                autoFocus
                value={priceDraft}
                onChange={(event) => setPriceDraft(event.target.value)}
              />
              <p className={cn("mt-2 text-sm tabular-nums", liveMargin !== null && liveMargin < 0 ? "text-danger" : "text-muted")}>
                {liveMargin === null ? "Hindi valid ang presyo." : `Tubo kada isa: ${formatPeso(liveMargin)}`}
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setLinePrice(pricing.lineId, pricing.defaultSrp);
                    setPricing(null);
                  }}
                >
                  Default
                </Button>
                <Button type="submit" className="flex-1" disabled={nextPrice === null}>
                  I-apply
                </Button>
              </div>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
