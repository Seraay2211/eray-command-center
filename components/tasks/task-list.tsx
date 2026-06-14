import { TaskCard } from "@/components/tasks/task-card";
import type { TaskStatus, TaskWithCategory } from "@/types";

interface TaskListProps {
  busyTaskId: string;
  onDelete: (task: TaskWithCategory) => void;
  onEdit: (task: TaskWithCategory) => void;
  onStatusChange: (task: TaskWithCategory, status: TaskStatus) => void;
  referenceTime: string;
  tasks: TaskWithCategory[];
}

export function TaskList({
  busyTaskId,
  onDelete,
  onEdit,
  onStatusChange,
  referenceTime,
  tasks,
}: TaskListProps) {
  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <TaskCard
          isBusy={busyTaskId === task.id}
          key={task.id}
          onDelete={onDelete}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          referenceTime={referenceTime}
          task={task}
        />
      ))}
    </div>
  );
}
