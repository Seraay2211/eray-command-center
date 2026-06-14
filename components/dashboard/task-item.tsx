import Link from "next/link";
import { CalendarClock, Circle } from "lucide-react";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import type { DashboardTask } from "@/types";

interface TaskItemProps {
  task: DashboardTask;
}

function formatDueDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function TaskItem({ task }: TaskItemProps) {
  return (
    <Link
      className="group flex items-start gap-3 border-b border-[var(--border)] py-3.5 last:border-0"
      href={`/tasks?task=${encodeURIComponent(task.id)}`}
    >
      <span className="app-muted mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full transition group-hover:bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface))] group-hover:text-[var(--primary)]">
        <Circle className="size-[17px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="app-text truncate text-sm font-medium transition group-hover:text-[var(--primary)]">
          {task.title}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
          {task.dueDate ? (
            <span className="app-muted flex items-center gap-1 text-[10px]">
              <CalendarClock className="size-3" />
              {formatDueDate(task.dueDate)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
