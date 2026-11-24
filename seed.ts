import { productArt, type ArtKind } from "@/lib/images";
import { hashPin } from "@/lib/pin";
import type { CategoryId, Product, Sale, StoreProfile } from "@/lib/types";
import { DEMO_STORE } from "@/lib/types";

type SeedItem = {
  id: string;
  name: string;
  barcode: string;
  category: CategoryId;
  stock: number;
  unitCost: number;
  srp: number;
  art: ArtKind;
};

const CATALOG: SeedItem[] = [
  { id: "p-pancit", name: "Lucky Me Pancit Canton", barcode: "4800016111101", category: "food", stock: 48, unitCost: 800, srp: 1200, art: "pack" },
  { id: "p-sky", name: "SkyFlakes Crackers", barcode: "4800022002202", category: "food", stock: 36, unitCost: 650, srp: 1000, art: "pack" },
  { id: "p-piattos", name: "Piattos Cheese", barcode: "4800016333303", category: "food", stock: 24, unitCost: 1500, srp: 2200, art: "pack" },
  { id: "p-bear", name: "Bear Brand 150g", barcode: "4800361400004", category: "food", stock: 18, unitCost: 4200, srp: 5500, art: "pack" },
  { id: "p-oil", name: "Cooking Oil 350ml", barcode: "4801234500505", category: "food", stock: 12, unitCost: 3800, srp: 4800, art: "jar" },
  { id: "p-egg", name: "Egg (1 pc)", barcode: "2000000000006", category: "food", stock: 4, unitCost: 900, srp: 1200, art: "pack" },
  { id: "p-sardines", name: "Sardines 155g", barcode: "4808888000707", category: "food", stock: 20, unitCost: 1800, srp: 2500, art: "jar" },
  { id: "p-coke", name: "Coke 290ml", barcode: "4800016123408", category: "beverages", stock: 40, unitCost: 1800, srp: 2500, art: "bottle" },
  { id: "p-c2", name: "C2 Apple 230ml", barcode: "4800016654309", category: "beverages", stock: 30, unitCost: 1400, srp: 2000, art: "bottle" },
  { id: "p-water", name: "Nature Spring 500ml", barcode: "4800019111210", category: "beverages", stock: 50, unitCost: 800, srp: 1500, art: "bottle" },
  { id: "p-kopiko", name: "Kopiko 78C", barcode: "8996001600111", category: "beverages", stock: 28, unitCost: 1200, srp: 1800, art: "bottle" },
  { id: "p-milo", name: "Milo 22g", barcode: "4800361333312", category: "beverages", stock: 60, unitCost: 600, srp: 1000, art: "pack" },
  { id: "p-safe", name: "Safeguard 60g", barcode: "4902430123413", category: "chemicals", stock: 16, unitCost: 2200, srp: 3200, art: "pack" },
  { id: "p-joy", name: "Joy Dishwashing 200ml", barcode: "4806508220014", category: "chemicals", stock: 14, unitCost: 2800, srp: 3900, art: "jar" },
  { id: "p-zonrox", name: "Zonrox 250ml", barcode: "4806501002215", category: "chemicals", stock: 3, unitCost: 3500, srp: 4900, art: "bottle" },
  { id: "p-surf", name: "Surf Powder 65g", barcode: "4800888123416", category: "chemicals", stock: 4, unitCost: 700, srp: 1200, art: "pack" },
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function atTime(day: Date, hour: number, minute: number) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0).getTime();
}

function txCount(date: Date, today: Date, rand: () => number): number {
  const start = new Date(today.getFullYear(), today.getMonth() - 4, 1);
  if (date < start || date > today) return 0;
  const monthsAgo =
    (today.getFullYear() - date.getFullYear()) * 12 + (today.getMonth() - date.getMonth());
  const base = [8, 11, 9, 7, 5][monthsAgo] ?? 4;
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(date, today)) return 16;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (same(date, yesterday)) return 14;
  return Math.max(3, base + Math.floor(rand() * 3) - 1);
}

export function createCatalog(): Product[] {
  return CATALOG.map((item) => ({
    id: item.id,
    name: item.name,
    barcode: item.barcode,
    category: item.category,
    stock: item.stock,
    unitCost: item.unitCost,
    srp: item.srp,
    image: productArt(item.art),
  }));
}

export function createHistory(products: Product[], now = new Date()): Sale[] {
  const rand = mulberry32(20261117);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sales: Sale[] = [];
  const cursor = new Date(today.getFullYear(), today.getMonth() - 4, 1);
  let n = 0;
  while (cursor <= today) {
    const count = txCount(cursor, today, rand);
    for (let i = 0; i < count; i += 1) {
      const product = products[Math.floor(rand() * products.length)]!;
      const qty = 1 + Math.floor(rand() * 2);
      const lineTotal = product.srp * qty;
      const lineProfit = (product.srp - product.unitCost) * qty;
      const hour = 8 + Math.floor(rand() * 12);
      const minute = Math.floor(rand() * 60);
      n += 1;
      sales.push({
        id: `seed-${n}`,
        createdAt: atTime(cursor, hour, minute),
        total: lineTotal,
        profit: lineProfit,
        items: [
          {
            productId: product.id,
            name: product.name,
            qty,
            unitCost: product.unitCost,
            srp: product.srp,
            lineTotal,
            lineProfit,
          },
        ],
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  sales.sort((a, b) => b.createdAt - a.createdAt);
  return sales;
}

export function createStoreProfile(): StoreProfile {
  return {
    name: DEMO_STORE.name,
    mobile: DEMO_STORE.mobile,
    salt: DEMO_STORE.salt,
    pinHash: hashPin(DEMO_STORE.pin, DEMO_STORE.salt),
  };
}

export function createSeed(now = new Date()) {
  const products = createCatalog();
  return {
    store: createStoreProfile(),
    products,
    sales: createHistory(products, now),
  };
}
