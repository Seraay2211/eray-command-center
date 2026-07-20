import "server-only";

import { getIstanbulDateKey, getIstanbulDayRange } from "@/lib/dates/istanbul";
import { createClient } from "@/lib/supabase/server";
import type { Debt } from "@/types";
import type {
  CreateNotificationInput,
  NotificationType,
} from "@/types/notifications";

const financeAlertTypes: NotificationType[] = [
  "finance_overdue",
  "finance_due_today",
  "finance_due_soon",
  "finance_critical",
];

interface FinanceAlertResult {
  available: boolean;
  created: number;
}

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function mapDebt(raw: Record<string, unknown>): Debt {
  return {
    ...(raw as unknown as Debt),
    total_amount: toNumber(raw.total_amount),
    paid_amount: toNumber(raw.paid_amount),
    reminder_days_before:
      raw.reminder_days_before === null ||
      raw.reminder_days_before === undefined
        ? 3
        : toNumber(raw.reminder_days_before),
  };
}

function isReminderColumnMissing(message: string): boolean {
  return (
    message.includes("reminder_days_before") ||
    message.includes("schema cache") ||
    message.includes("PGRST204")
  );
}

function buildAlertCandidates(
  debts: Debt[],
  today: string,
): CreateNotificationInput[] {
  return debts.flatMap((debt) => {
    if (debt.status === "paid" || debt.status === "cancelled") return [];

    const remaining = Math.max(debt.total_amount - debt.paid_amount, 0);
    if (remaining <= 0) return [];

    const actionUrl = `/finance?debt=${encodeURIComponent(debt.id)}`;
    const metadata = {
      generated_for_date: today,
      remaining_amount: remaining,
    };
    const alerts: CreateNotificationInput[] = [];

    if (debt.due_date && debt.due_date < today) {
      alerts.push({
        type: "finance_overdue",
        title: "Geciken borç var",
        message: "Son ödeme tarihi geçmiş bir borç kaydı bulunuyor.",
        source: "finance",
        source_id: debt.id,
        priority: "critical",
        action_url: actionUrl,
        metadata,
      });
    }

    if (debt.due_date === today) {
      alerts.push({
        type: "finance_due_today",
        title: "Bugün son ödeme günü",
        message: "Bugün son ödeme tarihi olan bir borç kaydı var.",
        source: "finance",
        source_id: debt.id,
        priority: "high",
        action_url: actionUrl,
        metadata,
      });
    }

    if (debt.due_date && debt.due_date > today) {
      const reminderDate = new Date(`${today}T12:00:00+03:00`);
      reminderDate.setDate(
        reminderDate.getDate() + (debt.reminder_days_before ?? 3),
      );
      const reminderLimit = getIstanbulDateKey(reminderDate);
      if (debt.due_date <= reminderLimit) {
        alerts.push({
          type: "finance_due_soon",
          title: "Yaklaşan son ödeme tarihi",
          message: "Son ödeme tarihi yaklaşan bir borç kaydı var.",
          source: "finance",
          source_id: debt.id,
          priority: "high",
          action_url: actionUrl,
          metadata,
        });
      }
    }

    if (debt.priority === "critical") {
      alerts.push({
        type: "finance_critical",
        title: "Kritik borç takibi",
        message: "Kritik öncelikte takip edilen bir borç kaydı var.",
        source: "finance",
        source_id: debt.id,
        priority: "high",
        action_url: actionUrl,
        metadata,
      });
    }

    return alerts;
  });
}

export async function generateFinanceAlerts(
  providedDebts?: Debt[],
): Promise<FinanceAlertResult> {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return { available: false, created: 0 };
    }

    let debts = providedDebts?.filter(
      (debt) => debt.user_id === authData.user.id,
    );

    if (!debts) {
      let { data, error } = await supabase
        .from("debts")
        .select(
          "id,user_id,title,creditor,total_amount,paid_amount,currency,status,priority,due_date,reminder_days_before,installment_count,notes,created_at,updated_at",
        )
        .eq("user_id", authData.user.id)
        .neq("status", "cancelled")
        .limit(50);

      if (error && isReminderColumnMissing(error.message)) {
        const fallback = await supabase
          .from("debts")
          .select(
            "id,user_id,title,creditor,total_amount,paid_amount,currency,status,priority,due_date,installment_count,notes,created_at,updated_at",
          )
          .eq("user_id", authData.user.id)
          .neq("status", "cancelled")
          .limit(50);
        data = fallback.data?.map((debt) => ({
          ...debt,
          reminder_days_before: 3,
        })) ?? null;
        error = fallback.error;
      }

      if (error) return { available: false, created: 0 };
      debts = (data ?? []).map((debt) =>
        mapDebt(debt as Record<string, unknown>),
      );
    }

    const today = getIstanbulDateKey();
    const candidates = buildAlertCandidates(debts, today);
    if (candidates.length === 0) {
      return { available: true, created: 0 };
    }

    const { startIso, endIso } = getIstanbulDayRange();
    const { data: existing, error: existingError } = await supabase
      .from("notifications")
      .select("type,source_id")
      .eq("user_id", authData.user.id)
      .eq("source", "finance")
      .in("type", financeAlertTypes)
      .gte("created_at", startIso)
      .lt("created_at", endIso);

    if (existingError) return { available: false, created: 0 };

    const existingKeys = new Set(
      (existing ?? []).map((item) => `${item.type}:${item.source_id}`),
    );
    const pending = candidates.filter(
      (candidate) =>
        !existingKeys.has(`${candidate.type}:${candidate.source_id}`),
    );
    let created = 0;

    for (const notification of pending) {
      const { error } = await supabase.from("notifications").insert({
        user_id: authData.user.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        source: notification.source ?? null,
        source_id: notification.source_id ?? null,
        priority: notification.priority ?? "medium",
        action_url: notification.action_url ?? null,
        metadata: notification.metadata ?? {},
      });

      if (!error) created += 1;
    }

    return { available: true, created };
  } catch {
    return { available: false, created: 0 };
  }
}
