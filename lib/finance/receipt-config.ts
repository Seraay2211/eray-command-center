export const FINANCE_RECEIPTS_BUCKET = "finance-receipts";
export const FINANCE_RECEIPT_MAX_BYTES = 10 * 1024 * 1024;
export const FINANCE_RECEIPT_SIGNED_URL_SECONDS = 60 * 15;

export const FINANCE_RECEIPT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export function sanitizeFinanceReceiptFileName(fileName: string): string {
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "")}`
    : "";
  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "dekont"}${extension}`;
}

export function validateFinanceReceiptFile(file: File): string | null {
  if (
    !FINANCE_RECEIPT_MIME_TYPES.includes(
      file.type as (typeof FINANCE_RECEIPT_MIME_TYPES)[number],
    )
  ) {
    return "Yalnızca PNG, JPG veya WEBP görselleri yükleyebilirsin.";
  }

  if (file.size <= 0 || file.size > FINANCE_RECEIPT_MAX_BYTES) {
    return "Dekont görseli 10 MB'dan büyük olamaz.";
  }

  return null;
}
