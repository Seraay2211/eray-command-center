"use server";

import { revalidatePath } from "next/cache";
import { getIstanbulDateKey, getIstanbulDayRange } from "@/lib/dates/istanbul";
import { createClient } from "@/lib/supabase/server";
import { formatTRY } from "@/lib/utils/currency";
import type { ActionResult } from "@/types";
import type {
  AppNotification,
  CreateNotificationInput,
  NotificationPriority,
  NotificationType,
} from "@/types/notifications";

const notificationSelect =
  "id,user_id,type,title,message,source,source_id,priority,action_url,is_read,read_at,metadata,created_at";

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

const priorities: NotificationPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function getNotificationErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error);

  if (
    message.includes("PGRST205") ||
    message.includes("notifications") ||
    message.includes("schema cache")
  ) {
    return "Bildirim sistemi henüz hazır değil.";
  }

  if (
    message.includes("row-level security") ||
    message.includes("permission denied")
  ) {
    return "Bu bildirim işlemi için yetkin yok.";
  }

  return "Bildirim işlemi tamamlanamadı. Lütfen tekrar dene.";
}

function mapNotification(raw: Record<string, unknown>): AppNotification {
  const type = notificationTypes.includes(raw.type as NotificationType)
    ? (raw.type as NotificationType)
    : "system";
  const priority = priorities.includes(raw.priority as NotificationPriority)
    ? (raw.priority as NotificationPriority)
    : "medium";

  return {
    id: String(raw.id),
    user_id: String(raw.user_id),
    type,
    title: typeof raw.title === "string" ? raw.title : "Bildirim",
    message: typeof raw.message === "string" ? raw.message : "",
    source: typeof raw.source === "string" ? raw.source : null,
    source_id: typeof raw.source_id === "string" ? raw.source_id : null,
    priority,
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

function buildDynamicNotification(input: {
  actionUrl: string;
  createdAt?: string;
  id: string;
  message: string;
  priority: NotificationPriority;
  source: string;
  sourceId: string;
  title: string;
  type: NotificationType;
  userId: string;
}): AppNotification {
  return {
    id: input.id,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    source: input.source,
    source_id: input.sourceId,
    priority: input.priority,
    action_url: input.actionUrl,
    is_read: false,
    read_at: null,
    metadata: { dynamic: true },
    created_at: input.createdAt ?? new Date().toISOString(),
  };
}

async function buildDynamicNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<AppNotification[]> {
  try {
    const todayKey = getIstanbulDateKey();
    const { startIso, endIso } = getIstanbulDayRange();
    const weekEndKey = getIstanbulDateKey(addDays(new Date(startIso), 7));
    const [tasksResult, calendarResult, installmentsResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("id,title,priority,due_date")
        .eq("user_id", userId)
        .is("archived_at", null)
        .neq("status", "done")
        .not("due_date", "is", null)
        .lt("due_date", endIso)
        .order("due_date", { ascending: true })
        .limit(12),
      supabase
        .from("planner_events")
        .select("id,title,start_at,priority,status")
        .eq("user_id", userId)
        .neq("status", "cancelled")
        .gte("start_at", startIso)
        .lt("start_at", endIso)
        .order("start_at", { ascending: true })
        .limit(8),
      supabase
        .from("debt_installments")
        .select("id,debt_id,installment_no,due_date,expected_amount,paid_amount,status,debt:debts(id,title)")
        .eq("user_id", userId)
        .neq("status", "paid")
        .lt("due_date", weekEndKey)
        .order("due_date", { ascending: true })
        .limit(12),
    ]);

    const taskNotifications = (tasksResult.data ?? []).map((task) => {
      const dueDate = String(task.due_date ?? "");
      const isOverdue = dueDate < startIso;
      return buildDynamicNotification({
        actionUrl: `/tasks?task=${encodeURIComponent(String(task.id))}`,
        createdAt: dueDate || undefined,
        id: `dynamic-task-${String(task.id)}`,
        message: isOverdue
          ? "Görevin son tarihi geçti."
          : "Görevin son tarihi bugün.",
        priority: isOverdue ? "high" : "medium",
        source: "task",
        sourceId: String(task.id),
        title: String(task.title || "Görev takibi"),
        type: "task_due",
        userId,
      });
    });
    const calendarNotifications = (calendarResult.data ?? []).map((event) =>
      buildDynamicNotification({
        actionUrl: `/calendar?event=${encodeURIComponent(String(event.id))}`,
        createdAt: String(event.start_at ?? new Date().toISOString()),
        id: `dynamic-calendar-${String(event.id)}`,
        message: "Bugün takvimde planlanmış kayıt var.",
        priority: "medium",
        source: "calendar",
        sourceId: String(event.id),
        title: String(event.title || "Bugünkü plan"),
        type: "calendar_today",
        userId,
      }),
    );
    const installmentNotifications = (installmentsResult.data ?? []).map(
      (installment) => {
        const debt = Array.isArray(installment.debt)
          ? installment.debt[0]
          : installment.debt;
        const debtTitle =
          debt && typeof debt === "object" && "title" in debt
            ? String(debt.title ?? "Taksit")
            : "Taksit";
        const remaining = Math.max(
          Number(installment.expected_amount) -
            Number(installment.paid_amount),
          0,
        );
        const dueDate = String(installment.due_date);
        const isOverdue = dueDate < todayKey;
        const isToday = dueDate === todayKey;

        return buildDynamicNotification({
          actionUrl: `/finance?debt=${encodeURIComponent(
            String(installment.debt_id),
          )}&installment=${encodeURIComponent(String(installment.id))}`,
          createdAt: new Date(`${dueDate}T09:00:00+03:00`).toISOString(),
          id: `dynamic-installment-${String(installment.id)}`,
          message: `${installment.installment_no}. taksit için kalan tutar ${formatTRY(
            remaining,
          )}.`,
          priority: isOverdue ? "critical" : isToday ? "high" : "medium",
          source: "finance",
          sourceId: String(installment.id),
          title: isOverdue
            ? `${debtTitle} taksiti gecikti`
            : isToday
              ? `${debtTitle} taksiti bugün`
              : `${debtTitle} taksiti yaklaşıyor`,
          type: isOverdue ? "finance_overdue" : "finance_due_today",
          userId,
        });
      },
    );

    return [
      ...installmentNotifications,
      ...taskNotifications,
      ...calendarNotifications,
    ];
  } catch {
    return [];
  }
}

async function getContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Oturum doğrulanamadı.");
  }

  return { supabase, userId: data.user.id };
}

function revalidateNotificationViews() {
  revalidatePath("/dashboard");
  revalidatePath("/finance");
}

export async function getNotifications(
  limitValue = 30,
): Promise<ActionResult<AppNotification[]>> {
  try {
    const limit = Math.min(Math.max(limitValue, 1), 50);
    const { supabase, userId } = await getContext();
    const [dynamicNotifications, storedResult] = await Promise.all([
      buildDynamicNotifications(supabase, userId),
      supabase
      .from("notifications")
      .select(notificationSelect)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    const storedNotifications = storedResult.error
      ? []
      : (storedResult.data ?? []).map((item) =>
          mapNotification(item as Record<string, unknown>),
        );

    return {
      data: [...dynamicNotifications, ...storedNotifications]
        .sort(
          (left, right) =>
            new Date(right.created_at).getTime() -
            new Date(left.created_at).getTime(),
        )
        .slice(0, limit),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getNotificationErrorMessage(error) };
  }
}

export async function getUnreadNotificationCount(): Promise<
  ActionResult<number>
> {
  try {
    const { supabase, userId } = await getContext();
    const [dynamicNotifications, storedResult] = await Promise.all([
      buildDynamicNotifications(supabase, userId),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false),
    ]);

    return {
      data:
        dynamicNotifications.length +
        (storedResult.error ? 0 : (storedResult.count ?? 0)),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getNotificationErrorMessage(error) };
  }
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<ActionResult<AppNotification>> {
  try {
    const title = input.title.trim().slice(0, 180);
    const message = input.message.trim().slice(0, 1200);

    if (!title || !message || !notificationTypes.includes(input.type)) {
      return { data: null, error: "Geçerli bildirim bilgileri gerekli." };
    }

    const priority = priorities.includes(input.priority ?? "medium")
      ? (input.priority ?? "medium")
      : "medium";
    const { supabase, userId } = await getContext();
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: input.type,
        title,
        message,
        source: input.source ?? null,
        source_id: input.source_id ?? null,
        priority,
        action_url: input.action_url?.trim() || null,
        metadata: input.metadata ?? {},
      })
      .select(notificationSelect)
      .single();

    if (error) throw error;
    revalidateNotificationViews();

    return {
      data: mapNotification(data as Record<string, unknown>),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getNotificationErrorMessage(error) };
  }
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, userId } = await getContext();
    const { data, error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { data: null, error: "Bildirim bulunamadı." };
    revalidateNotificationViews();
    return { data: { id: data.id }, error: null };
  } catch (error) {
    return { data: null, error: getNotificationErrorMessage(error) };
  }
}

export async function markAllNotificationsAsRead(): Promise<
  ActionResult<{ count: number }>
> {
  try {
    const { supabase, userId } = await getContext();
    const { data, error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select("id");

    if (error) throw error;
    revalidateNotificationViews();
    return { data: { count: data?.length ?? 0 }, error: null };
  } catch (error) {
    return { data: null, error: getNotificationErrorMessage(error) };
  }
}

export async function deleteNotification(
  notificationId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, userId } = await getContext();
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { data: null, error: "Bildirim bulunamadı." };
    revalidateNotificationViews();
    return { data: { id: data.id }, error: null };
  } catch (error) {
    return { data: null, error: getNotificationErrorMessage(error) };
  }
}
