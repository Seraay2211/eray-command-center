import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getNoteImageErrorMessage,
  removeNoteImageFiles,
} from "@/services/note-images-service";
import type { NoteImage } from "@/types";

export const runtime = "nodejs";

interface DeleteImageRouteProps {
  params: Promise<{
    imageId: string;
  }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error, success: false }, { status });
}

export async function DELETE(
  _request: Request,
  { params }: DeleteImageRouteProps,
) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return jsonError("Oturum bulunamadı. Lütfen tekrar giriş yap.", 401);
  }

  try {
    const { imageId } = await params;
    const { data, error } = await supabase
      .from("note_images")
      .select("*")
      .eq("id", imageId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return jsonError("Bu görsel üzerinde işlem yapma yetkin yok.", 403);
    }

    const image = data as NoteImage;
    await removeNoteImageFiles(supabase, [image]);

    const { error: deleteError } = await supabase
      .from("note_images")
      .delete()
      .eq("id", image.id)
      .eq("user_id", authData.user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      id: image.id,
      success: true,
    });
  } catch (error) {
    return jsonError(getNoteImageErrorMessage(error), 500);
  }
}
