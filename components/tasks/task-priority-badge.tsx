import { Badge } from "@/components/ui/badge";
import { TASK_PRIORITY_LABELS } from "@/lib/tasks";
import type { TaskPriority } from "@/types";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

const priorityVariants: Record<
  TaskPriority,
  "default" | "violet" | "amber" | "red"
> = {
  low: "default",
  medium: "violet",
  high: "amber",
  critical: "red",
};

export function TaskPriorityBadge({
  priority,
}: TaskPriorityBadgeProps) {
  return (
    <Badge variant={priorityVariants[priority]}>
      {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
