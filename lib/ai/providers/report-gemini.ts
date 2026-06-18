import "server-only";

import { AI_GENERIC_ERROR, GEMINI_MODEL } from "@/lib/ai/config";
import {
  buildReportPrompt,
  REPORT_SYSTEM_INSTRUCTION,
} from "@/lib/ai/report-prompts";
import type {
  AiReportSourceNote,
  AiReportSourceTask,
  ReportType,
} from "@/types";

interface GeminiReportResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
}

interface GenerateReportInput {
  manualText: string;
  notes: AiReportSourceNote[];
  periodEnd: string | null;
  periodStart: string | null;
  reportType: ReportType;
  tasks: AiReportSourceTask[];
  title: string;
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("AI bağlantısı şu anda hazır değil. Birazdan tekrar deneyebilirsin.");
  }
  return apiKey;
}

function extractJson(text: string) {
  const normalized = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");

  if (start < 0 || end <= start) throw new Error(AI_GENERIC_ERROR);

  const parsed = JSON.parse(normalized.slice(start, end + 1)) as {
    title?: unknown;
    summary?: unknown;
    content?: unknown;
  };
  const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
  const summary =
    typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  const content =
    typeof parsed.content === "string" ? parsed.content.trim() : "";

  if (!title || !summary || !content) throw new Error(AI_GENERIC_ERROR);
  return { title, summary, content };
}

export async function generateReportWithGemini(input: GenerateReportInput) {
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
          parts: [{ text: REPORT_SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildReportPrompt(input) }],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: "application/json",
        },
      }),
    },
  );
  const payload = (await response.json()) as GeminiReportResponse;

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "AI bağlantısı şu anda hazır değil. Birazdan tekrar deneyebilirsin.",
      );
    }
    if (response.status === 429) {
      throw new Error(
        "AI servisi şu anda yoğun görünüyor. Lütfen biraz sonra tekrar dene.",
      );
    }
    throw new Error(payload.error?.message ? AI_GENERIC_ERROR : AI_GENERIC_ERROR);
  }

  const output =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n") ?? "";

  return extractJson(output);
}
