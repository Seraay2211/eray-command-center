import type { AiProvider } from "@/types";

const envProvider = process.env.AI_PROVIDER?.trim().toLowerCase();

export const AI_PROVIDER = envProvider === "gemini" ? "gemini" : "gemini";

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

export const MAX_AI_INPUT_LENGTH = 8000;
export const AI_MAX_INPUT_CHARS = MAX_AI_INPUT_LENGTH;

export const AI_GENERIC_ERROR =
  "AI işlemi tamamlanamadı. Lütfen tekrar dene.";

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function resolveAiProvider(): AiProvider {
  if (AI_PROVIDER === "gemini" && hasGeminiApiKey()) {
    return "gemini";
  }

  return "demo";
}

export function getAiProviderLabel(provider: AiProvider): string {
  return provider === "gemini" ? "Gemini" : "Demo AI";
}

export function getAiProviderDescription(provider: AiProvider): string {
  return provider === "gemini"
    ? "Gerçek Gemini çıktıları aktif."
    : "Gemini API anahtarı tanımlı değil. Demo çıktı gösteriliyor.";
}
