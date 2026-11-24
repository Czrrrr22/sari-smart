import { create } from "zustand";
import { persist } from "zustand/middleware";
import { artForCategory, productArt } from "@/lib/images";
import { formatPeso } from "@/lib/money";
import { hashPin } from "@/lib/pin";
import { createSeed } from "@/lib/seed";
import type { CartLine, Product, ProductInput, Sale } from "@/lib/types";
import { uid } from "@/lib/utils";

type LoginInput = { name: string; mobile: string; pin: string };

type AppState = {
  store: ReturnType<typeof createSeed>["store"];
  products: Product[];
  sales: Sale[];
  cart: CartLine[];
  unlocked: boolean;
  notice: string | null;
  login: (input: LoginInput) => string | null;
  register: (input: LoginInput) => string | null;
  logout: () => void;
  clearNotice: () => void;
  saveProduct: (input: ProductInput, id?: string) => string | null;
  deleteProduct: (id: string) => void;
  addToCart: (productId: string) => string | null;
  setQty: (lineId: string, qty: number) => void;
  setLinePrice: (lineId: string, srp: number) => void;
  removeLine: (lineId: string) => void;
  completeSale: () => string | null;
};

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function validateProfile(input: LoginInput): string | null {
  if (input.name.trim().length < 3) return "Ilagay ang pangalan ng store.";
  if (!/^09\d{9}$/.test(digits(input.mobile))) return "Mobile number dapat 11 digits, nagsisimula sa 09.";
  if (!/^\d{4}$/.test(input.pin)) return "PIN dapat 4 digits.";
  return null;
}

function normalize(input: LoginInput): LoginInput {
  return { name: input.name.trim(), mobile: digits(input.mobile), pin: input.pin };
}

const seed = createSeed();

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      store: seed.store,
      products: seed.products,
      sales: seed.sales,
      cart: [],
      unlocked: false,
      notice: null,
      login: (raw) => {
        const input = normalize(raw);
        const invalid = validateProfile(input);
        if (invalid) return invalid;
        const { store } = get();
        const nameOk = input.name.toLowerCase() === store.name.toLowerCase();
        const mobileOk = input.mobile === store.mobile;
        const pinOk = hashPin(input.pin, store.salt) === store.pinHash;
        if (!nameOk || !mobileOk || !pinOk) {
          return "Hindi tugma ang store, number, o PIN.";
        }
        set({ unlocked: true, notice: null });
        return null;
      },
      register: (raw) => {
        const input = normalize(raw);
        const invalid = validateProfile(input);
        if (invalid) return invalid;
        const salt = uid("salt");
        set({
          store: {
            name: input.name,
            mobile: input.mobile,
            salt,
            pinHash: hashPin(input.pin, salt),
          },
          sales: [],
          cart: [],
          unlocked: true,
          notice: "Bagong store naka-save sa device. Sample inventory nandito pa.",
        });
        return null;
      },
      logout: () => set({ unlocked: false, notice: null }),
      clearNotice: () => set({ notice: null }),
      saveProduct: (input, id) => {
        const name = input.name.trim();
        if (name.length < 2) return "Ilagay ang pangalan ng item.";
        if (input.stock < 0 || !Number.isInteger(input.stock)) return "Stock dapat whole number.";
        if (input.unitCost < 0 || input.srp < 0) return "Hindi puwedeng negative ang presyo.";
        const barcode = input.barcode.trim();
        const { products } = get();
        if (barcode && products.some((product) => product.barcode === barcode && product.id !== id)) {
          return "May item na na may barcode na iyan.";
        }
        const image = input.image ?? productArt(artForCategory(input.category));
        if (id) {
          set({
            products: products.map((product) =>
              product.id === id
                ? { ...product, ...input, name, barcode, image }
                : product,
            ),
          });
          return null;
        }
        const product: Product = {
          id: uid("item"),
          name,
          barcode,
          category: input.category,
          stock: input.stock,
          unitCost: input.unitCost,
          srp: input.srp,
          image,
        };
        set({ products: [product, ...products] });
        return null;
      },
      deleteProduct: (id) => {
        set({
          products: get().products.filter((product) => product.id !== id),
          cart: get().cart.filter((line) => line.productId !== id),
        });
      },
      addToCart: (productId) => {
        const product = get().products.find((item) => item.id === productId);
        if (!product) return "Hindi mahanap ang item.";
        if (product.stock <= 0) return `Ubos na ang ${product.name}.`;
        const existing = get().cart.find((line) => line.productId === productId);
        if (existing) {
          if (existing.qty >= product.stock) return `Hanggang ${product.stock} na lang ang stock.`;
          set({
            cart: get().cart.map((line) =>
              line.lineId === existing.lineId ? { ...line, qty: line.qty + 1 } : line,
            ),
            notice: null,
          });
          return null;
        }
        const line: CartLine = {
          lineId: uid("line"),
          productId: product.id,
          name: product.name,
          qty: 1,
          unitCost: product.unitCost,
          srp: product.srp,
          defaultSrp: product.srp,
        };
        set({ cart: [...get().cart, line], notice: null });
        return null;
      },
      setQty: (lineId, qty) => {
        const line = get().cart.find((item) => item.lineId === lineId);
        if (!line) return;
        const product = get().products.find((item) => item.id === line.productId);
        if (!product) return;
        const next = Math.max(1, Math.min(qty, product.stock));
        set({
          cart: get().cart.map((item) => (item.lineId === lineId ? { ...item, qty: next } : item)),
        });
      },
      setLinePrice: (lineId, srp) => {
        if (srp < 0) return;
        set({
          cart: get().cart.map((line) => (line.lineId === lineId ? { ...line, srp } : line)),
        });
      },
      removeLine: (lineId) => set({ cart: get().cart.filter((line) => line.lineId !== lineId) }),
      completeSale: () => {
        const { cart, products, sales } = get();
        if (cart.length === 0) return "Walang laman ang cart.";
        const stock = new Map(products.map((product) => [product.id, product.stock]));
        const items: Sale["items"] = [];
        for (const line of cart) {
          const product = products.find((item) => item.id === line.productId);
          if (!product) return "May item sa cart na tinanggal na.";
          const left = stock.get(product.id) ?? 0;
          if (line.qty > left) return `Kulang ang stock ng ${product.name}. Natitira: ${left}.`;
          stock.set(product.id, left - line.qty);
          const lineTotal = line.srp * line.qty;
          const lineProfit = (line.srp - product.unitCost) * line.qty;
          items.push({
            productId: product.id,
            name: product.name,
            qty: line.qty,
            unitCost: product.unitCost,
            srp: line.srp,
            lineTotal,
            lineProfit,
          });
        }
        const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
        const profit = items.reduce((sum, item) => sum + item.lineProfit, 0);
        const sale: Sale = { id: uid("sale"), createdAt: Date.now(), items, total, profit };
        set({
          products: products.map((product) => ({ ...product, stock: stock.get(product.id) ?? product.stock })),
          sales: [sale, ...sales],
          cart: [],
          notice: `Na-save ang sale. Bill ${formatPeso(total)} · Kita ${formatPeso(profit)}.`,
        });
        return null;
      },
    }),
    {
      name: "sarismart-db-v1",
      partialize: (state) => ({
        store: state.store,
        products: state.products,
        sales: state.sales,
        cart: state.cart,
        unlocked: state.unlocked,
      }),
      onRehydrateStorage: () => () => {
        queueMicrotask(() => {
          try {
            if (!window.localStorage.getItem("sarismart-db-v1")) {
              useApp.setState({ notice: null });
            }
          } catch {
            /* private mode */
          }
        });
      },
    },
  ),
);

export function cartTotals(cart: CartLine[]) {
  let total = 0;
  let profit = 0;
  let qty = 0;
  for (const line of cart) {
    total += line.srp * line.qty;
    profit += (line.srp - line.unitCost) * line.qty;
    qty += line.qty;
  }
  return { total, profit, qty };
}
