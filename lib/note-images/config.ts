export const NOTE_IMAGES_BUCKET = "note-images";
export const NOTE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const NOTE_IMAGE_MAX_COUNT = 5;
export const NOTE_IMAGE_SIGNED_URL_SECONDS = 60 * 60;

export const NOTE_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export function sanitizeFileName(fileName: string): string {
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

  return `${baseName || "gorsel"}${extension}`;
}

export function validateNoteImageFile(file: File): string | null {
  if (
    !NOTE_IMAGE_MIME_TYPES.includes(
      file.type as (typeof NOTE_IMAGE_MIME_TYPES)[number],
    )
  ) {
    return "Sadece PNG, JPG, WEBP veya GIF yükleyebilirsin.";
  }

  if (file.size <= 0 || file.size > NOTE_IMAGE_MAX_BYTES) {
    return "Görsel boyutu 5 MB'dan büyük olamaz.";
  }

  return null;
}
