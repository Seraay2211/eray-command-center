import { cn } from "@/lib/utils";
import type { PlannerEventType } from "@/types";

const labels: Record<PlannerEventType, string> = {
  plan: "Plan",
  focus: "Odak",
  reminder: "Hatirlatma",
  meeting: "Toplantı",
  task: "Görev",
  note: "Not",
  personal: "Kişisel",
};

const tones: Record<PlannerEventType, string> = {
  plan: "border-violet-400/20 bg-violet-500/10 text-violet-300",
  focus: "border-cyan-400/20 bg-cyan-500/10 text-cyan-300",
  reminder: "border-amber-400/20 bg-amber-500/10 text-amber-300",
  meeting: "border-sky-400/20 bg-sky-500/10 text-sky-300",
  task: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  note: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-300",
  personal: "border-rose-400/20 bg-rose-500/10 text-rose-300",
};

interface EventTypeBadgeProps {
  eventType: PlannerEventType;
}

export function EventTypeBadge({ eventType }: EventTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold",
        tones[eventType],
      )}
    >
      {labels[eventType]}
    </span>
  );
}
