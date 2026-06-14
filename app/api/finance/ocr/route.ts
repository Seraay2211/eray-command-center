import { NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib/ai/config";
import { validateFinanceReceiptFile } from "@/lib/finance/receipt-config";
import { createClient } from "@/lib/supabase/server";
import { parseMoneyInput } from "@/lib/utils/currency";
import type { FinanceOcrResult } from "@/types";

export const runtime = "nodejs";

interface GeminiVisionResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

const missingConfigurationWarning =
  "OCR servisi yapılandırılmamış. Görsel yüklendi ancak otomatik okuma yapılamadı.";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error, success: false }, { status });
}

function emptyResult(warning: string): FinanceOcrResult {
  return {
    amount: null,
    payment_date: null,
    method: null,
    bank: null,
    sender: null,
    receiver: null,
    reference_no: null,
    description: null,
    confidence: "low",
    raw_text: "",
    warning,
  };
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, 1000) : null;
}

function normalizeDate(value: unknown): string | null {
  const text = cleanString(value);
  if (!text) return null;

  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const turkishMatch = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
  if (!turkishMatch) return null;

  return `${turkishMatch[3]}-${turkishMatch[2].padStart(2, "0")}-${turkishMatch[1].padStart(2, "0")}`;
}

function normalizeAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value !== "string") return null;
  const parsed = parseMoneyInput(value);
  return parsed > 0 ? parsed : null;
}

function extractJson(text: string): Record<string, unknown> {
  const normalized = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");

  if (start < 0 || end <= start) {
    throw new Error("OCR çıktısı okunamadı.");
  }

  return JSON.parse(normalized.slice(start, end + 1)) as Record<
    string,
    unknown
  >;
}

function normalizeResult(raw: Record<string, unknown>): FinanceOcrResult {
  const confidence =
    raw.confidence === "medium" || raw.confidence === "high"
      ? raw.confidence
      : "low";

  return {
    amount: normalizeAmount(raw.amount),
    payment_date: normalizeDate(raw.payment_date),
    method: cleanString(raw.method),
    bank: cleanString(raw.bank),
    sender: cleanString(raw.sender),
    receiver: cleanString(raw.receiver),
    reference_no: cleanString(raw.reference_no),
    description: cleanString(raw.description),
    confidence,
    raw_text: cleanString(raw.raw_text)?.slice(0, 12000) ?? "",
    warning: cleanString(raw.warning),
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return jsonError("Oturum bulunamadı. Lütfen tekrar giriş yap.", 401);
    }

    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File) || fileValue.size <= 0) {
      return jsonError("Okunacak dekont görseli seçilmedi.", 400);
    }

    const validationError = validateFinanceReceiptFile(fileValue);
    if (validationError) {
      return jsonError(validationError, 400);
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        provider: "demo",
        result: emptyResult(missingConfigurationWarning),
        success: true,
      });
    }

    const modelPath = GEMINI_MODEL.startsWith("models/")
      ? GEMINI_MODEL
      : `models/${GEMINI_MODEL}`;
    const imageData = Buffer.from(await fileValue.arrayBuffer()).toString(
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
                  text: `Bu görsel bir Türk banka dekontu, ödeme makbuzu veya işlem ekranı olabilir.
Görselde gerçekten görülen bilgileri çıkar. Tahmin etme; okunamayan alanları null bırak.
Tutarı para birimi işaretleri ve binlik ayraçları olmadan JSON number olarak döndür.
Ödeme tarihini YYYY-MM-DD biçiminde döndür.
Yalnızca şu JSON nesnesini döndür:
{
  "amount": number | null,
  "payment_date": string | null,
  "method": string | null,
  "bank": string | null,
  "sender": string | null,
  "receiver": string | null,
  "reference_no": string | null,
  "description": string | null,
  "confidence": "low" | "medium" | "high",
  "raw_text": string,
  "warning": string | null
}`,
                },
                {
                  inlineData: {
                    data: imageData,
                    mimeType: fileValue.type,
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
      return jsonError("Dekont üzerindeki bilgiler okunamadı.", 422);
    }

    return NextResponse.json({
      provider: "gemini",
      result: normalizeResult(extractJson(output)),
      success: true,
    });
  } catch {
    return jsonError("OCR işlemi tamamlanamadı. Lütfen tekrar dene.", 500);
  }
}
