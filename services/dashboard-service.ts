"use server";

import { createClient } from "@/lib/supabase/server";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import { formatTRY } from "@/lib/utils/currency";
import type {
  ActionResult,
  DashboardCommandStats,
  DashboardData,
  DashboardPinnedSummary,
  DashboardPriorityItem,
  DashboardRecentNote,
  DashboardReport,
  DashboardStats,
  DashboardTask,
  DebtPriority,
  DebtInstallmentStatus,
  DebtStatus,
  FinanceDashboardSummary,
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

interface RawDashboardTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
}

interface RawDashboardDebt {
  id: string;
  title: string;
  total_amount: number | string;
  paid_amount: number | string;
  currency: string;
  status: DebtStatus;
  priority: DebtPriority;
  due_date: string | null;
}

interface RawDashboardInstallment {
  id: string;
  debt_id: string;
  installment_no: number;
  due_date: string;
  expected_amount: number | string;
  paid_amount: number | string;
  status: DebtInstallmentStatus;
}

interface DashboardIntelligence {
  commandStats: DashboardCommandStats;
  financeSummary: FinanceDashboardSummary;
  openTasks: DashboardTask[];
  priorityItems: DashboardPriorityItem[];
  upcomingTasks: DashboardTask[];
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
      return "Takvim alanı şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
    }

    return "Çalışma alanı şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }

  if (message.toLowerCase().includes("jwt")) {
    return "Oturum doğrulanamadı. Lütfen yeniden giriş yapın.";
  }

  return "Dashboard verileri alınamadı. Birazdan tekrar deneyebilirsin.";
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

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
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
    return `Bugün, ${timeLabel}`;
  }

  if (date >= startOfYesterday && date < startOfToday) {
    return `Dün, ${timeLabel}`;
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
    return "Bu kayıtta henüz içerik bulunmuyor.";
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

function mapDashboardTask(task: RawDashboardTask): DashboardTask {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.due_date,
  };
}

function getDebtRemainingAmount(debt: RawDashboardDebt): number {
  return Math.max(
    (Number(debt.total_amount) || 0) - (Number(debt.paid_amount) || 0),
    0,
  );
}

async function getDashboardContext(): Promise<DashboardContext> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Oturum doğrulanamadı. Lütfen yeniden giriş yapın.");
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
    .is("archived_at", null)
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
      .eq("status", "active")
      .is("archived_at", null),
    getTodayNotesCount(userId, supabase),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("archived_at", null)
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
    .is("archived_at", null)
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
    .is("archived_at", null)
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
      .is("archived_at", null)
      .eq("is_pinned", true),
    supabase
      .from("notes")
      .select(recentNoteSelect)
      .eq("user_id", userId)
      .eq("status", "active")
      .is("archived_at", null)
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
      .is("archived_at", null)
      .gte("due_date", startIso)
      .lte("due_date", endIso),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("archived_at", null)
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

async function getDashboardIntelligence(
  userId: string,
  supabase: SupabaseServerClient,
): Promise<DashboardIntelligence> {
  const { startIso, endIso } = getTodayRange();
  const todayStart = new Date(startIso);
  const weekEndIso = addDays(todayStart, 7).toISOString();
  const todayKey = getIstanbulDateKey(todayStart);
  const weekEndKey = getIstanbulDateKey(addDays(todayStart, 7));
  const currentMonth = todayKey.slice(0, 7);

  const [
    taskRowsResult,
    debtRowsResult,
    latestPaymentResult,
    todayTasksResult,
    overdueTasksResult,
    upcomingTasksResult,
    todayCalendarResult,
    dueThisWeekDebtsResult,
    overdueDebtsResult,
    criticalDebtsResult,
    importantTasksResult,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id,title,status,priority,due_date,created_at")
      .eq("user_id", userId)
      .is("archived_at", null)
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("debts")
      .select(
        "id,title,total_amount,paid_amount,currency,status,priority,due_date",
      )
      .eq("user_id", userId)
      .neq("status", "paid")
      .neq("status", "cancelled")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(50),
    supabase
      .from("debt_payments")
      .select("amount,payment_date,method")
      .eq("user_id", userId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("archived_at", null)
      .neq("status", "done")
      .gte("due_date", startIso)
      .lt("due_date", endIso),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("archived_at", null)
      .neq("status", "done")
      .lt("due_date", startIso),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("archived_at", null)
      .neq("status", "done")
      .gte("due_date", endIso)
      .lt("due_date", weekEndIso),
    supabase
      .from("planner_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .gte("start_at", startIso)
      .lt("start_at", endIso),
    supabase
      .from("debts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "paid")
      .neq("status", "cancelled")
      .gte("due_date", todayKey)
      .lt("due_date", weekEndKey),
    supabase
      .from("debts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "paid")
      .neq("status", "cancelled")
      .lt("due_date", todayKey),
    supabase
      .from("debts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "paid")
      .neq("status", "cancelled")
      .eq("priority", "critical"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("archived_at", null)
      .neq("status", "done")
      .in("priority", ["high", "critical"]),
  ]);

  const results = [
    taskRowsResult,
    debtRowsResult,
    latestPaymentResult,
    todayTasksResult,
    overdueTasksResult,
    upcomingTasksResult,
    todayCalendarResult,
    dueThisWeekDebtsResult,
    overdueDebtsResult,
    criticalDebtsResult,
    importantTasksResult,
  ];
  const failedResult = results.find((result) => result.error);
  if (failedResult?.error) throw failedResult.error;

  const installmentResult = await supabase
    .from("debt_installments")
    .select(
      "id,debt_id,installment_no,due_date,expected_amount,paid_amount,status",
    )
    .eq("user_id", userId)
    .neq("status", "paid")
    .lte("due_date", weekEndKey)
    .order("due_date", { ascending: true })
    .limit(20);
  const installments = installmentResult.error
    ? []
    : ((installmentResult.data ?? []) as RawDashboardInstallment[]);

  const tasks = (taskRowsResult.data ?? []) as RawDashboardTask[];
  const debts = (debtRowsResult.data ?? []) as RawDashboardDebt[];
  const overdueCriticalTasks = tasks.filter(
    (task) =>
      task.due_date &&
      task.due_date < startIso &&
      task.priority === "critical",
  );
  const todayTasks = tasks.filter(
    (task) =>
      task.due_date &&
      task.due_date >= startIso &&
      task.due_date < endIso,
  );
  const overdueDebts = debts.filter(
    (debt) => debt.due_date && debt.due_date < todayKey,
  );
  const dueThisWeekDebts = debts.filter(
    (debt) =>
      debt.due_date &&
      debt.due_date >= todayKey &&
      debt.due_date < weekEndKey,
  );
  const upcomingTasks = tasks
    .filter(
      (task) =>
        task.due_date &&
        task.due_date >= endIso &&
        task.due_date < weekEndIso,
    )
    .slice(0, 5)
    .map(mapDashboardTask);
  const importantTasks = tasks.filter(
    (task) =>
      (task.priority === "high" || task.priority === "critical") &&
      !overdueCriticalTasks.some((item) => item.id === task.id) &&
      !todayTasks.some((item) => item.id === task.id),
  );
  const debtById = new Map(debts.map((debt) => [debt.id, debt]));
  const openInstallments = installments.filter(
    (item) => Number(item.paid_amount) < Number(item.expected_amount),
  );
  const overdueInstallments = openInstallments.filter(
    (item) => item.due_date < todayKey,
  );
  const todayInstallments = openInstallments.filter(
    (item) => item.due_date === todayKey,
  );
  const upcomingInstallments = openInstallments.filter(
    (item) => item.due_date > todayKey && item.due_date < weekEndKey,
  );

  const priorityItems: DashboardPriorityItem[] = [
    ...overdueCriticalTasks.map((task) => ({
      id: `task-overdue-${task.id}`,
      source: "task" as const,
      title: task.title,
      description: "Kritik görevin son tarihi geçti.",
      href: `/tasks?task=${encodeURIComponent(task.id)}`,
      priority: task.priority,
      dueDate: task.due_date,
    })),
    ...todayTasks.map((task) => ({
      id: `task-today-${task.id}`,
      source: "task" as const,
      title: task.title,
      description: "Görevin son tarihi bugün.",
      href: `/tasks?task=${encodeURIComponent(task.id)}`,
      priority: task.priority,
      dueDate: task.due_date,
    })),
    ...overdueInstallments.map((installment) => {
      const debt = debtById.get(installment.debt_id);
      return {
        id: `installment-overdue-${installment.id}`,
        source: "finance" as const,
        title: debt?.title ?? "Taksit ödemesi",
        description: `${installment.installment_no}. taksit gecikti. Beklenen ${formatTRY(
          Math.max(
            Number(installment.expected_amount) -
              Number(installment.paid_amount),
            0,
          ),
        )}.`,
        href: `/finance?debt=${encodeURIComponent(
          installment.debt_id,
        )}&installment=${encodeURIComponent(installment.id)}`,
        priority: debt?.priority ?? ("high" as const),
        dueDate: installment.due_date,
      };
    }),
    ...todayInstallments.map((installment) => {
      const debt = debtById.get(installment.debt_id);
      return {
        id: `installment-today-${installment.id}`,
        source: "finance" as const,
        title: debt?.title ?? "Taksit ödemesi",
        description: `${installment.installment_no}. taksit bugün ödenecek. Beklenen ${formatTRY(
          Math.max(
            Number(installment.expected_amount) -
              Number(installment.paid_amount),
            0,
          ),
        )}.`,
        href: `/finance?debt=${encodeURIComponent(
          installment.debt_id,
        )}&installment=${encodeURIComponent(installment.id)}`,
        priority: debt?.priority ?? ("high" as const),
        dueDate: installment.due_date,
      };
    }),
    ...overdueDebts.map((debt) => ({
      id: `debt-overdue-${debt.id}`,
      source: "finance" as const,
      title: debt.title,
      description: `Vadesi geçti. Kalan ${formatTRY(getDebtRemainingAmount(debt))}.`,
      href: `/finance?debt=${encodeURIComponent(debt.id)}`,
      priority: debt.priority,
      dueDate: debt.due_date,
    })),
    ...dueThisWeekDebts.map((debt) => ({
      id: `debt-week-${debt.id}`,
      source: "finance" as const,
      title: debt.title,
      description: `Bu hafta ödenecek. Kalan ${formatTRY(getDebtRemainingAmount(debt))}.`,
      href: `/finance?debt=${encodeURIComponent(debt.id)}`,
      priority: debt.priority,
      dueDate: debt.due_date,
    })),
    ...importantTasks.map((task) => ({
      id: `task-important-${task.id}`,
      source: "task" as const,
      title: task.title,
      description: "Tamamlanmamış önemli iş.",
      href: `/tasks?task=${encodeURIComponent(task.id)}`,
      priority: task.priority,
      dueDate: task.due_date,
    })),
  ].slice(0, 8);

  const activeRemainingDebt = debts.reduce(
    (sum, debt) => sum + getDebtRemainingAmount(debt),
    0,
  );
  const installmentDebtIds = new Set(
    installments.map((installment) => installment.debt_id),
  );
  const dueThisMonth =
    debts
      .filter(
        (debt) =>
          !installmentDebtIds.has(debt.id) &&
          debt.due_date?.startsWith(currentMonth),
      )
      .reduce((sum, debt) => sum + getDebtRemainingAmount(debt), 0) +
    openInstallments
      .filter((installment) =>
        installment.due_date.startsWith(currentMonth),
      )
      .reduce(
        (sum, installment) =>
          sum +
          Math.max(
            Number(installment.expected_amount) -
              Number(installment.paid_amount),
            0,
          ),
        0,
      );
  const latestPayment = latestPaymentResult.data;

  return {
    commandStats: {
      todayTasks: todayTasksResult.count ?? 0,
      overdueTasks: overdueTasksResult.count ?? 0,
      upcomingTasks: upcomingTasksResult.count ?? 0,
      todayCalendar: todayCalendarResult.count ?? 0,
      dueThisWeekDebts: dueThisWeekDebtsResult.count ?? 0,
      overdueDebts: overdueDebtsResult.count ?? 0,
      criticalDebts: criticalDebtsResult.count ?? 0,
      importantOpenTasks: importantTasksResult.count ?? 0,
    },
    financeSummary: {
      available: true,
      remainingDebt: activeRemainingDebt,
      dueThisMonth,
      dueThisWeekCount: dueThisWeekDebtsResult.count ?? 0,
      criticalCount: criticalDebtsResult.count ?? 0,
      overdueCount: overdueDebtsResult.count ?? 0,
      installmentsAvailable: !installmentResult.error,
      dueTodayInstallmentCount: todayInstallments.length,
      overdueInstallmentCount: overdueInstallments.length,
      upcomingInstallments: [
        ...overdueInstallments,
        ...todayInstallments,
        ...upcomingInstallments,
      ]
        .slice(0, 5)
        .map((installment) => {
          const debt = debtById.get(installment.debt_id);
          return {
            id: installment.id,
            debtId: installment.debt_id,
            debtTitle: debt?.title ?? "Borç kaydı",
            creditor: "",
            installmentNo: installment.installment_no,
            dueDate: installment.due_date,
            expectedAmount: Number(installment.expected_amount) || 0,
            paidAmount: Number(installment.paid_amount) || 0,
            status:
              Number(installment.paid_amount) > 0
                ? ("partial" as const)
                : installment.due_date < todayKey
                  ? ("overdue" as const)
                  : ("pending" as const),
          };
        }),
      lastPayment: latestPayment
        ? {
            amount: Number(latestPayment.amount) || 0,
            date: latestPayment.payment_date,
            method: latestPayment.method,
          }
        : null,
      upcomingDebts: dueThisWeekDebts.slice(0, 3).map((debt) => ({
        id: debt.id,
        title: debt.title,
        remainingAmount: getDebtRemainingAmount(debt),
        currency: debt.currency,
        dueDate: debt.due_date,
      })),
    },
    openTasks: tasks.slice(0, 4).map(mapDashboardTask),
    priorityItems,
    upcomingTasks,
  };
}

export async function getDashboardData(): Promise<ActionResult<DashboardData>> {
  try {
    const { supabase, userId } = await getDashboardContext();
    const [
      stats,
      recentNotes,
      pinnedSummary,
      recentReports,
      todayPlannerEvents,
      plannerStats,
      todayTodoStats,
      intelligence,
    ] = await Promise.all([
      getDashboardStats(userId, supabase),
      getRecentNotes(userId, supabase),
      getPinnedNotesSummary(userId, supabase),
      getRecentReports(userId, supabase),
      getTodayPlannerEvents(userId, supabase),
      getPlannerStats(userId, supabase),
      getTodayTodoStats(userId, supabase),
      getDashboardIntelligence(userId, supabase),
    ]);
    const calendarPriorities: DashboardPriorityItem[] = todayPlannerEvents
      .filter((event) => event.status !== "done" && event.status !== "cancelled")
      .map((event) => ({
        id: `calendar-${event.id}`,
        source: "calendar",
        title: event.title,
        description: event.all_day
          ? "Bugün için tüm gün planlandı."
          : `${new Intl.DateTimeFormat("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Istanbul",
            }).format(new Date(event.start_at))} saatinde takvim kaydı var.`,
        href: `/calendar?event=${encodeURIComponent(event.id)}`,
        priority: event.priority,
        dueDate: event.start_at,
      }));

    return {
      data: {
        stats,
        commandStats: intelligence.commandStats,
        priorities: [...intelligence.priorityItems, ...calendarPriorities]
          .sort((left, right) => {
            const getRank = (item: DashboardPriorityItem) => {
              if (item.id.startsWith("task-overdue-")) return 1;
              if (item.id.startsWith("task-today-")) return 2;
              if (item.id.startsWith("installment-overdue-")) return 3;
              if (item.id.startsWith("installment-today-")) return 4;
              if (item.id.startsWith("debt-overdue-")) return 5;
              if (item.id.startsWith("debt-week-")) return 6;
              if (item.id.startsWith("calendar-")) return 7;
              return 8;
            };

            return getRank(left) - getRank(right);
          })
          .slice(0, 8),
        recentNotes,
        pinnedSummary,
        openTasks: intelligence.openTasks,
        upcomingTasks: intelligence.upcomingTasks,
        recentReports,
        todayPlannerEvents,
        plannerStats,
        todayTodoStats,
        financeSummary: intelligence.financeSummary,
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
