import type { TaskPriority, TaskStatus } from "@/types";
import type {
  AppNotification,
  NotificationPriority,
} from "@/types/notifications";

export type TodayPrioritySource =
  | "finance"
  | "task"
  | "calendar"
  | "notification";

export interface TodayFinanceItem {
  id: string;
  title: string;
  creditor: string | null;
  remainingAmount: number;
  dueDate: string;
  priority: TaskPriority;
  href: string;
}

export interface TodayTaskItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  href: string;
}

export interface TodayCalendarItem {
  id: string;
  title: string;
  description: string;
  startAt: string;
  allDay: boolean;
  priority: TaskPriority;
  href: string;
}

export interface TodayPriorityItem {
  id: string;
  source: TodayPrioritySource;
  title: string;
  reason: string;
  priority: TaskPriority | NotificationPriority;
  href: string;
  rank: number;
}

export interface TodaySummaryCounts {
  financeDueToday: number;
  financeOverdue: number;
  tasksDueToday: number;
  tasksOverdue: number;
  calendarToday: number;
  unreadNotifications: number;
  criticalWarnings: number;
}

export interface TodaySummary {
  dateKey: string;
  dateLabel: string;
  counts: TodaySummaryCounts;
  financeDueToday: TodayFinanceItem[];
  financeOverdue: TodayFinanceItem[];
  tasksDueToday: TodayTaskItem[];
  tasksOverdue: TodayTaskItem[];
  calendarItems: TodayCalendarItem[];
  unreadNotifications: AppNotification[];
  priorities: TodayPriorityItem[];
  existingDailyNote: {
    id: string;
    title: string;
  } | null;
  moduleErrors: string[];
}
