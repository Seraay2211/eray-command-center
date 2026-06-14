import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  addSignedUrls,
  getNoteImageErrorMessage,
  NOTE_IMAGE_MAX_COUNT,
  NOTE_IMAGES_BUCKET,
  removeNoteImageFiles,
  sanitizeFileName,
  validateNoteImageFile,
} from "@/services/note-images-service";
import type { NoteImage } from "@/types";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error, success: false }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return jsonError("Oturum bulunamadı. Lütfen tekrar giriş yap.", 401);
  }

  try {
    const formData = await request.formData();
    const noteIdValue = formData.get("noteId");
    const noteId = typeof noteIdValue === "string" ? noteIdValue.trim() : "";
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (!noteId) {
      return jsonError("Görselin bağlanacağı not bulunamadı.", 400);
    }

    if (files.length === 0) {
      return jsonError("Yüklenecek görsel seçilmedi.", 400);
    }

    if (files.length > NOTE_IMAGE_MAX_COUNT) {
      return jsonError("En fazla 5 görsel yükleyebilirsin.", 400);
    }

    for (const file of files) {
      const validationError = validateNoteImageFile(file);

      if (validationError) {
        return jsonError(validationError, 400);
      }
    }

    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id")
      .eq("id", noteId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (noteError) {
      throw noteError;
    }

    if (!note) {
      return jsonError("Bu nota görsel ekleme yetkin yok.", 403);
    }

    const { count, error: countError } = await supabase
      .from("note_images")
      .select("*", { count: "exact", head: true })
      .eq("note_id", noteId)
      .eq("user_id", authData.user.id);

    if (countError) {
      throw countError;
    }

    if ((count ?? 0) + files.length > NOTE_IMAGE_MAX_COUNT) {
      return jsonError("En fazla 5 görsel yükleyebilirsin.", 400);
    }

    const uploadedRows: NoteImage[] = [];

    try {
      for (const [index, file] of files.entries()) {
        const safeFileName = sanitizeFileName(file.name);
        const path = `${authData.user.id}/${noteId}/${Date.now()}-${index}-${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from(NOTE_IMAGES_BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: image, error: insertError } = await supabase
          .from("note_images")
          .insert({
            bucket: NOTE_IMAGES_BUCKET,
            file_name: file.name,
            mime_type: file.type,
            note_id: noteId,
            path,
            size_bytes: file.size,
            user_id: authData.user.id,
          })
          .select("*")
          .single();

        if (insertError) {
          await supabase.storage.from(NOTE_IMAGES_BUCKET).remove([path]);
          throw insertError;
        }

        uploadedRows.push(image as NoteImage);
      }
    } catch (uploadError) {
      if (uploadedRows.length > 0) {
        await removeNoteImageFiles(supabase, uploadedRows);
        await supabase
          .from("note_images")
          .delete()
          .in(
            "id",
            uploadedRows.map((image) => image.id),
          );
      }

      throw uploadError;
    }

    const images = await addSignedUrls(supabase, uploadedRows);

    return NextResponse.json({
      images,
      success: true,
    });
  } catch (error) {
    return jsonError(getNoteImageErrorMessage(error), 500);
  }
}
