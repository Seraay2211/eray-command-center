import "server-only";

import { GEMINI_MODEL } from "@/lib/ai/config";
import { AI_PLAIN_TEXT_INSTRUCTION } from "@/lib/ai/format-ai-output";
import type { DailyCommandAiInput } from "@/lib/ai/daily-command-summary";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

export async function generateDailyCommandSummaryWithGemini(
  input: DailyCommandAiInput,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("Gemini API anahtarı bulunamadı.");

  const modelPath = GEMINI_MODEL.startsWith("models/")
    ? GEMINI_MODEL
    : `models/${GEMINI_MODEL}`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: [
                "Sen kişisel operasyon komuta asistanısın.",
                "Yalnızca verilen kullanıcı verilerini kullan; bilgi uydurma.",
                "Finansal tavsiye verme, sadece kayıtları ve riskleri özetle.",
                "Türkçe, kısa, doğrudan ve uygulanabilir yaz.",
                "Çıktıyı tam olarak şu başlıklarla üret:",
                "KOMUTA ÖZETİ",
                "Genel Durum:",
                "Öncelikli Aksiyonlar:",
                "Finans Uyarıları:",
                "Görev ve Takvim:",
                "Notlardan Çıkanlar:",
                "Bugün İçin Net Plan:",
                "Numaralı aksiyonlarda 01 — biçimini kullan.",
              ].concat(AI_PLAIN_TEXT_INSTRUCTION).join("\n"),
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Günlük komuta verileri:\n${JSON.stringify(input.context ?? input)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 900,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Gemini günlük planı oluşturamadı.");
  }

  const payload = (await response.json()) as GeminiResponse;
  const output =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? "";

  if (!output) throw new Error("Gemini boş yanıt döndürdü.");
  return output;
}
