import { NextResponse } from "next/server";
import {
  AI_MAX_INPUT_CHARS,
  resolveAiProvider,
} from "@/lib/ai/config";
import { generateWithDemo } from "@/lib/ai/providers/demo";
import { generateWithGemini } from "@/lib/ai/providers/gemini";
import { formatAiOutputForDisplay } from "@/lib/ai/format-ai-output";
import { createClient } from "@/lib/supabase/server";
import type { AiActionResponse } from "@/types";

export const runtime = "nodejs";

function jsonResponse(body: AiActionResponse, status = 200) {
  return NextResponse.json(body, { status });
}

function getText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return jsonResponse(
        { success: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yap." },
        401,
      );
    }

    const payload = (await request.json()) as {
      text?: unknown;
      title?: unknown;
    };
    const text = getText(payload.text);
    const title = getText(payload.title);

    if (!text) {
      return jsonResponse(
        { success: false, error: "Lütfen gün içinde yaşadıklarını kısaca yaz." },
        400,
      );
    }

    if (text.length > AI_MAX_INPUT_CHARS) {
      return jsonResponse(
        { success: false, error: "Metin çok uzun. Lütfen kısalt." },
        400,
      );
    }

    const result = await (async () => {
      if (resolveAiProvider() === "gemini") {
        try {
          return await generateWithGemini({
            action: "daily_summary",
            text,
            title,
          });
        } catch {
          return generateWithDemo({ action: "daily_summary", text, title });
        }
      }

      return generateWithDemo({ action: "daily_summary", text, title });
    })();

    return jsonResponse({
      action: "daily_summary",
      output: formatAiOutputForDisplay(result.output),
      provider: result.provider,
      success: true,
    });
  } catch {
    return jsonResponse(
      {
        success: false,
        error: "Özet oluşturulamadı. Birazdan tekrar deneyebilirsin.",
      },
      500,
    );
  }
}
