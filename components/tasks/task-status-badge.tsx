import { Badge } from "@/components/ui/badge";
import { TASK_STATUS_LABELS } from "@/lib/tasks";
import type { TaskStatus } from "@/types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusVariants: Record<
  TaskStatus,
  "default" | "violet" | "amber" | "green"
> = {
  todo: "default",
  in_progress: "violet",
  waiting: "amber",
  done: "green",
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status]}>
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}
