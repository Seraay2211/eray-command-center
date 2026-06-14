"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
    const { data, error } = await supabase
      .from("notifications")
      .select(notificationSelect)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      data: (data ?? []).map((item) =>
        mapNotification(item as Record<string, unknown>),
      ),
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
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return { data: count ?? 0, error: null };
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
