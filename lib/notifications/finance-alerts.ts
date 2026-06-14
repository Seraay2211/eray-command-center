import "server-only";

import { getIstanbulDateKey, getIstanbulDayRange } from "@/lib/dates/istanbul";
import { createClient } from "@/lib/supabase/server";
import { formatTRY } from "@/lib/utils/currency";
import type { Debt } from "@/types";
import type {
  CreateNotificationInput,
  NotificationType,
} from "@/types/notifications";

const financeAlertTypes: NotificationType[] = [
  "finance_overdue",
  "finance_due_today",
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
  };
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
        title: "Vadesi geçen borç",
        message: `${debt.title} borcunun vadesi geçti. Kalan tutar: ${formatTRY(remaining)}`,
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
        title: "Bugün ödenecek borç",
        message: `${debt.title} borcunun ödeme tarihi bugün. Kalan tutar: ${formatTRY(remaining)}`,
        source: "finance",
        source_id: debt.id,
        priority: "high",
        action_url: actionUrl,
        metadata,
      });
    }

    if (debt.priority === "critical") {
      alerts.push({
        type: "finance_critical",
        title: "Kritik borç takibi",
        message: `${debt.title} kritik öncelikte takip ediliyor. Kalan tutar: ${formatTRY(remaining)}`,
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
      const { data, error } = await supabase
        .from("debts")
        .select(
          "id,user_id,title,creditor,total_amount,paid_amount,currency,status,priority,due_date,installment_count,notes,created_at,updated_at",
        )
        .eq("user_id", authData.user.id)
        .neq("status", "cancelled")
        .limit(50);

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
