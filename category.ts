import type { CategoryId } from "@/lib/types";

const RULES: { category: CategoryId; words: string[] }[] = [
  {
    category: "beverages",
    words: [
      "coke",
      "coca",
      "sprite",
      "royal",
      "c2",
      "juice",
      "water",
      "tubig",
      "soda",
      "soft drink",
      "kape",
      "coffee",
      "kopiko",
      "milo",
      "beer",
      "softdrink",
      "yakult",
      "gatorade",
      "nature spring",
      "summit",
      "refresh",
    ],
  },
  {
    category: "chemicals",
    words: [
      "soap",
      "sabon",
      "bleach",
      "zonrox",
      "detergent",
      "surf",
      "tide",
      "downy",
      "joy",
      "safeguard",
      "shampoo",
      "baygon",
      "katol",
      "lys",
      "chlorine",
      "dishwash",
      "fabric",
      "cleaner",
      "alcohol",
      "insect",
      "domex",
      "clorox",
      "mr muscle",
      "fabric conditioner",
      "disinfectant",
    ],
  },
  {
    category: "food",
    words: [
      "noodle",
      "pancit",
      "lucky me",
      "biscuit",
      "skyflake",
      "skyflakes",
      "chips",
      "piattos",
      "nova",
      "egg",
      "itlog",
      "oil",
      "mantika",
      "rice",
      "bigas",
      "canned",
      "sardine",
      "sardinas",
      "corned",
      "bread",
      "tinapay",
      "candy",
      "bear brand",
      "nescafe",
      "3in1",
      "3-in-1",
      "toyo",
      "suka",
      "asin",
      "tinapa",
      "hotdog",
      "noodles",
    ],
  },
];

export function guessCategory(name: string): { category: CategoryId; confident: boolean } {
  const hay = name.toLowerCase();
  for (const rule of RULES) {
    if (rule.words.some((word) => hay.includes(word))) {
      return { category: rule.category, confident: true };
    }
  }
  return { category: "food", confident: false };
}

export function categoryLabel(id: CategoryId): string {
  if (id === "food") return "Food";
  if (id === "beverages") return "Beverages";
  return "Chemicals/Household";
}

export const CATEGORY_FILTERS: { id: "all" | CategoryId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "food", label: "Food" },
  { id: "beverages", label: "Beverages" },
  { id: "chemicals", label: "Chemicals/Household" },
];
