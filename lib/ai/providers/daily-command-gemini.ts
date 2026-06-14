import "server-only";

import { GEMINI_MODEL } from "@/lib/ai/config";
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
                "BUGÜNÜN ÖNCELİKLERİ",
                "DİKKAT EDİLECEKLER",
                "FİNANS UYARILARI",
                "ÖNERİLEN 3 AKSİYON",
                "KISA YÖNETİCİ ÖZETİ",
              ].join("\n"),
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Günlük komuta verileri:\n${JSON.stringify(input)}`,
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
