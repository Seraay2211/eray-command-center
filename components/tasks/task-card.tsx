"use client";

import { memo } from "react";
import { CalendarClock, Edit3, Trash2 } from "lucide-react";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { Card } from "@/components/ui/card";
import { DarkSelect } from "@/components/ui/dark-select";
import { getCategoryDisplayName } from "@/lib/categories/display";
import { TASK_STATUS_OPTIONS } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type { TaskStatus, TaskWithCategory } from "@/types";

interface TaskCardProps {
  isBusy: boolean;
  mode?: "board" | "list";
  onDelete: (task: TaskWithCategory) => void;
  onEdit: (task: TaskWithCategory) => void;
  onStatusChange: (task: TaskWithCategory, status: TaskStatus) => void;
  referenceTime: string;
  task: TaskWithCategory;
}

function formatDueDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function TaskCardComponent({
  isBusy,
  mode = "list",
  onDelete,
  onEdit,
  onStatusChange,
  referenceTime,
  task,
}: TaskCardProps) {
  const isOverdue =
    task.status !== "done" &&
    Boolean(task.due_date) &&
    new Date(task.due_date as string).getTime() <
      new Date(referenceTime).getTime();

  return (
    <Card
      className={cn(
        "p-4 transition duration-200 hover:border-[color-mix(in_srgb,var(--primary)_24%,var(--border))] hover:bg-[var(--surface-2)]",
        mode === "list" && "sm:p-5",
        task.status === "done" && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <TaskPriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
          {isOverdue ? (
            <span className="inline-flex rounded-md border border-rose-400/20 bg-rose-500/[0.08] px-2 py-0.5 text-[10px] font-semibold text-rose-300">
              Gecikti
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label={`${task.title} görevini düzenle`}
            className="app-button-ghost flex size-8 items-center justify-center rounded-lg transition"
            disabled={isBusy}
            onClick={() => onEdit(task)}
            type="button"
          >
            <Edit3 className="size-3.5" />
          </button>
          <button
            aria-label={`${task.title} görevini sil`}
            className="app-muted flex size-8 items-center justify-center rounded-lg transition hover:bg-rose-500/[0.08] hover:text-rose-300"
            disabled={isBusy}
            onClick={() => onDelete(task)}
            type="button"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <h3
        className={cn(
          "app-text mt-4 font-semibold leading-6",
          mode === "board" ? "text-sm" : "text-base",
          task.status === "done" && "line-through decoration-zinc-600",
        )}
      >
        {task.title}
      </h3>
      <p className="app-muted mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5">
        {task.description || "Bu görev için açıklama eklenmemiş."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {task.category ? (
          <span
            className="inline-flex max-w-full items-center truncate rounded-md border px-2 py-1 text-[10px] font-semibold"
            style={{
              backgroundColor: `${task.category.color}12`,
              borderColor: `${task.category.color}35`,
              color: task.category.color,
            }}
          >
            {getCategoryDisplayName(task.category)}
          </span>
        ) : (
          <span className="app-surface-2 app-border app-muted inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold">
            Kategorisiz
          </span>
        )}
        {task.due_date ? (
          <span
            className={cn(
              "flex items-center gap-1.5 text-[10px]",
              isOverdue ? "text-rose-300" : "app-muted",
            )}
          >
            <CalendarClock className="size-3.5" />
            {formatDueDate(task.due_date)}
          </span>
        ) : null}
      </div>

      <div className="app-border mt-4 border-t pt-3">
        <DarkSelect
          ariaLabel={`${task.title} görev durumunu değiştir`}
          disabled={isBusy}
          onChange={(value) => onStatusChange(task, value as TaskStatus)}
          options={TASK_STATUS_OPTIONS}
          value={task.status}
        />
      </div>
    </Card>
  );
}

export const TaskCard = memo(
  TaskCardComponent,
  (previous, next) =>
    previous.isBusy === next.isBusy &&
    previous.mode === next.mode &&
    previous.referenceTime === next.referenceTime &&
    previous.task === next.task,
);
