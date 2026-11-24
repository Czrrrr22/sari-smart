export type ArtKind = "pack" | "bottle" | "jar";

const SHAPES: Record<ArtKind, string> = {
  pack: `<rect x="22" y="14" width="36" height="52" rx="4" fill="#00A86B"/><rect x="22" y="14" width="36" height="14" fill="#065C3B"/><rect x="28" y="38" width="24" height="3" fill="#F5F7F6"/><rect x="28" y="46" width="16" height="3" fill="#F5F7F6" opacity="0.85"/>`,
  bottle: `<rect x="34" y="12" width="12" height="10" rx="2" fill="#065C3B"/><rect x="26" y="20" width="28" height="46" rx="10" fill="#00A86B"/><rect x="32" y="40" width="16" height="3" fill="#F5F7F6"/>`,
  jar: `<rect x="24" y="18" width="32" height="8" rx="2" fill="#065C3B"/><rect x="26" y="26" width="28" height="38" rx="6" fill="#00A86B"/><rect x="32" y="38" width="16" height="12" rx="2" fill="#F5F7F6"/>`,
};

export function productArt(kind: ArtKind): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#E7F6EF"/>${SHAPES[kind]}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function artForCategory(category: "food" | "beverages" | "chemicals"): ArtKind {
  if (category === "beverages") return "bottle";
  if (category === "chemicals") return "jar";
  return "pack";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Hindi mabasa ang litrato."));
    reader.readAsDataURL(blob);
  });
}

/** Max width 400px, WebP quality 65%, matching the on-device memory budget. */
export async function compressImage(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 400 / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    throw new Error("Hindi ma-compress ang litrato.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const webp = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", 0.65);
  });
  const finalBlob =
    webp ??
    (await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.65);
    }));
  if (!finalBlob) throw new Error("Hindi ma-compress ang litrato.");
  return blobToDataUrl(finalBlob);
}
