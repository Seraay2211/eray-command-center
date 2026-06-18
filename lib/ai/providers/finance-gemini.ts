import "server-only";

import { AI_GENERIC_ERROR, GEMINI_MODEL } from "@/lib/ai/config";
import {
  buildFinancePrompt,
  type FinanceAiInput,
  FINANCE_SYSTEM_INSTRUCTION,
} from "@/lib/ai/finance-prompts";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("AI bağlantısı şu anda hazır değil. Birazdan tekrar deneyebilirsin.");
  }
  return apiKey;
}

export async function generateFinanceSummaryWithGemini(
  input: FinanceAiInput,
): Promise<string> {
  const modelPath = GEMINI_MODEL.startsWith("models/")
    ? GEMINI_MODEL
    : `models/${GEMINI_MODEL}`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${encodeURIComponent(getApiKey())}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: FINANCE_SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildFinancePrompt(input) }],
          },
        ],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 1400,
        },
      }),
    },
  );
  const payload = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("AI bağlantısı şu anda hazır değil. Birazdan tekrar deneyebilirsin.");
    }
    if (response.status === 429) {
      throw new Error("AI servisi şu anda yoğun. Lütfen biraz sonra tekrar dene.");
    }
    throw new Error(payload.error?.message ? AI_GENERIC_ERROR : AI_GENERIC_ERROR);
  }

  const output =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? "";
  if (!output) throw new Error(AI_GENERIC_ERROR);
  return output;
}
