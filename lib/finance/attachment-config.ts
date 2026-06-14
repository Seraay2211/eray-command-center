export const FINANCE_FILES_BUCKET = "finance-files";
export const FINANCE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const FINANCE_ATTACHMENT_SIGNED_URL_SECONDS = 60 * 15;

export const FINANCE_ATTACHMENT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export function sanitizeFinanceAttachmentFileName(fileName: string): string {
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "")}`
    : "";
  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "finans-dosyasi"}${extension}`;
}

export function validateFinanceAttachmentFile(file: File): string | null {
  if (
    !FINANCE_ATTACHMENT_MIME_TYPES.includes(
      file.type as (typeof FINANCE_ATTACHMENT_MIME_TYPES)[number],
    )
  ) {
    return "Yalnızca PNG, JPG, WEBP veya PDF dosyaları yükleyebilirsin.";
  }

  if (file.size <= 0 || file.size > FINANCE_ATTACHMENT_MAX_BYTES) {
    return "Dosya boyutu 10 MB'dan büyük olamaz.";
  }

  return null;
}
