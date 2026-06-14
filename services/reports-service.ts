"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionResult,
  CreateReportInput,
  Report,
  ReportSource,
  ReportSourceWithLabel,
  ReportsStats,
  ReportStatus,
  ReportType,
  ReportWithSources,
  UpdateReportInput,
} from "@/types";

const reportTypes: ReportType[] = [
  "daily",
  "weekly",
  "operation",
  "manager",
  "finance",
  "custom",
];

const reportStatuses: ReportStatus[] = ["draft", "final", "archived"];

interface GetReportsOptions {
  limit?: number;
  offset?: number;
}

function getErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error);

  if (
    message.includes("PGRST205") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table")
  ) {
    return "Rapor veritabanı henüz hazır değil. database/phase-7-reports.sql dosyasını Supabase SQL Editor içinde çalıştırın.";
  }

  if (message.toLowerCase().includes("jwt")) {
    return "Oturum bulunamadı. Lütfen tekrar giriş yap.";
  }

  return message || "Rapor işlemi tamamlanamadı.";
}

function normalizeDate(value?: string | null): string | null {
  if (!value) return null;

  const normalized = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error("Rapor tarihi geçerli bir tarih olmalıdır.");
  }

  return normalized;
}

function validateInput(
  input: CreateReportInput | UpdateReportInput,
  requireFields: boolean,
): UpdateReportInput {
  const values: UpdateReportInput = {};

  if (requireFields || input.title !== undefined) {
    const title = input.title?.trim() ?? "";

    if (!title) throw new Error("Rapor başlığı zorunludur.");
    if (title.length > 200) {
      throw new Error("Rapor başlığı en fazla 200 karakter olabilir.");
    }

    values.title = title;
  }

  if (requireFields || input.content !== undefined) {
    const content = input.content?.trim() ?? "";

    if (!content) throw new Error("Rapor içeriği boş olamaz.");
    values.content = content;
  }

  if (requireFields || input.report_type !== undefined) {
    const reportType = input.report_type ?? "custom";

    if (!reportTypes.includes(reportType)) {
      throw new Error("Geçersiz rapor tipi.");
    }

    values.report_type = reportType;
  }

  if (input.status !== undefined) {
    if (!reportStatuses.includes(input.status)) {
      throw new Error("Geçersiz rapor durumu.");
    }
    values.status = input.status;
  }

  if (input.source_date !== undefined) {
    values.source_date = normalizeDate(input.source_date);
  }
  if (input.period_start !== undefined) {
    values.period_start = normalizeDate(input.period_start);
  }
  if (input.period_end !== undefined) {
    values.period_end = normalizeDate(input.period_end);
  }
  if (
    values.period_start &&
    values.period_end &&
    values.period_start > values.period_end
  ) {
    throw new Error("Dönem başlangıcı, dönem bitişinden sonra olamaz.");
  }

  if (input.summary !== undefined) {
    values.summary = input.summary?.trim() || null;
  }
  if (input.ai_generated !== undefined) {
    values.ai_generated = Boolean(input.ai_generated);
  }
  if (input.sources !== undefined) {
    values.sources = Array.from(
      new Map(
        input.sources
          .filter(
            (source) =>
              (source.source_type === "note" ||
                source.source_type === "task") &&
              source.source_id,
          )
          .map((source) => [
            `${source.source_type}:${source.source_id}`,
            source,
          ]),
      ).values(),
    );
  }

  return values;
}

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");
  }

  return { supabase, userId: data.user.id };
}

function revalidateReportViews() {
  revalidatePath("/reports");
  revalidatePath("/dashboard");
}

async function attachSources(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  reports: Report[],
): Promise<ReportWithSources[]> {
  if (reports.length === 0) return [];

  const reportIds = reports.map((report) => report.id);
  const { data, error } = await supabase
    .from("report_sources")
    .select("*")
    .eq("user_id", userId)
    .in("report_id", reportIds);

  if (error) throw error;

  const sources = (data ?? []) as ReportSource[];
  const noteIds = sources
    .filter((source) => source.source_type === "note")
    .map((source) => source.source_id);
  const taskIds = sources
    .filter((source) => source.source_type === "task")
    .map((source) => source.source_id);
  const [notesResult, tasksResult] = await Promise.all([
    noteIds.length
      ? supabase
          .from("notes")
          .select("id,title")
          .eq("user_id", userId)
          .in("id", noteIds)
      : Promise.resolve({ data: [], error: null }),
    taskIds.length
      ? supabase
          .from("tasks")
          .select("id,title")
          .eq("user_id", userId)
          .in("id", taskIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (notesResult.error) throw notesResult.error;
  if (tasksResult.error) throw tasksResult.error;

  const labels = new Map<string, string>();
  (notesResult.data ?? []).forEach((note) =>
    labels.set(`note:${note.id}`, note.title),
  );
  (tasksResult.data ?? []).forEach((task) =>
    labels.set(`task:${task.id}`, task.title),
  );
  const sourcesByReport = new Map<string, ReportSourceWithLabel[]>();

  sources.forEach((source) => {
    const current = sourcesByReport.get(source.report_id) ?? [];
    current.push({
      ...source,
      label:
        labels.get(`${source.source_type}:${source.source_id}`) ??
        "Kaynak artık mevcut değil",
    });
    sourcesByReport.set(source.report_id, current);
  });

  return reports.map((report) => ({
    ...report,
    sources: sourcesByReport.get(report.id) ?? [],
  }));
}

async function fetchReportById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  reportId: string,
): Promise<ReportWithSources> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Bu rapor üzerinde işlem yapma yetkin yok.");

  const [report] = await attachSources(supabase, userId, [data as Report]);
  return report;
}

async function replaceReportSources(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  reportId: string,
  sources: NonNullable<CreateReportInput["sources"]>,
) {
  const { error: deleteError } = await supabase
    .from("report_sources")
    .delete()
    .eq("report_id", reportId)
    .eq("user_id", userId);

  if (deleteError) throw deleteError;
  if (sources.length === 0) return;

  const { error } = await supabase.from("report_sources").insert(
    sources.map((source) => ({
      user_id: userId,
      report_id: reportId,
      source_type: source.source_type,
      source_id: source.source_id,
    })),
  );

  if (error) throw error;
}

export async function getReports(
  options: GetReportsOptions = {},
): Promise<
  ActionResult<ReportWithSources[]>
> {
  try {
    const limit = Math.min(Math.max(options.limit ?? 100, 1), 100);
    const offset = Math.max(options.offset ?? 0, 0);
    const { supabase, userId } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: await attachSources(supabase, userId, (data ?? []) as Report[]),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getReportById(
  reportId: string,
): Promise<ActionResult<ReportWithSources>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    return {
      data: await fetchReportById(supabase, userId, reportId),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getReportSources(
  reportId: string,
): Promise<ActionResult<ReportSourceWithLabel[]>> {
  const result = await getReportById(reportId);

  return {
    data: result.data?.sources ?? null,
    error: result.error,
  };
}

export async function createReportSources(
  reportId: string,
  sources: NonNullable<CreateReportInput["sources"]>,
): Promise<ActionResult<ReportSourceWithLabel[]>> {
  try {
    const validatedSources =
      validateInput({ sources }, false).sources ?? [];
    const { supabase, userId } = await getAuthenticatedContext();

    await fetchReportById(supabase, userId, reportId);
    await replaceReportSources(
      supabase,
      userId,
      reportId,
      validatedSources,
    );

    const report = await fetchReportById(supabase, userId, reportId);
    revalidateReportViews();
    return { data: report.sources, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createReport(
  input: CreateReportInput,
): Promise<ActionResult<ReportWithSources>> {
  try {
    const values = validateInput(input, true);
    const sources = values.sources ?? [];
    const { supabase, userId } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        title: values.title,
        content: values.content,
        report_type: values.report_type,
        status: values.status ?? "draft",
        source_date: values.source_date ?? null,
        period_start: values.period_start ?? null,
        period_end: values.period_end ?? null,
        summary: values.summary ?? null,
        ai_generated: values.ai_generated ?? false,
      })
      .select("id")
      .single();

    if (error) throw error;

    try {
      await replaceReportSources(supabase, userId, data.id, sources);
    } catch (sourceError) {
      await supabase
        .from("reports")
        .delete()
        .eq("id", data.id)
        .eq("user_id", userId);
      throw sourceError;
    }

    const report = await fetchReportById(supabase, userId, data.id);
    revalidateReportViews();
    return { data: report, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateReport(
  reportId: string,
  input: UpdateReportInput,
): Promise<ActionResult<ReportWithSources>> {
  try {
    const values = validateInput(input, false);
    const sources = values.sources;
    delete values.sources;
    const { supabase, userId } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("reports")
      .update(values)
      .eq("id", reportId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Bu rapor üzerinde işlem yapma yetkin yok.");

    if (sources !== undefined) {
      await replaceReportSources(supabase, userId, reportId, sources);
    }

    const report = await fetchReportById(supabase, userId, reportId);
    revalidateReportViews();
    return { data: report, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteReport(
  reportId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("reports")
      .delete()
      .eq("id", reportId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Bu rapor üzerinde işlem yapma yetkin yok.");

    revalidateReportViews();
    return { data: { id: reportId }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function archiveReport(
  reportId: string,
): Promise<ActionResult<ReportWithSources>> {
  return updateReport(reportId, { status: "archived" });
}

export async function getRecentReports(
  limit = 3,
): Promise<ActionResult<ReportWithSources[]>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 10));

    if (error) throw error;

    return {
      data: await attachSources(supabase, userId, (data ?? []) as Report[]),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getReportsStats(): Promise<
  ActionResult<ReportsStats>
> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const [totalResult, aiResult, archivedResult] = await Promise.all([
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("ai_generated", true),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "archived"),
    ]);

    if (totalResult.error) throw totalResult.error;
    if (aiResult.error) throw aiResult.error;
    if (archivedResult.error) throw archivedResult.error;

    return {
      data: {
        total: totalResult.count ?? 0,
        aiGenerated: aiResult.count ?? 0,
        archived: archivedResult.count ?? 0,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
