import { NextResponse } from "next/server";
import { hasGeminiApiKey } from "@/lib/ai/config";
import { generateTodaySummaryWithGemini } from "@/lib/ai/providers/today-gemini";
import { formatAiOutputForDisplay } from "@/lib/ai/format-ai-output";
import { createClient } from "@/lib/supabase/server";
import { getTodaySummary } from "@/lib/today/today-summary";

export const runtime = "nodejs";

const fallback =
  "AI özeti şu anda kullanılamıyor. Günlük veriler manuel olarak listelendi.";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yap." },
        { status: 401 },
      );
    }

    const summaryResult = await getTodaySummary();
    if (summaryResult.error || !summaryResult.data) {
      return NextResponse.json(
        { success: false, error: "Bugün verileri AI özeti için hazırlanamadı." },
        { status: 500 },
      );
    }

    if (!hasGeminiApiKey()) {
      return NextResponse.json({
        success: true,
        provider: "demo",
        output: formatAiOutputForDisplay(fallback),
      });
    }

    try {
      const output = await generateTodaySummaryWithGemini(summaryResult.data);
      return NextResponse.json({
        success: true,
        provider: "gemini",
        output: formatAiOutputForDisplay(output),
      });
    } catch {
      return NextResponse.json({
        success: true,
        provider: "demo",
        output: formatAiOutputForDisplay(fallback),
      });
    }
  } catch {
    return NextResponse.json({
      success: true,
      provider: "demo",
      output: formatAiOutputForDisplay(fallback),
    });
  }
}
