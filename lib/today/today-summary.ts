import "server-only";

import { getIstanbulDateKey, getIstanbulDayRange } from "@/lib/dates/istanbul";
import { createClient } from "@/lib/supabase/server";
import { formatTRY } from "@/lib/utils/currency";
import type { ActionResult, TaskPriority, TaskStatus } from "@/types";
import type {
  AppNotification,
  NotificationPriority,
  NotificationType,
} from "@/types/notifications";
import type {
  TodayCalendarItem,
  TodayFinanceItem,
  TodayPriorityItem,
  TodaySummary,
  TodayTaskItem,
} from "@/types/today";

const activeTaskStatuses: TaskStatus[] = ["todo", "in_progress", "waiting"];
const taskPriorities: TaskPriority[] = ["low", "medium", "high", "critical"];
const notificationPriorities: NotificationPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];
const notificationTypes: NotificationType[] = [
  "finance_due_today",
  "finance_overdue",
  "finance_critical",
  "finance_payment_added",
  "finance_payment_deleted",
  "finance_debt_paid",
  "task_due",
  "calendar_today",
  "ai_summary",
  "system",
];

function getPriority(value: unknown): TaskPriority {
  return taskPriorities.includes(value as TaskPriority)
    ? (value as TaskPriority)
    : "medium";
}

function getStatus(value: unknown): TaskStatus {
  return activeTaskStatuses.includes(value as TaskStatus)
    ? (value as TaskStatus)
    : "todo";
}

function toDateKey(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : getIstanbulDateKey(date);
}

function mapNotification(raw: Record<string, unknown>): AppNotification {
  return {
    id: String(raw.id),
    user_id: String(raw.user_id),
    type: notificationTypes.includes(raw.type as NotificationType)
      ? (raw.type as NotificationType)
      : "system",
    title: typeof raw.title === "string" ? raw.title : "Bildirim",
    message: typeof raw.message === "string" ? raw.message : "",
    source: typeof raw.source === "string" ? raw.source : null,
    source_id: typeof raw.source_id === "string" ? raw.source_id : null,
    priority: notificationPriorities.includes(
      raw.priority as NotificationPriority,
    )
      ? (raw.priority as NotificationPriority)
      : "medium",
    action_url:
      typeof raw.action_url === "string" ? raw.action_url : null,
    is_read: raw.is_read === true,
    read_at: typeof raw.read_at === "string" ? raw.read_at : null,
    metadata:
      raw.metadata && typeof raw.metadata === "object"
        ? (raw.metadata as Record<string, unknown>)
        : null,
    created_at:
      typeof raw.created_at === "string"
        ? raw.created_at
        : new Date().toISOString(),
  };
}

function formatDateLabel(value: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
    weekday: "long",
    year: "numeric",
  }).format(value);
}

export function getDailyOperationTitle(dateKey = getIstanbulDateKey()): string {
  return `Günlük Operasyon - ${dateKey}`;
}

export async function getTodaySummary(): Promise<ActionResult<TodaySummary>> {
  try {
    const now = new Date();
    const dateKey = getIstanbulDateKey(now);
    const { startIso, endIso } = getIstanbulDayRange(now);
    const nextDateKey = getIstanbulDateKey(new Date(endIso));
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return { data: null, error: "Oturum doğrulanamadı." };
    }

    const userId = authData.user.id;
    const dailyTitle = getDailyOperationTitle(dateKey);
    const [debtsResult, tasksResult, calendarResult, notificationsResult, noteResult] =
      await Promise.all([
        supabase
          .from("debts")
          .select("id,title,creditor,total_amount,paid_amount,status,priority,due_date")
          .eq("user_id", userId)
          .not("due_date", "is", null)
          .neq("status", "paid")
          .neq("status", "cancelled")
          .lt("due_date", nextDateKey)
          .order("due_date", { ascending: true })
          .limit(50),
        supabase
          .from("tasks")
          .select("id,title,description,status,priority,due_date")
          .eq("user_id", userId)
          .neq("status", "done")
          .not("due_date", "is", null)
          .lt("due_date", endIso)
          .order("due_date", { ascending: true })
          .limit(50),
        supabase
          .from("planner_events")
          .select("id,title,description,start_at,all_day,priority,status")
          .eq("user_id", userId)
          .gte("start_at", startIso)
          .lt("start_at", endIso)
          .neq("status", "cancelled")
          .order("start_at", { ascending: true })
          .limit(20),
        supabase
          .from("notifications")
          .select(
            "id,user_id,type,title,message,source,source_id,priority,action_url,is_read,read_at,metadata,created_at",
          )
          .eq("user_id", userId)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("notes")
          .select("id,title")
          .eq("user_id", userId)
          .eq("status", "active")
          .eq("title", dailyTitle)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const moduleErrors: string[] = [];
    if (debtsResult.error) moduleErrors.push("Finans verileri alınamadı.");
    if (tasksResult.error) moduleErrors.push("Görev verileri alınamadı.");
    if (calendarResult.error) moduleErrors.push("Takvim verileri alınamadı.");
    if (notificationsResult.error) moduleErrors.push("Bildirimler alınamadı.");
    if (noteResult.error) moduleErrors.push("Günlük not kontrol edilemedi.");

    const financeItems = (debtsResult.data ?? []).map((raw) => {
      const totalAmount = Number(raw.total_amount) || 0;
      const paidAmount = Number(raw.paid_amount) || 0;
      return {
        id: String(raw.id),
        title: String(raw.title || "Borç"),
        creditor: typeof raw.creditor === "string" ? raw.creditor : null,
        remainingAmount: Math.max(totalAmount - paidAmount, 0),
        dueDate: String(raw.due_date),
        priority: getPriority(raw.priority),
        href: `/finance?debt=${String(raw.id)}`,
      } satisfies TodayFinanceItem;
    });
    const financeOverdue = financeItems.filter(
      (item) => toDateKey(item.dueDate) < dateKey,
    );
    const financeDueToday = financeItems.filter(
      (item) => toDateKey(item.dueDate) === dateKey,
    );

    const taskItems = (tasksResult.data ?? []).map((raw) => ({
      id: String(raw.id),
      title: String(raw.title || "Görev"),
      description:
        typeof raw.description === "string" ? raw.description : "",
      dueDate: String(raw.due_date),
      priority: getPriority(raw.priority),
      status: getStatus(raw.status),
      href: `/tasks?task=${String(raw.id)}`,
    })) satisfies TodayTaskItem[];
    const tasksOverdue = taskItems.filter(
      (item) => toDateKey(item.dueDate) < dateKey,
    );
    const tasksDueToday = taskItems.filter(
      (item) => toDateKey(item.dueDate) === dateKey,
    );

    const calendarItems = (calendarResult.data ?? []).map((raw) => ({
      id: String(raw.id),
      title: String(raw.title || "Plan"),
      description:
        typeof raw.description === "string" ? raw.description : "",
      startAt: String(raw.start_at),
      allDay: raw.all_day === true,
      priority: getPriority(raw.priority),
      href: `/calendar?event=${String(raw.id)}`,
    })) satisfies TodayCalendarItem[];
    const unreadNotifications = (notificationsResult.data ?? []).map((raw) =>
      mapNotification(raw as Record<string, unknown>),
    );

    const priorities: TodayPriorityItem[] = [
      ...financeOverdue
        .filter((item) => item.priority === "critical")
        .map((item) => ({
          id: `finance-critical-${item.id}`,
          source: "finance" as const,
          title: item.title,
          reason: `Kritik borç gecikmiş. Kalan tutar ${formatTRY(item.remainingAmount)}.`,
          priority: item.priority,
          href: item.href,
          rank: 1,
        })),
      ...financeOverdue
        .filter((item) => item.priority !== "critical")
        .map((item) => ({
          id: `finance-overdue-${item.id}`,
          source: "finance" as const,
          title: item.title,
          reason: `Borç vadesi geçmiş. Kalan tutar ${formatTRY(item.remainingAmount)}.`,
          priority: item.priority,
          href: item.href,
          rank: 2,
        })),
      ...financeDueToday.map((item) => ({
        id: `finance-today-${item.id}`,
        source: "finance" as const,
        title: item.title,
        reason: `Borç ödemesi bugün. Kalan tutar ${formatTRY(item.remainingAmount)}.`,
        priority: item.priority,
        href: item.href,
        rank: 3,
      })),
      ...tasksOverdue.map((item) => ({
        id: `task-overdue-${item.id}`,
        source: "task" as const,
        title: item.title,
        reason: "Görevin teslim tarihi geçti.",
        priority: item.priority,
        href: item.href,
        rank: 4,
      })),
      ...tasksDueToday.map((item) => ({
        id: `task-today-${item.id}`,
        source: "task" as const,
        title: item.title,
        reason: "Görevin teslim tarihi bugün.",
        priority: item.priority,
        href: item.href,
        rank: 5,
      })),
      ...calendarItems.map((item) => ({
        id: `calendar-${item.id}`,
        source: "calendar" as const,
        title: item.title,
        reason: item.allDay
          ? "Bugün için tüm gün planlandı."
          : `Bugün ${new Intl.DateTimeFormat("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Istanbul",
            }).format(new Date(item.startAt))} saatinde planlandı.`,
        priority: item.priority,
        href: item.href,
        rank: 6,
      })),
      ...unreadNotifications
        .filter((item) => item.priority === "critical")
        .map((item) => ({
          id: `notification-${item.id}`,
          source: "notification" as const,
          title: item.title,
          reason: item.message,
          priority: item.priority,
          href: item.action_url ?? "/dashboard",
          rank: 7,
        })),
    ]
      .sort((left, right) => left.rank - right.rank)
      .slice(0, 15);

    const criticalWarnings =
      financeItems.filter((item) => item.priority === "critical").length +
      taskItems.filter((item) => item.priority === "critical").length +
      unreadNotifications.filter((item) => item.priority === "critical").length;

    return {
      data: {
        dateKey,
        dateLabel: formatDateLabel(now),
        counts: {
          financeDueToday: financeDueToday.length,
          financeOverdue: financeOverdue.length,
          tasksDueToday: tasksDueToday.length,
          tasksOverdue: tasksOverdue.length,
          calendarToday: calendarItems.length,
          unreadNotifications: unreadNotifications.length,
          criticalWarnings,
        },
        financeDueToday,
        financeOverdue,
        tasksDueToday,
        tasksOverdue,
        calendarItems,
        unreadNotifications,
        priorities,
        existingDailyNote: noteResult.data
          ? {
              id: String(noteResult.data.id),
              title: String(noteResult.data.title),
            }
          : null,
        moduleErrors,
      },
      error: null,
    };
  } catch {
    return {
      data: null,
      error: "Bugün verileri alınamadı. Lütfen tekrar dene.",
    };
  }
}
