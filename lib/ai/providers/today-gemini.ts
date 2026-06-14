import "server-only";

import { GEMINI_MODEL } from "@/lib/ai/config";
import { AI_PLAIN_TEXT_INSTRUCTION } from "@/lib/ai/format-ai-output";
import type { TodaySummary } from "@/types/today";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

export async function generateTodaySummaryWithGemini(
  summary: TodaySummary,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("Gemini API anahtarı bulunamadı.");

  const modelPath = GEMINI_MODEL.startsWith("models/")
    ? GEMINI_MODEL
    : `models/${GEMINI_MODEL}`;
  const compactData = {
    date: summary.dateLabel,
    counts: summary.counts,
    priorities: summary.priorities.slice(0, 8).map((item) => ({
      title: item.title,
      reason: item.reason,
      source: item.source,
    })),
    finance: [...summary.financeOverdue, ...summary.financeDueToday].map(
      (item) => ({
        title: item.title,
        remainingAmount: item.remainingAmount,
        dueDate: item.dueDate,
        priority: item.priority,
      }),
    ),
    tasks: [...summary.tasksOverdue, ...summary.tasksDueToday].map((item) => ({
      title: item.title,
      dueDate: item.dueDate,
      priority: item.priority,
    })),
    calendar: summary.calendarItems.map((item) => ({
      title: item.title,
      startAt: item.startAt,
      priority: item.priority,
    })),
  };
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
                "Sen kişisel bir operasyon asistanısın.",
                "Yalnızca verilen gerçek günlük verileri kullan.",
                "Finansal, hukuki veya profesyonel tavsiye verme.",
                "Türkçe, kısa, doğrudan ve uygulanabilir yaz.",
                "Çıktıyı şu başlıklarla üret: GÜNÜN ANA RİSKİ, İLK 3 ÖNCELİK, KISA AKSİYON ÖNERİSİ, FİNANSAL UYARI.",
              ].concat(AI_PLAIN_TEXT_INSTRUCTION).join("\n"),
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Bugünün operasyon verileri:\n${JSON.stringify(compactData)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700,
        },
      }),
    },
  );
  if (!response.ok) throw new Error("Gemini özeti oluşturulamadı.");

  const payload = (await response.json()) as GeminiResponse;
  const output =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? "";
  if (!output) throw new Error("Gemini boş yanıt döndürdü.");
  return output;
}
