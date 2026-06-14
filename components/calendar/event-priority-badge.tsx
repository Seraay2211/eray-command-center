import { AlertTriangle, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlannerEventPriority } from "@/types";

const labels: Record<PlannerEventPriority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

const tones: Record<PlannerEventPriority, string> = {
  low: "app-border app-surface-2 app-muted",
  medium: "border-amber-400/20 bg-amber-500/10 text-amber-300",
  high: "border-orange-400/20 bg-orange-500/10 text-orange-300",
  critical: "border-rose-400/20 bg-rose-500/10 text-rose-300",
};

const icons = {
  low: Minus,
  medium: Minus,
  high: ArrowUp,
  critical: AlertTriangle,
} satisfies Record<PlannerEventPriority, typeof Minus>;

interface EventPriorityBadgeProps {
  priority: PlannerEventPriority;
}

export function EventPriorityBadge({ priority }: EventPriorityBadgeProps) {
  const Icon = icons[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold",
        tones[priority],
      )}
    >
      <Icon className="size-3" />
      {labels[priority]}
    </span>
  );
}
