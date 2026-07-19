export type NotificationType =
  | "finance_due_today"
  | "finance_overdue"
  | "finance_critical"
  | "finance_payment_added"
  | "finance_payment_deleted"
  | "finance_debt_paid"
  | "task_due"
  | "calendar_today"
  | "ai_summary"
  | "system";

export type NotificationPriority = "low" | "medium" | "high" | "critical";

export type NotificationSource =
  | "finance"
  | "task"
  | "calendar"
  | "note"
  | "report"
  | "ai"
  | "system";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  source: NotificationSource | string | null;
  source_id: string | null;
  priority: NotificationPriority;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationCenterSnapshot {
  notifications: AppNotification[];
  unreadCount: number;
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  source?: NotificationSource | string | null;
  source_id?: string | null;
  priority?: NotificationPriority;
  action_url?: string | null;
  metadata?: Record<string, unknown> | null;
}
