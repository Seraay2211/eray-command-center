"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BellRing,
  CalendarDays,
  CheckSquare2,
  CircleDollarSign,
  FileText,
} from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import type { DashboardData } from "@/types";

type ReminderPriority = "critical" | "important" | "normal";
type ReminderType = "calendar" | "finance" | "note" | "task";

interface DashboardReminder {
  actionHref: string;
  actionLabel: string;
  description: string;
  id: string;
  priority: ReminderPriority;
  rank: number;
  title: string;
  type: ReminderType;
}

interface NotificationsPreviewCardProps {
  dashboard: DashboardData;
  todayDateKey: string;
}

const reminderMeta: Record<
  ReminderType,
  { icon: typeof Bell; label: string }
> = {
  calendar: { icon: CalendarDays, label: "Takvim" },
  finance: { icon: CircleDollarSign, label: "Finans" },
  note: { icon: FileText, label: "Not" },
  task: { icon: CheckSquare2, label: "Görev" },
};

const priorityLabels: Record<ReminderPriority, string> = {
  critical: "Kritik",
  important: "Önemli",
  normal: "Normal",
};

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00+03:00`);
  return getIstanbulDateKey(new Date(date.getTime() + days * 86_400_000));
}

function buildDashboardReminders(
  dashboard: DashboardData,
  today: string,
): DashboardReminder[] {
  const reminders: DashboardReminder[] = [];
  const threeDaysLater = addDays(today, 3);
  const finance = dashboard.financeSummary;
  const financeOverdue =
    dashboard.commandStats.overdueDebts + finance.overdueInstallmentCount;
  const financeDueToday =
    finance.dueTodayInstallmentCount +
    finance.upcomingDebts.filter((debt) => debt.dueDate === today).length;
  const approachingDebtIds = new Set([
    ...finance.upcomingInstallments
      .filter(
        (installment) =>
          installment.dueDate > today && installment.dueDate <= threeDaysLater,
      )
      .map((installment) => installment.debtId),
    ...finance.upcomingDebts
      .filter(
        (debt) =>
          Boolean(debt.dueDate) &&
          debt.dueDate! > today &&
          debt.dueDate! <= threeDaysLater,
      )
      .map((debt) => debt.id),
  ]);
  const weeklyFinanceCount = Math.max(
    finance.dueThisWeekCount,
    finance.upcomingInstallments.filter(
      (installment) => installment.dueDate >= today,
    ).length,
  );

  if (financeOverdue > 0) {
    reminders.push({
      actionHref: "/finance",
      actionLabel: "İncele",
      description: "Geciken ödeme kayıtlarını kontrol etmen gerekiyor.",
      id: "finance-overdue",
      priority: "critical",
      rank: 1,
      title: "Geciken ödeme var",
      type: "finance",
    });
  }

  if (financeDueToday > 0) {
    reminders.push({
      actionHref: "/finance",
      actionLabel: "İncele",
      description: "Bugünkü ödeme planını gözden geçir.",
      id: "finance-today",
      priority: "important",
      rank: 2,
      title: "Bugün ödeme günü",
      type: "finance",
    });
  }

  if (approachingDebtIds.size > 0) {
    reminders.push({
      actionHref: "/finance",
      actionLabel: "Aç",
      description: "Önümüzdeki üç gün içinde ödeme kaydı bulunuyor.",
      id: "finance-approaching",
      priority: "important",
      rank: 3,
      title: "Yaklaşan ödeme var",
      type: "finance",
    });
  }

  if (dashboard.commandStats.overdueTasks > 0) {
    reminders.push({
      actionHref: "/tasks",
      actionLabel: "İncele",
      description: `${dashboard.commandStats.overdueTasks} görevin son tarihi geçti.`,
      id: "task-overdue",
      priority: "important",
      rank: 4,
      title: "Geciken görev var",
      type: "task",
    });
  }

  if (dashboard.commandStats.todayTasks > 0) {
    reminders.push({
      actionHref: "/tasks",
      actionLabel: "Aç",
      description: `Bugün tamamlanması gereken ${dashboard.commandStats.todayTasks} görev var.`,
      id: "task-today",
      priority: "important",
      rank: 5,
      title: "Bugün tamamlanacak görev var",
      type: "task",
    });
  }

  if (dashboard.stats.openTasks >= 8) {
    reminders.push({
      actionHref: "/tasks",
      actionLabel: "İncele",
      description: "Açık görevlerini öncelik sırasına koymak işini kolaylaştırabilir.",
      id: "task-pressure",
      priority: "normal",
      rank: 6,
      title: "Görev baskısı artıyor",
      type: "task",
    });
  }

  if (dashboard.commandStats.todayCalendar > 0) {
    reminders.push({
      actionHref: "/calendar",
      actionLabel: "Aç",
      description: `Bugün takvimde ${dashboard.commandStats.todayCalendar} planlı kayıt var.`,
      id: "calendar-today",
      priority: "normal",
      rank: 7,
      title: "Bugün planlı kayıt var",
      type: "calendar",
    });
  }

  if (dashboard.stats.todayNotes === 0) {
    reminders.push({
      actionHref: "/notes?editor=new",
      actionLabel: "Gün Sonu Notu Yaz",
      description: "Bugünü kısa bir notla kapatabilirsin.",
      id: "note-daily",
      priority: "normal",
      rank: 8,
      title: "Gün sonu notunu unutma",
      type: "note",
    });
  }

  if (weeklyFinanceCount >= 3) {
    reminders.push({
      actionHref: "/finance",
      actionLabel: "İncele",
      description: "Bu haftaki ödeme planını topluca gözden geçir.",
      id: "finance-weekly-pressure",
      priority: "normal",
      rank: 9,
      title: "Bu hafta ödeme yoğunluğu var",
      type: "finance",
    });
  }

  return reminders.sort((left, right) => left.rank - right.rank).slice(0, 4);
}

function priorityClass(priority: ReminderPriority): string {
  if (priority === "critical") {
    return "border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] text-[var(--danger)]";
  }

  if (priority === "important") {
    return "border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] text-[var(--warning)]";
  }

  return "app-border app-muted";
}

export function NotificationsPreviewCard({
  dashboard,
  todayDateKey,
}: NotificationsPreviewCardProps) {
  const reminders = buildDashboardReminders(dashboard, todayDateKey);

  return (
    <Card className="h-full min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="app-primary-bg flex size-10 shrink-0 items-center justify-center rounded-xl">
            <BellRing className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
              Günlük Kontrol
            </p>
            <h2 className="app-text mt-1 text-base font-semibold">
              Bugünün Hatırlatmaları
            </h2>
            <p className="app-muted mt-1 text-[11px] leading-5">
              Öncelikli işleri kaçırmamak için kısa kontrol listesi.
            </p>
          </div>
        </div>
        <span className="app-surface-2 app-muted shrink-0 rounded-full border px-2.5 py-1 text-[10px]">
          {reminders.length}
        </span>
      </div>

      {reminders.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {reminders.map((reminder) => {
            const meta = reminderMeta[reminder.type];
            const Icon = meta.icon;

            return (
              <article
                className="app-surface-2 min-w-0 rounded-xl border p-3"
                key={reminder.id}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="app-primary inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.1em]">
                    <Icon className="size-3" />
                    {meta.label}
                  </span>
                  <span
                    className={`rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${priorityClass(reminder.priority)}`}
                  >
                    {priorityLabels[reminder.priority]}
                  </span>
                </div>
                <h3 className="app-text mt-2 text-xs font-semibold leading-5">
                  {reminder.title}
                </h3>
                <p className="app-muted mt-1 text-[11px] leading-5">
                  {reminder.description}
                </p>
                <Link
                  className="app-primary mt-3 inline-flex items-center gap-1 text-[10px] font-semibold"
                  href={reminder.actionHref}
                >
                  {reminder.actionLabel}
                  <ArrowRight className="size-3" />
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="app-surface-2 mt-4 rounded-xl border border-dashed p-5 text-center">
          <Bell className="app-muted mx-auto size-5" />
          <p className="app-text mt-3 text-sm font-semibold">
            Bugün için kritik bir hatırlatma görünmüyor
          </p>
        </div>
      )}

      <button
        className={buttonClassName({
          className: "mt-4 w-full justify-between",
          variant: "secondary",
        })}
        onClick={() => {
          window.dispatchEvent(new Event("ecc:open-notifications"));
        }}
        type="button"
      >
        Bildirim Merkezini Aç
        <ArrowRight className="size-3.5" />
      </button>
    </Card>
  );
}
