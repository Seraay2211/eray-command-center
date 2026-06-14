import { TaskCard } from "@/components/tasks/task-card";
import type { TaskStatus, TaskWithCategory } from "@/types";

interface TaskListProps {
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

export function TaskList({
  busyTaskId,
  isArchived,
  onArchive,
  onDelete,
  onEdit,
  onRestore,
  onStatusChange,
  referenceTime,
  tasks,
}: TaskListProps) {
  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <TaskCard
          isArchived={isArchived(task)}
          isBusy={busyTaskId === task.id}
          key={task.id}
          onArchive={onArchive}
          onDelete={onDelete}
          onEdit={onEdit}
          onRestore={onRestore}
          onStatusChange={onStatusChange}
          referenceTime={referenceTime}
          task={task}
        />
      ))}
    </div>
  );
}
