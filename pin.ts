export function hashPin(pin: string, salt: string): string {
  let h = 2166136261;
  const value = `${salt}:${pin}`;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
