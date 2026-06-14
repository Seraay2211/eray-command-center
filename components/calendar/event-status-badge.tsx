import { cn } from "@/lib/utils";
import type { PlannerEventStatus } from "@/types";

const labels: Record<PlannerEventStatus, string> = {
  scheduled: "Planlandı",
  in_progress: "Devam Ediyor",
  done: "Tamamlandı",
  cancelled: "İptal",
};

const tones: Record<PlannerEventStatus, string> = {
  scheduled: "app-border app-surface-2 app-muted",
  in_progress: "border-sky-400/20 bg-sky-500/10 text-sky-300",
  done: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  cancelled: "border-rose-400/20 bg-rose-500/10 text-rose-300",
};

interface EventStatusBadgeProps {
  status: PlannerEventStatus;
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold",
        tones[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
