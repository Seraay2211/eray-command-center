import { NextResponse } from "next/server";
import { isAiActionKey } from "@/lib/ai/actions";
import { AI_GENERIC_ERROR, AI_MAX_INPUT_CHARS, resolveAiProvider } from "@/lib/ai/config";
import { generateWithDemo } from "@/lib/ai/providers/demo";
import { generateWithGemini } from "@/lib/ai/providers/gemini";
import { formatAiOutputForDisplay } from "@/lib/ai/format-ai-output";
import { createClient } from "@/lib/supabase/server";
import type { AiActionRequest, AiActionResponse, AiProvider } from "@/types";

export const runtime = "nodejs";

interface NoteRecord {
  content: string;
  id: string;
  title: string;
}

function jsonResponse(body: AiActionResponse, status = 200) {
  return NextResponse.json(body, { status });
}

function getTextValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return AI_GENERIC_ERROR;
}

function toUserFacingError(message: string): string {
  const knownMessages = new Set([
    AI_GENERIC_ERROR,
    "Bu not üzerinde işlem yapma yetkin yok.",
    "Geçerli bir AI aksiyonu seçilmedi.",
    "AI bağlantısı şu anda hazır değil. Birazdan tekrar deneyebilirsin.",
    "AI servisi şu anda yanıt vermiyor. Lütfen tekrar dene.",
    "AI servisi şu anda yoğun görünüyor. Lütfen biraz sonra tekrar dene.",
    "İşlenecek metin boş olamaz.",
    "Metin çok uzun. Lütfen kısalt.",
    "Oturum bulunamadı. Lütfen tekrar giriş yap.",
  ]);

  if (knownMessages.has(message)) {
    return message;
  }

  return AI_GENERIC_ERROR;
}

async function generateAiOutput(input: {
  action: AiActionRequest["action"];
  text: string;
  title?: string;
}): Promise<{
  output: string;
  provider: AiProvider;
}> {
  if (resolveAiProvider() === "gemini") {
    return generateWithGemini(input);
  }

  return generateWithDemo(input);
}

async function getOwnedNote(noteId: string): Promise<{
  note: NoteRecord | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");
  }

  const { data, error } = await supabase
    .from("notes")
    .select("id,title,content")
    .eq("id", noteId)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    note: (data as NoteRecord | null) ?? null,
    supabase,
    userId: authData.user.id,
  };
}

async function getAuthenticatedSupabase() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");
  }

  return { supabase, userId: authData.user.id };
}

async function logAiAction(params: {
  action: string;
  inputText: string;
  noteId?: string;
  outputText: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}) {
  try {
    const { data: settings, error: settingsError } = await params.supabase
      .from("user_settings")
      .select("ai_save_history")
      .eq("user_id", params.userId)
      .maybeSingle();

    if (!settingsError && settings?.ai_save_history === false) {
      return;
    }

    const { error } = await params.supabase.from("ai_actions").insert({
      action_type: params.action,
      input_text: params.inputText,
      note_id: params.noteId ?? null,
      output_text: params.outputText,
      user_id: params.userId,
    });

    if (
      error &&
      !error.message.includes("Could not find the table") &&
      !error.message.includes("schema cache")
    ) {
      throw error;
    }
  } catch {
    // AI history is optional in this phase. Core action flow should continue.
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<AiActionRequest>;
    const actionValue = getTextValue(payload.action).trim();

    if (!isAiActionKey(actionValue)) {
      return jsonResponse(
        { success: false, error: "Geçerli bir AI aksiyonu seçilmedi." },
        400,
      );
    }

    const noteId = getTextValue(payload.noteId).trim() || undefined;
    let text = getTextValue(payload.text).trim();
    let title = getTextValue(payload.title).trim();
    let supabase: Awaited<ReturnType<typeof createClient>>;
    let userId: string;

    if (noteId) {
      const noteContext = await getOwnedNote(noteId);
      supabase = noteContext.supabase;
      userId = noteContext.userId;

      if (!noteContext.note) {
        return jsonResponse(
          {
            success: false,
            error: "Bu not üzerinde işlem yapma yetkin yok.",
          },
          403,
        );
      }

      text = noteContext.note.content.trim();
      title = noteContext.note.title.trim();
    } else {
      const authContext = await getAuthenticatedSupabase();
      supabase = authContext.supabase;
      userId = authContext.userId;
    }

    if (!text) {
      return jsonResponse(
        { success: false, error: "İşlenecek metin boş olamaz." },
        400,
      );
    }

    if (text.length > AI_MAX_INPUT_CHARS) {
      return jsonResponse(
        { success: false, error: "Metin çok uzun. Lütfen kısalt." },
        400,
      );
    }

    const result = await generateAiOutput({
      action: actionValue,
      text,
      title,
    });
    const output = formatAiOutputForDisplay(result.output);

    await logAiAction({
      action: actionValue,
      inputText: text,
      noteId,
      outputText: output,
      supabase,
      userId,
    });

    return jsonResponse({
      success: true,
      provider: result.provider,
      output,
      action: actionValue,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    const safeMessage = toUserFacingError(message);
    const status =
      message.includes("Oturum bulunamadı")
          ? 401
        : message.includes("Geçerli bir AI aksiyonu") ||
            message.includes("İşlenecek metin boş olamaz") ||
            message.includes("Metin çok uzun")
          ? 400
          : message.includes("yetkin yok")
            ? 403
          : 500;

    return jsonResponse(
      {
        success: false,
        error: safeMessage,
      },
      status,
    );
  }
}
