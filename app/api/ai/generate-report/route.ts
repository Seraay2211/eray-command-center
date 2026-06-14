import { NextResponse } from "next/server";
import { AI_GENERIC_ERROR, resolveAiProvider } from "@/lib/ai/config";
import {
  buildDemoReport,
  REPORT_TYPE_LABELS,
} from "@/lib/ai/report-prompts";
import { generateReportWithGemini } from "@/lib/ai/providers/report-gemini";
import { createClient } from "@/lib/supabase/server";
import type {
  AiReportRequest,
  AiReportResponse,
  AiReportSourceNote,
  AiReportSourceTask,
  ReportType,
} from "@/types";

export const runtime = "nodejs";

const reportTypes: ReportType[] = [
  "daily",
  "weekly",
  "operation",
  "manager",
  "finance",
  "custom",
];

function response(body: AiReportResponse, status = 200) {
  return NextResponse.json(body, { status });
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readIds(
  value: unknown,
): Array<{ id: string }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) =>
      typeof item === "object" && item && "id" in item
        ? { id: readString(item.id) }
        : { id: "" },
    )
    .filter((item) => item.id)
    .slice(0, 30);
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : AI_GENERIC_ERROR;
  const allowed = [
    "Gemini bağlantısı doğrulanamadı. API anahtarını kontrol et.",
    "AI servisi şu anda yoğun görünüyor. Lütfen biraz sonra tekrar dene.",
    "Oturum bulunamadı. Lütfen tekrar giriş yap.",
    "AI raporu oluşturmak için en az bir not, görev veya manuel metin eklemelisin.",
    "Seçilen notlardan biri bulunamadı veya sana ait değil.",
    "Seçilen görevlerden biri bulunamadı veya sana ait değil.",
  ];

  return allowed.includes(message)
    ? message
    : "Rapor oluşturulamadı. Lütfen tekrar dene.";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      return response(
        {
          success: false,
          error: "Oturum bulunamadı. Lütfen tekrar giriş yap.",
        },
        401,
      );
    }

    const payload = (await request.json()) as Partial<AiReportRequest>;
    const reportType = readString(payload.reportType) as ReportType;

    if (!reportTypes.includes(reportType)) {
      return response(
        { success: false, error: "Geçerli bir rapor tipi seçilmedi." },
        400,
      );
    }

    const manualText = readString(payload.manualText).slice(0, 12000);
    const requestedNotes = readIds(payload.notes);
    const requestedTasks = readIds(payload.tasks);

    if (!manualText && requestedNotes.length === 0 && requestedTasks.length === 0) {
      return response(
        {
          success: false,
          error:
            "AI raporu oluşturmak için en az bir not, görev veya manuel metin eklemelisin.",
        },
        400,
      );
    }

    const [notesResult, tasksResult] = await Promise.all([
      requestedNotes.length
        ? supabase
            .from("notes")
            .select("id,title,content")
            .eq("user_id", authData.user.id)
            .in(
              "id",
              requestedNotes.map((note) => note.id),
            )
        : Promise.resolve({ data: [], error: null }),
      requestedTasks.length
        ? supabase
            .from("tasks")
            .select("id,title,description,status,priority,due_date")
            .eq("user_id", authData.user.id)
            .in(
              "id",
              requestedTasks.map((task) => task.id),
            )
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (notesResult.error) throw notesResult.error;
    if (tasksResult.error) throw tasksResult.error;
    if ((notesResult.data ?? []).length !== requestedNotes.length) {
      return response(
        {
          success: false,
          error: "Seçilen notlardan biri bulunamadı veya sana ait değil.",
        },
        403,
      );
    }
    if ((tasksResult.data ?? []).length !== requestedTasks.length) {
      return response(
        {
          success: false,
          error: "Seçilen görevlerden biri bulunamadı veya sana ait değil.",
        },
        403,
      );
    }

    const input = {
      reportType,
      title: readString(payload.title),
      manualText,
      notes: (notesResult.data ?? []) as AiReportSourceNote[],
      tasks: (tasksResult.data ?? []) as AiReportSourceTask[],
      periodStart: readString(payload.periodStart) || null,
      periodEnd: readString(payload.periodEnd) || null,
    };
    const provider = resolveAiProvider();
    const generated =
      provider === "gemini"
        ? await generateReportWithGemini(input)
        : buildDemoReport(input);

    try {
      const { data: settings, error: settingsError } = await supabase
        .from("user_settings")
        .select("ai_save_history")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (settingsError || settings?.ai_save_history !== false) {
        await supabase.from("ai_actions").insert({
          action_type: `report:${reportType}`,
          input_text: `${requestedNotes.length} not, ${requestedTasks.length} görev, ${manualText.length} manuel karakter`,
          output_text: generated.content,
          user_id: authData.user.id,
        });
      }
    } catch {
      // AI history is optional; report generation must still complete.
    }

    return response({
      success: true,
      provider,
      title:
        generated.title ||
        input.title ||
        REPORT_TYPE_LABELS[reportType],
      summary: generated.summary,
      content: generated.content,
      reportType,
    });
  } catch (error) {
    return response({ success: false, error: safeError(error) }, 500);
  }
}
