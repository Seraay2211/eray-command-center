import { NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib/ai/config";
import { formatAiOutputForDisplay } from "@/lib/ai/format-ai-output";
import { FINANCE_FILES_BUCKET } from "@/lib/finance/attachment-config";
import { createClient } from "@/lib/supabase/server";
import { updateAttachmentOcrText } from "@/services/finance-attachments-service";

export const runtime = "nodejs";

interface GeminiVisionResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

const demoWarning =
  "AI OCR bağlantısı hazır olmadığı için örnek OCR sonucu gösteriliyor.";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error, success: false }, { status });
}

function extractJson(text: string): {
  ai_summary: string;
  ocr_text: string;
} {
  const normalized = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return {
      ai_summary: "Dosyadaki finansal metin OCR ile çıkarıldı.",
      ocr_text: normalized.slice(0, 30000),
    };
  }

  const parsed = JSON.parse(normalized.slice(start, end + 1)) as Record<
    string,
    unknown
  >;
  return {
    ai_summary:
      typeof parsed.ai_summary === "string"
        ? parsed.ai_summary.trim().slice(0, 4000)
        : "Dosyadaki finansal metin OCR ile çıkarıldı.",
    ocr_text:
      typeof parsed.ocr_text === "string"
        ? parsed.ocr_text.trim().slice(0, 30000)
        : "",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { attachment_id?: unknown };
    const attachmentId =
      typeof body.attachment_id === "string" ? body.attachment_id.trim() : "";
    if (!attachmentId) {
      return jsonError("Okutulacak dosya belirtilmedi.", 400);
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return jsonError("Oturum bulunamadı. Lütfen tekrar giriş yap.", 401);
    }

    const { data: attachment, error } = await supabase
      .from("debt_attachments")
      .select("id,file_name,file_path,file_type")
      .eq("id", attachmentId)
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!attachment) {
      return jsonError("Dosya bulunamadı veya erişim yetkin yok.", 404);
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      const demoText = [
        `Dosya: ${attachment.file_name}`,
        "Demo OCR: Gemini bağlantısı yapılandırıldığında dekont metni burada gösterilecek.",
      ].join("\n");
      const updated = await updateAttachmentOcrText(
        attachment.id,
        demoText,
        demoWarning,
      );
      if (updated.error || !updated.data) {
        return jsonError(updated.error ?? "OCR sonucu kaydedilemedi.", 500);
      }
      return NextResponse.json({
        attachment: updated.data,
        provider: "demo",
        success: true,
        warning: demoWarning,
      });
    }

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(FINANCE_FILES_BUCKET)
      .download(attachment.file_path);
    if (downloadError || !fileBlob) {
      throw downloadError ?? new Error("Dosya depodan okunamadı.");
    }

    const modelPath = GEMINI_MODEL.startsWith("models/")
      ? GEMINI_MODEL
      : `models/${GEMINI_MODEL}`;
    const fileData = Buffer.from(await fileBlob.arrayBuffer()).toString(
      "base64",
    );
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Bu dosya bir dekont, ödeme belgesi veya finansal kayıt olabilir.
Yalnızca dosyada açıkça görülen metni çıkar; tahmin yürütme ve finansal tavsiye verme.
Kişisel verileri olduğu gibi aktar, yeni bilgi üretme.
Kısa özet yalnızca belgenin türünü, görünen tutarı, tarihi ve tarafları tarif etsin.
Yalnızca şu JSON nesnesini döndür:
{
  "ocr_text": "dosyada okunan metnin tamamı",
  "ai_summary": "en fazla üç cümlelik tarafsız özet"
}`,
                },
                {
                  inlineData: {
                    data: fileData,
                    mimeType: attachment.file_type,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      },
    );

    if (!response.ok) {
      return jsonError(
        response.status === 429
          ? "OCR servisi şu anda yoğun. Lütfen biraz sonra tekrar dene."
          : "OCR işlemi tamamlanamadı. Lütfen tekrar dene.",
        502,
      );
    }

    const payload = (await response.json()) as GeminiVisionResponse;
    const output =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("\n") ?? "";
    if (!output.trim()) {
      return jsonError("Dosyadaki metin okunamadı.", 422);
    }

    const result = extractJson(output);
    if (!result.ocr_text) {
      return jsonError("Dosyadaki metin okunamadı.", 422);
    }
    const updated = await updateAttachmentOcrText(
      attachment.id,
      formatAiOutputForDisplay(result.ocr_text),
      formatAiOutputForDisplay(result.ai_summary),
    );
    if (updated.error || !updated.data) {
      return jsonError(updated.error ?? "OCR sonucu kaydedilemedi.", 500);
    }

    return NextResponse.json({
      attachment: updated.data,
      provider: "gemini",
      success: true,
    });
  } catch {
    return jsonError("OCR işlemi tamamlanamadı. Lütfen tekrar dene.", 500);
  }
}
