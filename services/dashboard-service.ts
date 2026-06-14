"use server";

import { createClient } from "@/lib/supabase/server";
import { getDashboardFinanceSummary } from "@/services/finance-service";
import type {
  ActionResult,
  DashboardData,
  DashboardPinnedSummary,
  DashboardRecentNote,
  DashboardReport,
  DashboardStats,
  DashboardTask,
  PlannerEventWithLinks,
  PlannerStats,
  TaskPriority,
  TaskStatus,
  Tag,
  TodayTodoStats,
} from "@/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface DashboardContext {
  supabase: SupabaseServerClient;
  userId: string;
}

interface RawDashboardNote {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  category:
    | {
        name: string;
        color: string;
      }
    | Array<{
        name: string;
        color: string;
      }>
    | null;
  note_tags: Array<{ tag: Tag | Tag[] | null }> | null;
}

interface RawPlannerDashboardEvent {
  id: string;
  user_id: string;
  task_id: string | null;
  note_id: string | null;
  title: string;
  description: string;
  event_type: PlannerEventWithLinks["event_type"];
  status: PlannerEventWithLinks["status"];
  priority: PlannerEventWithLinks["priority"];
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
  task:
    | {
        id: string;
        title: string;
        status: TaskStatus;
        priority: TaskPriority;
      }
    | Array<{
        id: string;
        title: string;
        status: TaskStatus;
        priority: TaskPriority;
      }>
    | null;
  note:
    | {
        id: string;
        title: string;
      }
    | Array<{
        id: string;
        title: string;
      }>
    | null;
}

const recentNoteSelect = `
  id,
  title,
  content,
  is_pinned,
  created_at,
  updated_at,
  category:categories (
    name,
    color
  ),
  note_tags (
    tag:tags (
      id,
      name,
      color
    )
  )
`;

const plannerEventSelect = `
  id,
  user_id,
  task_id,
  note_id,
  title,
  description,
  event_type,
  status,
  priority,
  start_at,
  end_at,
  all_day,
  color,
  created_at,
  updated_at,
  task:tasks (
    id,
    title,
    status,
    priority
  ),
  note:notes (
    id,
    title
  )
`;

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
    if (message.includes("planner_events")) {
      return "Takvim veritabani henuz hazır degil. database/phase-9-calendar.sql dosyasini Supabase SQL Editor icinde calistirin.";
    }

    return "Veritabani semasi henuz hazır degil. database/schema.sql dosyasinin tamamini Supabase SQL Editor icinde calistirin.";
  }

  if (message.toLowerCase().includes("jwt")) {
    return "Oturum dogrulanamadi. Lütfen yeniden giris yapin.";
  }

  return message || "Dashboard verileri alinamadi.";
}

function getTurkeyDateParts(value: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(value);

  return {
    day: parts.find((part) => part.type === "day")?.value ?? "01",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    year: parts.find((part) => part.type === "year")?.value ?? "1970",
  };
}

function getTodayRange() {
  const now = new Date();
  const { day, month, year } = getTurkeyDateParts(now);
  const start = new Date(`${year}-${month}-${day}T00:00:00+03:00`);
  const end = new Date(`${year}-${month}-${day}T23:59:59.999+03:00`);

  return {
    endIso: end.toISOString(),
    startIso: start.toISOString(),
  };
}

function formatDashboardDate(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(getTodayRange().startIso);
  const startOfYesterday = new Date(startOfToday.getTime() - oneDay);
  const timeLabel = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(date);

  if (date >= startOfToday) {
    return `Bugun, ${timeLabel}`;
  }

  if (date >= startOfYesterday && date < startOfToday) {
    return `Dun, ${timeLabel}`;
  }

  const { day, month } = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Istanbul",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((result, part) => {
      if (part.type !== "literal") {
        result[part.type] = part.value;
      }

      return result;
    }, {});

  const currentYear = getTurkeyDateParts(now).year;
  const noteYear = getTurkeyDateParts(date).year;

  if (noteYear === currentYear) {
    return `${day} ${month}`;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function buildPreview(content: string, maxLength = 120): string {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Bu kayıtta henuz içerik bulunmuyor.";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function mapDashboardNote(note: RawDashboardNote): DashboardRecentNote {
  const category = Array.isArray(note.category)
    ? (note.category[0] ?? null)
    : note.category;
  const tags =
    note.note_tags?.flatMap(({ tag }) =>
      Array.isArray(tag) ? tag : tag ? [tag] : [],
    ) ?? [];
  const displayDate =
    note.updated_at !== note.created_at ? note.updated_at : note.created_at;

  return {
    id: note.id,
    title: note.title,
    preview: buildPreview(note.content),
    date: formatDashboardDate(displayDate),
    isPinned: note.is_pinned,
    category,
    tags: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
  };
}

function mapDashboardPlannerEvent(
  event: RawPlannerDashboardEvent,
): PlannerEventWithLinks {
  return {
    id: event.id,
    user_id: event.user_id,
    task_id: event.task_id,
    note_id: event.note_id,
    title: event.title,
    description: event.description,
    event_type: event.event_type,
    status: event.status,
    priority: event.priority,
    start_at: event.start_at,
    end_at: event.end_at,
    all_day: event.all_day,
    color: event.color,
    created_at: event.created_at,
    updated_at: event.updated_at,
    task: Array.isArray(event.task) ? (event.task[0] ?? null) : event.task,
    note: Array.isArray(event.note) ? (event.note[0] ?? null) : event.note,
  };
}

async function getDashboardContext(): Promise<DashboardContext> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Oturum dogrulanamadi. Lütfen yeniden giris yapin.");
  }

  return {
    supabase,
    userId: data.user.id,
  };
}

export async function getTodayNotesCount(
  userId: string,
  supabase: SupabaseServerClient,
): Promise<number> {
  const { startIso, endIso } = getTodayRange();
  const { count, error } = await supabase
    .from("notes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active")
    .gte("created_at", startIso)
    .lte("created_at", endIso);

  if (error) throw error;

  return count ?? 0;
}

export async function getDashboardStats(
  userId: string,
  supabase: SupabaseServerClient,
): Promise<DashboardStats> {
  const [
    totalResult,
    todayNotes,
    openTasksResult,
    reportsResult,
    aiReportsResult,
  ] = await Promise.all([
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active"),
    getTodayNotesCount(userId, supabase),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "done"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("ai_generated", true),
  ]);

  if (totalResult.error) throw totalResult.error;
  if (openTasksResult.error) throw openTasksResult.error;
  if (reportsResult.error) throw reportsResult.error;
  if (aiReportsResult.error) throw aiReportsResult.error;

  return {
    totalNotes: totalResult.count ?? 0,
    todayNotes,
    openTasks: openTasksResult.count ?? 0,
    totalReports: reportsResult.count ?? 0,
    aiReports: aiReportsResult.count ?? 0,
  };
}

export async function getPlannerStats(
  userId: string,
  supabase: SupabaseServerClient,
): Promise<PlannerStats> {
  const { startIso, endIso } = getTodayRange();
  const upcomingStart = new Date();
  upcomingStart.setMinutes(0, 0, 0);

  const [totalResult, todayResult, completedResult, upcomingResult] =
    await Promise.all([
      supabase
        .from("planner_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("planner_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("start_at", startIso)
        .lte("start_at", endIso),
      supabase
        .from("planner_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "done"),
      supabase
        .from("planner_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("start_at", upcomingStart.toISOString())
        .neq("status", "done")
        .neq("status", "cancelled"),
    ]);

  if (totalResult.error) throw totalResult.error;
  if (todayResult.error) throw todayResult.error;
  if (completedResult.error) throw completedResult.error;
  if (upcomingResult.error) throw upcomingResult.error;

  return {
    total: totalResult.count ?? 0,
    today: todayResult.count ?? 0,
    completed: completedResult.count ?? 0,
    upcoming: upcomingResult.count ?? 0,
  };
}

export async function getRecentReports(
  userId: string,
  supabase: SupabaseServerClient,
): Promise<DashboardReport[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("id,title,report_type,ai_generated,updated_at")
    .eq("user_id", userId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(3);

  if (error) throw error;

  return (data ?? []).map((report) => ({
    id: report.id,
    title: report.title,
    reportType: report.report_type,
    aiGenerated: report.ai_generated,
    date: formatDashboardDate(report.updated_at),
  })) as DashboardReport[];
}

export async function getOpenTasks(
  userId: string,
  supabase: SupabaseServerClient,
): Promise<DashboardTask[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id,title,status,priority,due_date,created_at")
    .eq("user_id", userId)
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) throw error;

  return (data ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.due_date,
  })) as DashboardTask[];
}

export async function getRecentNotes(
  userId: string,
  supabase: SupabaseServerClient,
): Promise<DashboardRecentNote[]> {
  const { data, error } = await supabase
    .from("notes")
    .select(recentNoteSelect)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(4);

  if (error) throw error;

  return ((data ?? []) as RawDashboardNote[]).map(mapDashboardNote);
}

async function getPinnedNotesSummary(
  userId: string,
  supabase: SupabaseServerClient,
): Promise<DashboardPinnedSummary> {
  const [countResult, latestResult] = await Promise.all([
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active")
      .eq("is_pinned", true),
    supabase
      .from("notes")
      .select(recentNoteSelect)
      .eq("user_id", userId)
      .eq("status", "active")
      .eq("is_pinned", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (countResult.error) throw countResult.error;
  if (latestResult.error) throw latestResult.error;

  return {
    count: countResult.count ?? 0,
    latestNote: latestResult.data
      ? mapDashboardNote(latestResult.data as RawDashboardNote)
      : null,
  };
}

export async function getTodayPlannerEvents(
  userId: string,
  supabase: SupabaseServerClient,
): Promise<PlannerEventWithLinks[]> {
  const { startIso, endIso } = getTodayRange();
  const { data, error } = await supabase
    .from("planner_events")
    .select(plannerEventSelect)
    .eq("user_id", userId)
    .gte("start_at", startIso)
    .lte("start_at", endIso)
    .order("start_at", { ascending: true })
    .limit(5);

  if (error) throw error;

  return ((data ?? []) as RawPlannerDashboardEvent[]).map(
    mapDashboardPlannerEvent,
  );
}

export async function getTodayTodoStats(
  userId: string,
  supabase: SupabaseServerClient,
): Promise<TodayTodoStats> {
  const { startIso, endIso } = getTodayRange();
  const [totalResult, pendingResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("due_date", startIso)
      .lte("due_date", endIso),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("due_date", startIso)
      .lte("due_date", endIso)
      .neq("status", "done"),
  ]);

  if (totalResult.error) throw totalResult.error;
  if (pendingResult.error) throw pendingResult.error;

  return {
    available: true,
    pending: pendingResult.count ?? 0,
    total: totalResult.count ?? 0,
  };
}

export async function getDashboardData(): Promise<ActionResult<DashboardData>> {
  try {
    const { supabase, userId } = await getDashboardContext();
    const [
      stats,
      recentNotes,
      pinnedSummary,
      openTasks,
      recentReports,
      todayPlannerEvents,
      plannerStats,
      todayTodoStats,
      financeSummary,
    ] = await Promise.all([
      getDashboardStats(userId, supabase),
      getRecentNotes(userId, supabase),
      getPinnedNotesSummary(userId, supabase),
      getOpenTasks(userId, supabase),
      getRecentReports(userId, supabase),
      getTodayPlannerEvents(userId, supabase),
      getPlannerStats(userId, supabase),
      getTodayTodoStats(userId, supabase),
      getDashboardFinanceSummary(),
    ]);

    return {
      data: {
        stats,
        recentNotes,
        pinnedSummary,
        openTasks,
        recentReports,
        todayPlannerEvents,
        plannerStats,
        todayTodoStats,
        financeSummary,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}
