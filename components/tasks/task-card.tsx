"use client";

import { memo } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  Edit3,
  Trash2,
} from "lucide-react";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { Card } from "@/components/ui/card";
import { DarkSelect } from "@/components/ui/dark-select";
import { getCategoryDisplayName } from "@/lib/categories/display";
import { TASK_STATUS_OPTIONS } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type { TaskStatus, TaskWithCategory } from "@/types";

interface TaskCardProps {
  isArchived: boolean;
  isBusy: boolean;
  mode?: "board" | "list";
  onArchive: (task: TaskWithCategory) => void;
  onDelete: (task: TaskWithCategory) => void;
  onEdit: (task: TaskWithCategory) => void;
  onRestore: (task: TaskWithCategory) => void;
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
  isArchived,
  isBusy,
  mode = "list",
  onArchive,
  onDelete,
  onEdit,
  onRestore,
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
        "p-3 transition duration-200 hover:border-[color-mix(in_srgb,var(--primary)_24%,var(--border))] hover:bg-[var(--surface-2)]",
        mode === "board" && "p-4",
        task.status === "done" && "opacity-75",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3
              className={cn(
                "app-text min-w-0 flex-1 truncate font-semibold",
                mode === "board" ? "basis-full text-sm" : "text-sm sm:text-base",
                task.status === "done" && "line-through decoration-zinc-600",
              )}
            >
              {task.title}
            </h3>
            <TaskPriorityBadge priority={task.priority} />
            <TaskStatusBadge status={task.status} />
            {isOverdue ? (
              <span className="inline-flex rounded-md border border-rose-400/20 bg-rose-500/[0.08] px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                Gecikti
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label={`${task.title} görevini düzenle`}
            className="app-button-ghost flex size-8 items-center justify-center rounded-lg transition"
            disabled={isBusy}
            onClick={() => onEdit(task)}
            title="Düzenle"
            type="button"
          >
            <Edit3 className="size-3.5" />
          </button>
          <button
            aria-label={
              isArchived
                ? `${task.title} görevini arşivden çıkar`
                : `${task.title} görevini arşivle`
            }
            className="app-button-ghost flex size-8 items-center justify-center rounded-lg transition"
            disabled={isBusy}
            onClick={() => (isArchived ? onRestore(task) : onArchive(task))}
            title={isArchived ? "Arşivden çıkar" : "Arşivle"}
            type="button"
          >
            {isArchived ? (
              <ArchiveRestore className="size-3.5" />
            ) : (
              <Archive className="size-3.5" />
            )}
          </button>
          <button
            aria-label={`${task.title} görevini sil`}
            className="app-muted flex size-8 items-center justify-center rounded-lg transition hover:bg-rose-500/[0.08] hover:text-rose-300"
            disabled={isBusy}
            onClick={() => onDelete(task)}
            title="Sil"
            type="button"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {task.description ? (
        <p
          className={cn(
            "app-muted mt-2 whitespace-pre-wrap text-xs leading-5",
            mode === "list" ? "line-clamp-1" : "line-clamp-3",
          )}
        >
          {task.description}
        </p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
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

      <div
        className={cn(
          "app-border mt-3 border-t pt-3",
          mode === "list" && "sm:flex sm:justify-end",
        )}
      >
        <DarkSelect
          ariaLabel={`${task.title} görev durumunu değiştir`}
          className={cn(mode === "list" && "sm:w-44")}
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
    previous.isArchived === next.isArchived &&
    previous.isBusy === next.isBusy &&
    previous.mode === next.mode &&
    previous.referenceTime === next.referenceTime &&
    previous.task === next.task,
);
