import "server-only";

import { getAiActionDefinition } from "@/lib/ai/actions";
import { AI_GENERIC_ERROR, GEMINI_MODEL } from "@/lib/ai/config";
import type { AiActionKey } from "@/types";

interface GeminiApiError {
  code?: number;
  message?: string;
  status?: string;
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: GeminiApiError;
  promptFeedback?: {
    blockReason?: string;
  };
}

interface GenerateWithGeminiInput {
  action: AiActionKey;
  text: string;
  title?: string;
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Gemini API anahtarı bulunamadı.");
  }

  return apiKey;
}

function getModelPath(model: string): string {
  return model.startsWith("models/") ? model : `models/${model}`;
}

function getFriendlyGeminiError(
  status: number,
  payload: GeminiApiResponse,
): string {
  if (status === 401 || status === 403) {
    return "Gemini bağlantısı doğrulanamadı. API anahtarını kontrol et.";
  }

  if (status === 429) {
    return "AI servisi şu anda yoğun görünüyor. Lütfen biraz sonra tekrar dene.";
  }

  if (status === 400 || status === 404) {
    return "Gemini model ayarı geçerli görünmüyor. Model adını kontrol et.";
  }

  if (status >= 500) {
    return "Gemini servisi şu anda yanıt vermiyor. Lütfen tekrar dene.";
  }

  if (payload.error?.message) {
    return AI_GENERIC_ERROR;
  }

  return AI_GENERIC_ERROR;
}

function extractOutputText(payload: GeminiApiResponse): string {
  return (
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n")
      .trim() ?? ""
  );
}

export async function generateWithGemini({
  action,
  text,
  title = "",
}: GenerateWithGeminiInput): Promise<{
  output: string;
  provider: "gemini";
}> {
  const definition = getAiActionDefinition(action);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${getModelPath(
      GEMINI_MODEL,
    )}:generateContent?key=${encodeURIComponent(getApiKey())}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: definition.systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: definition.buildPrompt({
                  text,
                  title,
                }),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
        },
      }),
    },
  );

  const raw = await response.text();
  let payload: GeminiApiResponse = {};

  if (raw) {
    try {
      payload = JSON.parse(raw) as GeminiApiResponse;
    } catch {
      if (!response.ok) {
        throw new Error(AI_GENERIC_ERROR);
      }
    }
  }

  if (!response.ok) {
    throw new Error(getFriendlyGeminiError(response.status, payload));
  }

  const output = extractOutputText(payload);

  if (!output || payload.promptFeedback?.blockReason) {
    throw new Error(AI_GENERIC_ERROR);
  }

  return {
    provider: "gemini",
    output,
  };
}
