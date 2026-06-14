import { TaskCard } from "@/components/tasks/task-card";
import { TASK_STATUS_LABELS } from "@/lib/tasks";
import type { TaskStatus, TaskWithCategory } from "@/types";

interface TaskBoardProps {
  busyTaskId: string;
  isArchived: (task: TaskWithCategory) => boolean;
  onArchive: (task: TaskWithCategory) => void;
  onDelete: (task: TaskWithCategory) => void;
  onEdit: (task: TaskWithCategory) => void;
  onRestore: (task: TaskWithCategory) => void;
  onStatusChange: (task: TaskWithCategory, status: TaskStatus) => void;
  referenceTime: string;
  tasks: TaskWithCategory[];
}

const columns: TaskStatus[] = ["todo", "in_progress", "waiting", "done"];

export function TaskBoard({
  busyTaskId,
  isArchived,
  onArchive,
  onDelete,
  onEdit,
  onRestore,
  onStatusChange,
  referenceTime,
  tasks,
}: TaskBoardProps) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-4">
      {columns.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);

        return (
          <section
            className="app-surface min-w-0 rounded-2xl border p-3"
            key={status}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="app-text text-xs font-semibold">
                {TASK_STATUS_LABELS[status]}
              </h2>
              <span className="app-surface-2 app-muted rounded-md border px-2 py-0.5 font-mono text-[9px]">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnTasks.length > 0 ? (
                columnTasks.map((task) => (
                  <TaskCard
                    isArchived={isArchived(task)}
                    isBusy={busyTaskId === task.id}
                    key={task.id}
                    mode="board"
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onRestore={onRestore}
                    onStatusChange={onStatusChange}
                    referenceTime={referenceTime}
                    task={task}
                  />
                ))
              ) : (
                <div className="app-border app-muted rounded-xl border border-dashed px-3 py-8 text-center text-[10px]">
                  Bu kolonda görev yok
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
