const DEFAULT_ERROR_MESSAGE =
  "İşlem tamamlanamadı. Birazdan tekrar deneyebilirsin.";

const SETUP_ERROR_MESSAGE =
  "Bu alan şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";

const AI_ERROR_MESSAGE =
  "AI çıktısı oluşturulamadı. Birazdan tekrar deneyebilirsin.";

const technicalPatterns = [
  /supabase/i,
  /sql editor/i,
  /database\//i,
  /veritaban[ıi]/i,
  /\benv\b/i,
  /api key/i,
  /api anahtar/i,
  /bucket/i,
  /storage/i,
  /\brls\b/i,
  /service[_-]?role/i,
  /stack/i,
  /payload/i,
  /debug/i,
  /internal key/i,
  /schema/i,
  /table/i,
  /relation/i,
  /column/i,
  /could not find/i,
  /pgrst/i,
  /jwt/i,
  /auth/i,
];

const setupPatterns = [
  /henüz hazır/i,
  /hazır değil/i,
  /gerekli güncelleme/i,
  /phase-\d/i,
  /schema\.sql/i,
];

export function getUserFacingError(
  message: string | null | undefined,
  fallback = DEFAULT_ERROR_MESSAGE,
): string {
  const value = message?.trim();

  if (!value) {
    return fallback;
  }

  if (/gemini|ai_provider|openai/i.test(value)) {
    return AI_ERROR_MESSAGE;
  }

  if (setupPatterns.some((pattern) => pattern.test(value))) {
    return SETUP_ERROR_MESSAGE;
  }

  if (technicalPatterns.some((pattern) => pattern.test(value))) {
    return fallback;
  }

  if (value.length > 220) {
    return fallback;
  }

  return value;
}

