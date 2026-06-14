import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import type { DebtPriority, DebtStatus } from "@/types";

const statusLabels: Record<DebtStatus, string> = {
  active: "Aktif",
  overdue: "Gecikmiş",
  structured: "Yapılandırıldı",
  paid: "Kapandı",
  cancelled: "İptal",
};

const priorityLabels: Record<DebtPriority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

export function getDebtDisplayStatus(
  status: DebtStatus,
  dueDate?: string | null,
): DebtStatus {
  if (
    dueDate &&
    dueDate < getIstanbulDateKey() &&
    status !== "paid" &&
    status !== "cancelled"
  ) {
    return "overdue";
  }

  return status;
}

export function DebtStatusBadge({
  status,
  dueDate,
}: {
  status: DebtStatus;
  dueDate?: string | null;
}) {
  const displayStatus = getDebtDisplayStatus(status, dueDate);
  const color =
    displayStatus === "paid"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-400"
      : displayStatus === "overdue"
        ? "border-rose-400/20 bg-rose-500/10 text-rose-400"
        : displayStatus === "cancelled"
          ? "app-border app-surface-2 app-muted"
          : displayStatus === "structured"
            ? "border-sky-400/20 bg-sky-500/10 text-sky-400"
            : "border-violet-400/20 bg-violet-500/10 app-primary";

  return (
    <span
      className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${color}`}
    >
      {statusLabels[displayStatus]}
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
    <span
      className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${color}`}
    >
      {priorityLabels[priority]}
    </span>
  );
}
