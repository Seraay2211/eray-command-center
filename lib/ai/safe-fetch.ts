import "server-only";

import { AI_GENERIC_ERROR } from "@/lib/ai/config";

const AI_REQUEST_TIMEOUT_MS = 25_000;

export async function fetchAi(
  url: string,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error(
      "AI servisi zamanında yanıt vermedi. Lütfen biraz sonra tekrar dene.",
    );
  }
}

export async function readAiJson<T>(response: Response): Promise<T> {
  const raw = await response.text();
  if (!raw) throw new Error(AI_GENERIC_ERROR);

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(AI_GENERIC_ERROR);
  }
}
