import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
export {
  NOTE_IMAGE_MAX_BYTES,
  NOTE_IMAGE_MAX_COUNT,
  NOTE_IMAGE_MIME_TYPES,
  NOTE_IMAGES_BUCKET,
  NOTE_IMAGE_SIGNED_URL_SECONDS,
  sanitizeFileName,
  validateNoteImageFile,
} from "@/lib/note-images/config";
import { NOTE_IMAGE_SIGNED_URL_SECONDS } from "@/lib/note-images/config";
import type { NoteImage } from "@/types";

interface SupabaseErrorLike {
  code?: string;
  message?: string;
}

function isMissingTableError(error: SupabaseErrorLike | null): boolean {
  const message = error?.message ?? "";

  return (
    error?.code === "PGRST205" ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
}

export function getNoteImageErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error);

  if (
    message.includes("Bucket not found") ||
    message.includes("not found") ||
    message.includes("note-images")
  ) {
    return "Görsel alanı şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }

  if (
    message.includes("PGRST205") ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  ) {
    return "Görsel alanı şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }

  if (
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("Unauthorized")
  ) {
    return "Bu görsel üzerinde işlem yapma yetkin yok.";
  }

  return message || "Görsel işlemi tamamlanamadı. Lütfen tekrar dene.";
}

export async function addSignedUrls(
  supabase: SupabaseClient,
  images: NoteImage[],
): Promise<NoteImage[]> {
  if (images.length === 0) {
    return [];
  }

  const groups = new Map<string, NoteImage[]>();

  images.forEach((image) => {
    const current = groups.get(image.bucket) ?? [];
    current.push(image);
    groups.set(image.bucket, current);
  });

  const signedGroups = await Promise.all(
    Array.from(groups.entries()).map(async ([bucket, bucketImages]) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrls(
          bucketImages.map((image) => image.path),
          NOTE_IMAGE_SIGNED_URL_SECONDS,
        );

      if (error) {
        return bucketImages;
      }

      return bucketImages.map((image, index) => ({
        ...image,
        signedUrl: data[index]?.signedUrl ?? undefined,
      }));
    }),
  );

  return signedGroups.flat();
}

export async function getNoteImages(
  supabase: SupabaseClient,
  userId: string,
  noteIds: string[],
): Promise<NoteImage[]> {
  if (noteIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("note_images")
    .select("*")
    .eq("user_id", userId)
    .in("note_id", noteIds)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }

    throw error;
  }

  return addSignedUrls(supabase, (data ?? []) as NoteImage[]);
}

export async function removeNoteImageFiles(
  supabase: SupabaseClient,
  images: Pick<NoteImage, "bucket" | "path">[],
): Promise<void> {
  const groups = new Map<string, string[]>();

  images.forEach((image) => {
    const paths = groups.get(image.bucket) ?? [];
    paths.push(image.path);
    groups.set(image.bucket, paths);
  });

  for (const [bucket, paths] of groups) {
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      throw error;
    }
  }
}
