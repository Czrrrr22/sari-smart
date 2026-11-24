/** Whole centavos. ₱12.50 is 1250. Never use binary floats for money. */

export function formatPeso(centavos: number): string {
  const neg = centavos < 0;
  const abs = Math.abs(Math.trunc(centavos));
  const pesos = Math.floor(abs / 100);
  const cents = abs % 100;
  return `${neg ? "-" : ""}₱${pesos.toLocaleString("en-PH")}.${cents.toString().padStart(2, "0")}`;
}

/** Parse a peso field into centavos. Extra fraction digits are truncated, not rounded. */
export function pesosToCentavos(raw: string): number | null {
  const cleaned = raw.trim().replace(/₱/g, "").replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  if (whole.length > 7) return null;
  const cents = (fraction + "00").slice(0, 2);
  return Number(whole) * 100 + Number(cents);
}

export function centavosToField(centavos: number): string {
  const abs = Math.abs(Math.trunc(centavos));
  const pesos = Math.floor(abs / 100);
  const cents = abs % 100;
  return `${pesos}.${cents.toString().padStart(2, "0")}`;
}
