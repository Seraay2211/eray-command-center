import "server-only";

import { getIstanbulDateKey, getIstanbulDayRange } from "@/lib/dates/istanbul";
import { createClient } from "@/lib/supabase/server";
import { formatTRY } from "@/lib/utils/currency";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface ProductivityContext {
  today: {
    dateKey: string;
    label: string;
    userLabel: string;
  };
  tasks: {
    active: ProductivityTask[];
    completedRecent: ProductivityTask[];
    overdue: ProductivityTask[];
    today: ProductivityTask[];
    upcoming: ProductivityTask[];
  };
  calendar: {
    today: ProductivityCalendarItem[];
    upcoming: ProductivityCalendarItem[];
  };
  finance: {
    activeDebts: ProductivityDebt[];
    overdueDebts: ProductivityDebt[];
    summary: {
      criticalDebtCount: number;
      overdueDebtCount: number;
      remainingDebt: number;
      dueThisWeek: number;
    };
    recentPayments: ProductivityPayment[];
  };
  installments: {
    dueToday: ProductivityInstallment[];
    overdue: ProductivityInstallment[];
    upcoming: ProductivityInstallment[];
  };
  notes: {
    recent: ProductivityNote[];
    pinned: ProductivityNote[];
    favorites: ProductivityNote[];
  };
  reports: {
    recent: ProductivityReport[];
  };
  risks: string[];
  suggestions: string[];
}

export interface ProductivityTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  href: string;
}

export interface ProductivityCalendarItem {
  id: string;
  title: string;
  description: string;
  startAt: string;
  priority: string;
  href: string;
}

export interface ProductivityDebt {
  id: string;
  title: string;
  creditor: string;
  remainingAmount: number;
  priority: string;
  dueDate: string | null;
  href: string;
}

export interface ProductivityInstallment {
  id: string;
  debtId: string;
  debtTitle: string;
  dueDate: string;
  installmentNo: number;
  remainingAmount: number;
  href: string;
}

export interface ProductivityPayment {
  amount: number;
  date: string;
  method: string | null;
}

export interface ProductivityNote {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  href: string;
}

export interface ProductivityReport {
  id: string;
  title: string;
  summary: string;
  type: string;
  updatedAt: string;
  href: string;
}

function formatTodayLabel(value: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    timeZone: "Europe/Istanbul",
    weekday: "long",
    year: "numeric",
  }).format(value);
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildPreview(value: string | null | undefined, maxLength = 220): string {
  const preview = (value ?? "").replace(/\s+/gu, " ").trim();
  if (!preview) return "İçerik eklenmedi.";
  return preview.length > maxLength
    ? `${preview.slice(0, maxLength - 3).trimEnd()}...`
    : preview;
}

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function getUserContext(supabase: SupabaseServerClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");
  }

  const email = data.user.email ?? "";
  const metadata = data.user.user_metadata;
  const displayName =
    metadata && typeof metadata === "object" && "display_name" in metadata
      ? String(metadata.display_name ?? "").trim()
      : "";

  return {
    userId: data.user.id,
    userLabel: displayName || email.split("@")[0] || email || "Eray",
  };
}

export async function buildProductivityContext(): Promise<ProductivityContext> {
  const supabase = await createClient();
  const { userId, userLabel } = await getUserContext(supabase);
  const now = new Date();
  const dateKey = getIstanbulDateKey(now);
  const { startIso, endIso } = getIstanbulDayRange(now);
  const weekEndIso = addDays(new Date(startIso), 7).toISOString();
  const weekEndKey = getIstanbulDateKey(new Date(weekEndIso));

  const [
    activeTasksResult,
    completedTasksResult,
    calendarTodayResult,
    calendarUpcomingResult,
    debtsResult,
    installmentsResult,
    paymentsResult,
    recentNotesResult,
    pinnedNotesResult,
    favoriteNotesResult,
    reportsResult,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id,title,description,status,priority,due_date")
      .eq("user_id", userId)
      .is("archived_at", null)
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(25),
    supabase
      .from("tasks")
      .select("id,title,description,status,priority,due_date,completed_at")
      .eq("user_id", userId)
      .is("archived_at", null)
      .eq("status", "done")
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(8),
    supabase
      .from("planner_events")
      .select("id,title,description,start_at,priority,status")
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .gte("start_at", startIso)
      .lt("start_at", endIso)
      .order("start_at", { ascending: true })
      .limit(10),
    supabase
      .from("planner_events")
      .select("id,title,description,start_at,priority,status")
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .gte("start_at", endIso)
      .lt("start_at", weekEndIso)
      .order("start_at", { ascending: true })
      .limit(10),
    supabase
      .from("debts")
      .select("id,title,creditor,total_amount,paid_amount,status,priority,due_date")
      .eq("user_id", userId)
      .neq("status", "paid")
      .neq("status", "cancelled")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(25),
    supabase
      .from("debt_installments")
      .select("id,debt_id,installment_no,due_date,expected_amount,paid_amount,status,debt:debts(id,title,priority)")
      .eq("user_id", userId)
      .neq("status", "paid")
      .lt("due_date", weekEndKey)
      .order("due_date", { ascending: true })
      .limit(25),
    supabase
      .from("debt_payments")
      .select("amount,payment_date,method")
      .eq("user_id", userId)
      .order("payment_date", { ascending: false })
      .limit(8),
    supabase
      .from("notes")
      .select("id,title,content,updated_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("notes")
      .select("id,title,content,updated_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("archived_at", null)
      .eq("is_pinned", true)
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("notes")
      .select("id,title,content,updated_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("archived_at", null)
      .eq("is_favorite", true)
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("reports")
      .select("id,title,summary,report_type,updated_at")
      .eq("user_id", userId)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);

  const activeTasks = (activeTasksResult.data ?? []).map((task) => ({
    id: String(task.id),
    title: toText(task.title) || "Görev",
    description: buildPreview(toText(task.description), 180),
    status: toText(task.status) || "todo",
    priority: toText(task.priority) || "medium",
    dueDate: toText(task.due_date) || null,
    href: `/tasks?task=${encodeURIComponent(String(task.id))}`,
  }));
  const completedRecent = (completedTasksResult.data ?? []).map((task) => ({
    id: String(task.id),
    title: toText(task.title) || "Tamamlanan görev",
    description: buildPreview(toText(task.description), 160),
    status: toText(task.status) || "done",
    priority: toText(task.priority) || "medium",
    dueDate: toText(task.due_date) || null,
    href: `/tasks?task=${encodeURIComponent(String(task.id))}`,
  }));
  const overdueTasks = activeTasks.filter(
    (task) => task.dueDate && task.dueDate < startIso,
  );
  const todayTasks = activeTasks.filter(
    (task) => task.dueDate && task.dueDate >= startIso && task.dueDate < endIso,
  );
  const upcomingTasks = activeTasks.filter(
    (task) => task.dueDate && task.dueDate >= endIso && task.dueDate < weekEndIso,
  );
  const calendarToday = (calendarTodayResult.data ?? []).map((event) => ({
    id: String(event.id),
    title: toText(event.title) || "Plan",
    description: buildPreview(toText(event.description), 180),
    startAt: toText(event.start_at),
    priority: toText(event.priority) || "medium",
    href: `/calendar?event=${encodeURIComponent(String(event.id))}`,
  }));
  const calendarUpcoming = (calendarUpcomingResult.data ?? []).map((event) => ({
    id: String(event.id),
    title: toText(event.title) || "Plan",
    description: buildPreview(toText(event.description), 180),
    startAt: toText(event.start_at),
    priority: toText(event.priority) || "medium",
    href: `/calendar?event=${encodeURIComponent(String(event.id))}`,
  }));
  const activeDebts = (debtsResult.data ?? []).map((debt) => {
    const remainingAmount = Math.max(
      toNumber(debt.total_amount) - toNumber(debt.paid_amount),
      0,
    );

    return {
      id: String(debt.id),
      title: toText(debt.title) || "Borç kaydı",
      creditor: toText(debt.creditor),
      remainingAmount,
      priority: toText(debt.priority) || "medium",
      dueDate: toText(debt.due_date) || null,
      href: `/finance?debt=${encodeURIComponent(String(debt.id))}`,
    };
  });
  const overdueDebts = activeDebts.filter(
    (debt) => debt.dueDate && debt.dueDate < dateKey,
  );
  const dueThisWeekDebts = activeDebts.filter(
    (debt) => debt.dueDate && debt.dueDate >= dateKey && debt.dueDate < weekEndKey,
  );
  const installments = (installmentsResult.data ?? []).map((installment) => {
    const rawDebt = Array.isArray(installment.debt)
      ? installment.debt[0]
      : installment.debt;
    const debtTitle =
      rawDebt && typeof rawDebt === "object" && "title" in rawDebt
        ? String(rawDebt.title ?? "Taksit")
        : "Taksit";
    const remainingAmount = Math.max(
      toNumber(installment.expected_amount) - toNumber(installment.paid_amount),
      0,
    );

    return {
      id: String(installment.id),
      debtId: String(installment.debt_id),
      debtTitle,
      dueDate: String(installment.due_date),
      installmentNo: Number(installment.installment_no) || 1,
      remainingAmount,
      href: `/finance?debt=${encodeURIComponent(String(installment.debt_id))}&installment=${encodeURIComponent(String(installment.id))}`,
    };
  });
  const notesMapper = (note: { id: unknown; title: unknown; content?: unknown; updated_at: unknown }) => ({
    id: String(note.id),
    title: toText(note.title) || "Not",
    preview: buildPreview(toText(note.content), 240),
    updatedAt: toText(note.updated_at),
    href: `/notes?note=${encodeURIComponent(String(note.id))}`,
  });
  const reports = (reportsResult.data ?? []).map((report) => ({
    id: String(report.id),
    title: toText(report.title) || "Rapor",
    summary: buildPreview(toText(report.summary), 220),
    type: toText(report.report_type) || "custom",
    updatedAt: toText(report.updated_at),
    href: `/reports?report=${encodeURIComponent(String(report.id))}`,
  }));
  const recentPayments = (paymentsResult.data ?? []).map((payment) => ({
    amount: toNumber(payment.amount),
    date: toText(payment.payment_date),
    method: toText(payment.method) || null,
  }));
  const overdueInstallments = installments.filter(
    (installment) => installment.dueDate < dateKey,
  );
  const dueTodayInstallments = installments.filter(
    (installment) => installment.dueDate === dateKey,
  );
  const upcomingInstallments = installments.filter(
    (installment) =>
      installment.dueDate > dateKey && installment.dueDate < weekEndKey,
  );
  const risks = [
    ...overdueTasks.slice(0, 3).map((task) => `${task.title} görevinin tarihi geçti.`),
    ...overdueDebts
      .slice(0, 3)
      .map(
        (debt) =>
          `${debt.title} vadesi geçti. Kalan ${formatTRY(debt.remainingAmount)}.`,
      ),
    ...overdueInstallments
      .slice(0, 3)
      .map(
        (item) =>
          `${item.debtTitle} ${item.installmentNo}. taksit gecikti. Kalan ${formatTRY(item.remainingAmount)}.`,
      ),
  ].slice(0, 8);
  const suggestions = [
    overdueTasks[0]
      ? `${overdueTasks[0].title} için ilk somut adımı tamamla.`
      : todayTasks[0]
        ? `${todayTasks[0].title} görevini bugün kapatmaya odaklan.`
        : "Bugün için bir ana görev belirle.",
    overdueInstallments[0]
      ? `${overdueInstallments[0].debtTitle} taksit durumunu kontrol et.`
      : dueTodayInstallments[0]
        ? `${dueTodayInstallments[0].debtTitle} ödemesini gün içinde gözden geçir.`
        : "Yaklaşan finans kayıtlarını kısa bir kontrol et.",
    calendarToday[0]
      ? `${calendarToday[0].title} planı için hazırlık durumunu kontrol et.`
      : "Takvimine bir odak bloğu ekle.",
  ];

  return {
    today: {
      dateKey,
      label: formatTodayLabel(now),
      userLabel,
    },
    tasks: {
      active: activeTasks,
      completedRecent,
      overdue: overdueTasks,
      today: todayTasks,
      upcoming: upcomingTasks,
    },
    calendar: {
      today: calendarToday,
      upcoming: calendarUpcoming,
    },
    finance: {
      activeDebts,
      overdueDebts,
      summary: {
        criticalDebtCount: activeDebts.filter((debt) => debt.priority === "critical").length,
        overdueDebtCount: overdueDebts.length,
        remainingDebt: activeDebts.reduce(
          (sum, debt) => sum + debt.remainingAmount,
          0,
        ),
        dueThisWeek: dueThisWeekDebts.length,
      },
      recentPayments,
    },
    installments: {
      dueToday: dueTodayInstallments,
      overdue: overdueInstallments,
      upcoming: upcomingInstallments,
    },
    notes: {
      recent: (recentNotesResult.data ?? []).map(notesMapper),
      pinned: (pinnedNotesResult.data ?? []).map(notesMapper),
      favorites: (favoriteNotesResult.data ?? []).map(notesMapper),
    },
    reports: {
      recent: reports,
    },
    risks,
    suggestions,
  };
}
