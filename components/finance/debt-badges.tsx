import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import type { DebtPriority, DebtStatus } from "@/types";

export type DebtDueState =
  | "cancelled"
  | "overdue"
  | "paid"
  | "planned"
  | "soon"
  | "structured"
  | "today";

const dueStateLabels: Record<DebtDueState, string> = {
  cancelled: "İptal",
  overdue: "Gecikti",
  paid: "Ödendi",
  planned: "Planlandı",
  soon: "Yaklaşıyor",
  structured: "Yapılandırıldı",
  today: "Bugün Son Gün",
};

const priorityLabels: Record<DebtPriority, string> = {
  low: "Düşük",
  medium: "Normal",
  high: "Önemli",
  critical: "Kritik",
};

function getDayDifference(dueDate: string, today: string): number {
  const due = new Date(`${dueDate}T12:00:00+03:00`).getTime();
  const current = new Date(`${today}T12:00:00+03:00`).getTime();
  return Math.round((due - current) / 86_400_000);
}

export function getDebtDueState(
  status: DebtStatus,
  dueDate?: string | null,
  reminderDaysBefore = 3,
): DebtDueState {
  if (status === "paid") return "paid";
  if (status === "cancelled") return "cancelled";
  if (!dueDate) return status === "structured" ? "structured" : "planned";

  const days = getDayDifference(dueDate, getIstanbulDateKey());
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= reminderDaysBefore) return "soon";
  return status === "structured" ? "structured" : "planned";
}

export function getDebtDueTimingLabel(
  status: DebtStatus,
  dueDate?: string | null,
): string {
  if (status === "paid") return "Ödeme tamamlandı";
  if (!dueDate) return "Son ödeme tarihi yok";

  const days = getDayDifference(dueDate, getIstanbulDateKey());
  if (days === 0) return "Bugün son gün";
  if (days > 0) return `${days} gün kaldı`;
  return `${Math.abs(days)} gün gecikti`;
}

export function DebtStatusBadge({
  status,
  dueDate,
  reminderDaysBefore = 3,
}: {
  status: DebtStatus;
  dueDate?: string | null;
  reminderDaysBefore?: number;
}) {
  const dueState = getDebtDueState(status, dueDate, reminderDaysBefore);
  const color =
    dueState === "paid"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-400"
      : dueState === "overdue"
        ? "border-rose-400/20 bg-rose-500/10 text-rose-400"
        : dueState === "today" || dueState === "soon"
          ? "border-amber-400/20 bg-amber-500/10 text-amber-400"
          : dueState === "cancelled"
            ? "app-border app-surface-2 app-muted"
            : dueState === "structured"
              ? "border-sky-400/20 bg-sky-500/10 text-sky-400"
              : "app-border app-surface-2 app-muted";

  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${color}`}>
      {dueStateLabels[dueState]}
    </span>
  );
}

export function DebtPriorityBadge({ priority }: { priority: DebtPriority }) {
  const color =
    priority === "critical"
      ? "border-rose-400/20 bg-rose-500/10 text-rose-400"
      : priority === "high"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-400"
        : "app-border app-surface-2 app-muted";

  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${color}`}>
      {priorityLabels[priority]}
    </span>
  );
}
