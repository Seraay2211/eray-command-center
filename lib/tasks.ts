import type {
  DarkSelectOption,
} from "@/components/ui/dark-select";
import type { TaskPriority, TaskStatus } from "@/types";

export const TASK_STATUS_OPTIONS: Array<
  DarkSelectOption & { value: TaskStatus }
> = [
  { label: "Yapılacak", value: "todo" },
  { label: "Devam Ediyor", value: "in_progress" },
  { label: "Beklemede", value: "waiting" },
  { label: "Tamamlandı", value: "done" },
];

export const TASK_PRIORITY_OPTIONS: Array<
  DarkSelectOption & { value: TaskPriority }
> = [
  { label: "Düşük", value: "low" },
  { label: "Orta", value: "medium" },
  { label: "Yüksek", value: "high" },
  { label: "Kritik", value: "critical" },
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Yapılacak",
  in_progress: "Devam Ediyor",
  waiting: "Beklemede",
  done: "Tamamlandı",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};
