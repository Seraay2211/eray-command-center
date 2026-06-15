import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface StatItem {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: string;
}

export interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: "violet" | "blue" | "amber" | "emerald";
  href: string;
  statusLabel?: string;
}

export interface DashboardStats {
  totalNotes: number;
  todayNotes: number;
  openTasks: number;
  totalReports: number;
  aiReports: number;
}

export interface DashboardRecentNote {
  id: string;
  title: string;
  preview: string;
  date: string;
  isPinned: boolean;
  category: {
    name: string;
    color: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export interface DashboardPinnedSummary {
  count: number;
  latestNote: DashboardRecentNote | null;
}

export type TaskStatus = "todo" | "in_progress" | "waiting" | "done";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface DashboardTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
}

export type DashboardPrioritySource = "task" | "finance" | "calendar";

export interface DashboardPriorityItem {
  id: string;
  source: DashboardPrioritySource;
  title: string;
  description: string;
  href: string;
  priority: TaskPriority;
  dueDate: string | null;
}

export interface DashboardCommandStats {
  todayTasks: number;
  overdueTasks: number;
  upcomingTasks: number;
  todayCalendar: number;
  dueThisWeekDebts: number;
  overdueDebts: number;
  criticalDebts: number;
  importantOpenTasks: number;
}

export type ReportType =
  | "daily"
  | "weekly"
  | "operation"
  | "manager"
  | "finance"
  | "custom";

export type ReportStatus = "draft" | "final" | "archived";

export type ReportSourceType = "note" | "task" | "manual";

export interface DashboardReport {
  id: string;
  title: string;
  reportType: ReportType;
  aiGenerated: boolean;
  date: string;
}

export type PlannerEventType =
  | "plan"
  | "focus"
  | "reminder"
  | "meeting"
  | "task"
  | "note"
  | "personal";

export type PlannerEventStatus =
  | "scheduled"
  | "in_progress"
  | "done"
  | "cancelled";

export type PlannerEventPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface PlannerEvent {
  id: string;
  user_id: string;
  task_id?: string | null;
  note_id?: string | null;
  title: string;
  description?: string | null;
  event_type: PlannerEventType;
  status: PlannerEventStatus;
  priority: PlannerEventPriority;
  start_at: string;
  end_at?: string | null;
  all_day: boolean;
  color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlannerEventWithLinks extends PlannerEvent {
  note?: Pick<Note, "id" | "title"> | null;
  task?: Pick<Task, "id" | "title" | "status" | "priority"> | null;
}

export interface CreatePlannerEventInput {
  title: string;
  description?: string;
  event_type?: PlannerEventType;
  status?: PlannerEventStatus;
  priority?: PlannerEventPriority;
  start_at: string;
  end_at?: string | null;
  all_day?: boolean;
  task_id?: string | null;
  note_id?: string | null;
  color?: string | null;
}

export type UpdatePlannerEventInput = Partial<CreatePlannerEventInput>;

export interface PlannerStats {
  total: number;
  today: number;
  completed: number;
  upcoming: number;
}

export interface TodayTodoStats {
  available: boolean;
  pending: number;
  total: number;
}

export type DebtStatus =
  | "active"
  | "overdue"
  | "structured"
  | "paid"
  | "cancelled";

export type DebtPriority = "low" | "medium" | "high" | "critical";

export type DebtInstallmentStatus =
  | "pending"
  | "partial"
  | "paid"
  | "overdue";

export interface Debt {
  id: string;
  user_id: string;
  title: string;
  creditor: string | null;
  total_amount: number;
  paid_amount: number;
  currency: string;
  status: DebtStatus;
  priority: DebtPriority;
  due_date: string | null;
  installment_count: number | null;
  is_installment: boolean;
  installment_amount: number | null;
  installment_start_date: string | null;
  installment_day: number | null;
  installment_note: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  user_id: string;
  debt_id: string;
  installment_id: string | null;
  amount: number;
  payment_date: string;
  method: string | null;
  note: string | null;
  receipt_url: string | null;
  receipt_path: string | null;
  receipt_file_name: string | null;
  receipt_mime_type: string | null;
  ocr_status: FinanceOcrStatus;
  ocr_result: FinanceOcrResult | null;
  created_at: string;
}

export interface DebtInstallment {
  id: string;
  user_id: string;
  debt_id: string;
  installment_no: number;
  due_date: string;
  expected_amount: number;
  paid_amount: number;
  status: DebtInstallmentStatus;
  paid_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type FinanceAttachmentType =
  | "receipt"
  | "document"
  | "image"
  | "other";

export interface DebtAttachment {
  id: string;
  user_id: string;
  debt_id: string | null;
  payment_id: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  attachment_type: FinanceAttachmentType;
  ocr_text: string | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export type FinanceOcrStatus = "idle" | "processing" | "success" | "failed";

export interface FinanceOcrResult {
  amount: number | null;
  payment_date: string | null;
  method: string | null;
  bank: string | null;
  sender: string | null;
  receiver: string | null;
  reference_no: string | null;
  description: string | null;
  confidence: "low" | "medium" | "high";
  raw_text: string;
  warning: string | null;
}

export interface CreateDebtInput {
  title: string;
  creditor?: string | null;
  total_amount: number;
  currency?: string;
  status?: DebtStatus;
  priority?: DebtPriority;
  due_date?: string | null;
  installment_count?: number | null;
  is_installment?: boolean;
  installment_amount?: number | null;
  installment_start_date?: string | null;
  installment_day?: number | null;
  installment_note?: string | null;
  notes?: string | null;
}

export type UpdateDebtInput = Partial<CreateDebtInput>;

export interface CreateDebtPaymentInput {
  debt_id: string;
  installment_id?: string | null;
  amount: number;
  payment_date?: string;
  method?: string | null;
  note?: string | null;
}

export interface DebtPaymentReceiptDraft {
  file: File;
  ocr_result: FinanceOcrResult | null;
  ocr_status: FinanceOcrStatus;
}

export interface CreateDebtPaymentWithReceiptInput
  extends CreateDebtPaymentInput {
  receipt?: DebtPaymentReceiptDraft;
}

export interface FinanceStats {
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
  dueThisMonth: number;
  criticalCount: number;
  overdueCount: number;
  dueTodayInstallmentCount: number;
  dueSoonInstallmentCount: number;
  overdueInstallmentCount: number;
  monthlyInstallmentBurden: number;
}

export interface FinanceDashboardInstallment {
  id: string;
  debtId: string;
  debtTitle: string;
  creditor: string;
  installmentNo: number;
  dueDate: string;
  expectedAmount: number;
  paidAmount: number;
  status: DebtInstallmentStatus;
}

export interface FinanceDashboardSummary {
  available: boolean;
  remainingDebt: number;
  dueThisMonth: number;
  dueThisWeekCount: number;
  criticalCount: number;
  overdueCount: number;
  installmentsAvailable: boolean;
  dueTodayInstallmentCount: number;
  overdueInstallmentCount: number;
  upcomingInstallments: FinanceDashboardInstallment[];
  lastPayment: {
    amount: number;
    date: string;
    method: string | null;
  } | null;
  upcomingDebts: Array<{
    id: string;
    title: string;
    remainingAmount: number;
    currency: string;
    dueDate: string | null;
  }>;
}

export interface DashboardData {
  stats: DashboardStats;
  commandStats: DashboardCommandStats;
  priorities: DashboardPriorityItem[];
  recentNotes: DashboardRecentNote[];
  pinnedSummary: DashboardPinnedSummary;
  openTasks: DashboardTask[];
  upcomingTasks: DashboardTask[];
  recentReports: DashboardReport[];
  todayPlannerEvents: PlannerEventWithLinks[];
  plannerStats: PlannerStats;
  todayTodoStats: TodayTodoStats;
  financeSummary: FinanceDashboardSummary;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWithCategory extends Task {
  category: Category | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface TaskStats {
  open: number;
  total: number;
  completed: number;
}

export interface Report {
  id: string;
  user_id: string;
  title: string;
  content: string;
  report_type: ReportType;
  status: ReportStatus;
  source_date: string | null;
  period_start: string | null;
  period_end: string | null;
  summary: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportSource {
  id: string;
  user_id: string;
  report_id: string;
  source_type: ReportSourceType;
  source_id: string;
  created_at: string;
}

export interface ReportSourceWithLabel extends ReportSource {
  label: string;
}

export interface ReportWithSources extends Report {
  sources: ReportSourceWithLabel[];
}

export interface CreateReportInput {
  title: string;
  content: string;
  report_type: ReportType;
  status?: ReportStatus;
  source_date?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  summary?: string | null;
  ai_generated?: boolean;
  sources?: Array<{
    source_type: Exclude<ReportSourceType, "manual">;
    source_id: string;
  }>;
}

export type UpdateReportInput = Partial<CreateReportInput>;

export interface ReportsStats {
  total: number;
  aiGenerated: number;
  archived: number;
}

export interface AiReportSourceNote {
  id: string;
  title: string;
  content?: string;
}

export interface AiReportSourceTask {
  id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface AiReportRequest {
  reportType: ReportType;
  title?: string;
  manualText?: string;
  notes?: AiReportSourceNote[];
  tasks?: AiReportSourceTask[];
  periodStart?: string | null;
  periodEnd?: string | null;
}

export type AiReportResponse =
  | {
      success: true;
      provider: AiProvider;
      title: string;
      summary: string;
      content: string;
      reportType: ReportType;
    }
  | {
      success: false;
      error: string;
    };

export interface Note {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  content: string;
  status: "active";
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface NoteImage {
  id: string;
  user_id: string;
  note_id: string;
  bucket: string;
  path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
  signedUrl?: string;
}

export interface CreateNoteImageInput {
  noteId: string;
  file: File;
}

export interface NoteWithRelations extends Note {
  category: Category | null;
  images: NoteImage[];
  tags: Tag[];
}

export interface OpenNoteTab {
  id: string;
  title: string;
}

export type TemplateType =
  | "note"
  | "report"
  | "task"
  | "ai_prompt"
  | "telegram"
  | "operation"
  | "finance"
  | "software"
  | "daily_plan";

export interface TemplateVariable {
  key: string;
  label: string;
  defaultValue?: string;
}

export interface Template {
  id: string;
  user_id?: string | null;
  name: string;
  description?: string | null;
  template_type: TemplateType;
  content: string;
  variables?: TemplateVariable[];
  category_id?: string | null;
  is_system: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string | null;
  template_type: TemplateType;
  content: string;
  variables?: TemplateVariable[];
  category_id?: string | null;
  is_favorite?: boolean;
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;

export interface ManagedCategory extends Category {
  usageCount: number;
  isInbox: boolean;
}

export interface ManagedTag extends Tag {
  usageCount: number;
}

export type SearchResultType =
  | "note"
  | "task"
  | "report"
  | "calendar"
  | "action";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string | null;
  href: string;
  meta?: string | null;
  created_at?: string | null;
}

export interface RecentItem {
  id: string;
  type: Exclude<SearchResultType, "action">;
  title: string;
  href: string;
  openedAt: string;
}

export type AiActionKey =
  | "summarize"
  | "daily_summary"
  | "shorten"
  | "premium"
  | "manager_report";

export type AiProvider = "gemini" | "demo";

export type AppTheme =
  | "command_dark"
  | "midnight_violet"
  | "obsidian_gold"
  | "slate_blue"
  | "executive_light"
  | "emerald_terminal"
  | "cyber_neon"
  | "crimson_ops"
  | "nordic_ice"
  | "graphite_red"
  | "forest_command"
  | "ocean_depth"
  | "royal_indigo"
  | "desert_sand"
  | "coffee_house"
  | "titanium"
  | "matrix_green"
  | "rose_noir"
  | "arctic_light"
  | "paper_pro";

export type AppLanguage = "tr" | "en";

export type AppDensity = "comfortable" | "compact";

export type SidebarMode = "expanded" | "collapsed";

export type DashboardLayout = "default" | "focus" | "compact";

export type AppFontFamily = "inter" | "geist" | "system";

export type DefaultLandingPage =
  | "dashboard"
  | "today"
  | "notes"
  | "finance"
  | "tasks";

export interface UserSettings {
  id: string;
  user_id: string;
  display_name: string | null;
  app_theme: AppTheme;
  language: AppLanguage;
  density: AppDensity;
  sidebar_mode: SidebarMode;
  font_family: AppFontFamily;
  reduce_motion: boolean;
  default_landing_page: DefaultLandingPage;
  notifications_enabled: boolean;
  finance_alerts_enabled: boolean;
  task_alerts_enabled: boolean;
  calendar_alerts_enabled: boolean;
  highlight_critical_alerts: boolean;
  default_currency: "TRY";
  highlight_overdue_debts: boolean;
  critical_debt_threshold: number;
  show_ai_summaries: boolean;
  show_finance_ai_warning: boolean;
  short_ai_response_mode: boolean;
  onboarding_completed: boolean;
  dashboard_layout: DashboardLayout;
  default_note_category_id: string | null;
  default_task_status: TaskStatus;
  default_task_priority: TaskPriority;
  ai_provider: AiProvider;
  ai_default_action: AiActionKey;
  ai_save_history: boolean;
  ai_sensitive_warning: boolean;
  show_dashboard_notes: boolean;
  show_dashboard_tasks: boolean;
  show_dashboard_reports: boolean;
  show_dashboard_ai: boolean;
  show_dashboard_calendar: boolean;
  confirm_before_delete: boolean;
  compact_cards: boolean;
  created_at: string;
  updated_at: string;
}

export type UpdateUserSettingsInput = Partial<
  Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at">
>;

export interface UserDataExport {
  exported_at: string;
  version: string;
  settings: UserSettings;
  notes: unknown[];
  tasks: unknown[];
  reports: unknown[];
  debts: unknown[];
  debt_payments: unknown[];
}

export interface AiActionRequest {
  action: AiActionKey;
  noteId?: string;
  text: string;
  title?: string;
}

export type AiActionResponse =
  | {
      action: AiActionKey;
      output: string;
      provider: AiProvider;
      success: true;
    }
  | {
      action?: AiActionKey;
      error: string;
      provider?: AiProvider;
      success: false;
    };

export interface AiOutputState {
  action: AiActionKey | null;
  error: string | null;
  isLoading: boolean;
  output: string;
  provider: AiProvider | null;
  sourceNoteId: string | null;
  sourceTitle: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  categoryId: string | null;
  tags: string[];
  isPinned: boolean;
}

export interface UpdateNoteInput extends CreateNoteInput {
  id: string;
}

export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}
