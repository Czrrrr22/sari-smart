import { Camera, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { BarcodeScanner } from "@/components/app/scanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CATEGORY_FILTERS, categoryLabel, guessCategory } from "@/lib/category";
import { compressImage } from "@/lib/images";
import { centavosToField, formatPeso, pesosToCentavos } from "@/lib/money";
import { useApp } from "@/lib/sarismart-store";
import type { CategoryId, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type Draft = {
  name: string;
  barcode: string;
  category: CategoryId;
  categoryTouched: boolean;
  stock: string;
  cost: string;
  srp: string;
  image: string | null;
};

function emptyDraft(): Draft {
  return {
    name: "",
    barcode: "",
    category: "food",
    categoryTouched: false,
    stock: "1",
    cost: "",
    srp: "",
    image: null,
  };
}

function fromProduct(product: Product): Draft {
  return {
    name: product.name,
    barcode: product.barcode,
    category: product.category,
    categoryTouched: true,
    stock: String(product.stock),
    cost: centavosToField(product.unitCost),
    srp: centavosToField(product.srp),
    image: product.image,
  };
}

export function Inventory() {
  const products = useApp((state) => state.products);
  const saveProduct = useApp((state) => state.saveProduct);
  const deleteProduct = useApp((state) => state.deleteProduct);
  const [filter, setFilter] = useState<(typeof CATEGORY_FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Product | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((product) => (filter === "all" ? true : product.category === filter))
      .filter((product) =>
        q ? product.name.toLowerCase().includes(q) || product.barcode.includes(q) : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, filter, query]);

  const guess = guessCategory(draft.name);

  const openNew = () => {
    setDraft(emptyDraft());
    setError(null);
    setScanning(false);
    setConfirmDelete(false);
    setOpen("new");
  };

  const openEdit = (product: Product) => {
    setDraft(fromProduct(product));
    setError(null);
    setScanning(false);
    setConfirmDelete(false);
    setOpen(product);
  };

  const onName = (name: string) => {
    setDraft((current) => {
      const next = { ...current, name };
      if (!current.categoryTouched) next.category = guessCategory(name).category;
      return next;
    });
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const image = await compressImage(file);
      setDraft((current) => ({ ...current, image }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hindi ma-compress ang litrato.");
    }
  };

  const submit = () => {
    if (!/^\d+$/.test(draft.stock.trim())) {
      setError("Stock dapat whole number.");
      return;
    }
    const unitCost = pesosToCentavos(draft.cost);
    const srp = pesosToCentavos(draft.srp);
    if (unitCost === null || srp === null) {
      setError("Ilagay ang cost at SRP, halimbawa 12.50.");
      return;
    }
    const result = saveProduct(
      {
        name: draft.name,
        barcode: draft.barcode,
        category: draft.category,
        stock: Number(draft.stock),
        unitCost,
        srp,
        image: draft.image,
      },
      open && open !== "new" ? open.id : undefined,
    );
    if (result) {
      setError(result);
      return;
    }
    setOpen(null);
  };

  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto px-4 pt-5 pb-28">
      <h1 className="text-xl font-semibold">Inventory</h1>
      <p className="mt-1 text-sm text-muted">Hiwalay ang pagkain at kemikal, kahit magkasama sa estante.</p>
      <Input
        className="mt-4"
        value={query}
        placeholder="Hanapin ang item o barcode"
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Hanapin ang item"
      />
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {CATEGORY_FILTERS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={cn(
              "h-11 shrink-0 rounded-full px-3 text-sm font-medium",
              filter === chip.id ? "bg-primary text-on-primary" : "border border-border bg-surface text-fg",
            )}
            onClick={() => setFilter(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Walang item sa grupong ito.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {visible.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                className="lift flex w-full gap-3 rounded-xl border border-border bg-surface p-3 text-left"
                onClick={() => openEdit(product)}
              >
                <img src={product.image} alt="" className="size-14 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{product.name}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {categoryLabel(product.category)}
                    {product.barcode ? ` · ${product.barcode}` : ""}
                  </span>
                  <span className="mt-1 block text-sm tabular-nums">
                    <span className={product.stock <= 5 ? "font-semibold text-danger" : "text-muted"}>
                      Stock {product.stock}
                    </span>
                    <span className="text-muted"> · Cost {formatPeso(product.unitCost)}</span>
                    <span> · SRP {formatPeso(product.srp)}</span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      </div>
      <button
        type="button"
        className="absolute right-4 bottom-4 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary transition-transform duration-150 active:scale-[0.96]"
        aria-label="Magdagdag ng item"
        onClick={openNew}
      >
        <Plus className="size-6" />
      </button>

      <Dialog
        open={open !== null}
        onOpenChange={(next) => {
          if (!next) setOpen(null);
        }}
      >
        <DialogContent
          title={open === "new" ? "Bagong item" : "I-edit ang item"}
          description="Kukunan ng litrato, i-scan ang barcode, tapos awtomatikong igugrupo."
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {draft.image ? (
                <img src={draft.image} alt="" className="size-16 rounded-lg object-cover" />
              ) : (
                <span className="flex size-16 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Camera className="size-5" />
                </span>
              )}
              <label className="inline-flex h-11 cursor-pointer items-center rounded-lg bg-primary-soft px-3 text-sm font-semibold text-primary-ink">
                Kunan / piliin
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => void onPhoto(event.target.files?.[0])}
                />
              </label>
            </div>
            <label className="block text-xs font-semibold tracking-wide text-muted uppercase" htmlFor="item-name">
              Pangalan
            </label>
            <Input id="item-name" value={draft.name} placeholder="Hal. Zonrox 250ml" onChange={(event) => onName(event.target.value)} />
            <p className="text-xs text-muted">
              {draft.name.trim().length < 2
                ? "I-type ang pangalan para ma-sort."
                : guess.confident || draft.categoryTouched
                  ? `Grupo: ${categoryLabel(draft.categoryTouched ? draft.category : guess.category)}`
                  : "Hindi sigurado ang grupo. Pakipili sa ibaba."}
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_FILTERS.filter((chip) => chip.id !== "all").map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={cn(
                    "h-11 rounded-full px-3 text-sm font-medium",
                    draft.category === chip.id ? "bg-primary text-on-primary" : "border border-border bg-surface",
                  )}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      category: chip.id as CategoryId,
                      categoryTouched: true,
                    }))
                  }
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <label className="block text-xs font-semibold tracking-wide text-muted uppercase" htmlFor="item-code">
              Barcode
            </label>
            <div className="flex gap-2">
              <Input
                id="item-code"
                value={draft.barcode}
                inputMode="numeric"
                placeholder="Opsyonal"
                onChange={(event) => setDraft((current) => ({ ...current, barcode: event.target.value.trim() }))}
              />
              <Button variant="soft" className="shrink-0" onClick={() => setScanning((value) => !value)}>
                {scanning ? "Itigil" : "I-scan"}
              </Button>
            </div>
            <BarcodeScanner
              active={scanning}
              onScan={(code) => {
                setDraft((current) => ({ ...current, barcode: code }));
                setScanning(false);
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
                Stock
                <Input
                  className="mt-2"
                  inputMode="numeric"
                  value={draft.stock}
                  onChange={(event) => setDraft((current) => ({ ...current, stock: event.target.value }))}
                />
              </label>
              <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
                Cost
                <Input
                  className="mt-2"
                  inputMode="decimal"
                  placeholder="8.00"
                  value={draft.cost}
                  onChange={(event) => setDraft((current) => ({ ...current, cost: event.target.value }))}
                />
              </label>
              <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
                SRP
                <Input
                  className="mt-2"
                  inputMode="decimal"
                  placeholder="12.00"
                  value={draft.srp}
                  onChange={(event) => setDraft((current) => ({ ...current, srp: event.target.value }))}
                />
              </label>
            </div>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <Button className="w-full" onClick={submit}>
              I-save ang item
            </Button>
            {open && open !== "new" ? (
              confirmDelete ? (
                <div className="rounded-lg bg-danger-soft p-3">
                  <p className="text-sm text-danger">Sigurado? Hindi na ito mababalik sa listahan.</p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="ghost" className="flex-1" onClick={() => setConfirmDelete(false)}>
                      Huwag na
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={() => {
                        deleteProduct(open.id);
                        setOpen(null);
                      }}
                    >
                      Tanggalin
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" className="w-full text-danger" onClick={() => setConfirmDelete(true)}>
                  Tanggalin ang item
                </Button>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
