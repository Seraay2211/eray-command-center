import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckSquare2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ListChecks,
  ShieldAlert,
  Sunrise,
} from "lucide-react";
import { OpenNotificationsButton } from "@/components/today/open-notifications-button";
import { TodayActions } from "@/components/today/today-actions";
import { Card } from "@/components/ui/card";
import { getTodaySummary } from "@/lib/today/today-summary";
import { formatTRY } from "@/lib/utils/currency";
import type { TodayPrioritySource } from "@/types/today";

export const metadata = {
  title: "Bugün",
};

export const dynamic = "force-dynamic";

const prioritySourceLabels: Record<TodayPrioritySource, string> = {
  finance: "Finans",
  task: "Görev",
  calendar: "Takvim",
  notification: "Bildirim",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Istanbul",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string, allDay = false): string {
  if (allDay) return "Tüm gün";
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function TodayPage() {
  const result = await getTodaySummary();
  const summary = result.data;

  if (!summary) {
    return (
      <Card className="mx-auto max-w-xl p-6 text-center sm:p-8">
        <AlertTriangle className="mx-auto size-8 text-[var(--app-warning)]" />
        <h1 className="app-text mt-4 text-xl font-semibold">
          Bugün verileri alınamadı
        </h1>
        <p className="app-muted mt-2 text-sm">
          {result.error ?? "Lütfen sayfayı yenileyip tekrar dene."}
        </p>
      </Card>
    );
  }

  const summaryCards = [
    {
      label: "Bugün Vadesi Gelen",
      value: summary.counts.financeDueToday,
      detail: "borç kaydı",
      icon: CreditCard,
    },
    {
      label: "Gecikmiş Borç",
      value: summary.counts.financeOverdue,
      detail: "finans kaydı",
      icon: CircleDollarSign,
    },
    {
      label: "Bugünün Görevleri",
      value: summary.counts.tasksDueToday,
      detail: "açık görev",
      icon: CheckSquare2,
    },
    {
      label: "Gecikmiş Görev",
      value: summary.counts.tasksOverdue,
      detail: "aksiyon bekliyor",
      icon: Clock3,
    },
    {
      label: "Bugünün Takvimi",
      value: summary.counts.calendarToday,
      detail: "plan kaydı",
      icon: CalendarDays,
    },
    {
      label: "Okunmamış Bildirim",
      value: summary.counts.unreadNotifications,
      detail: "bildirim",
      icon: Bell,
    },
    {
      label: "Kritik Uyarı",
      value: summary.counts.criticalWarnings,
      detail: "öncelikli kayıt",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="app-card relative overflow-hidden rounded-2xl border p-5 sm:p-7">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-[color-mix(in_srgb,var(--app-primary)_16%,transparent)] blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div>
            <div className="app-primary inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em]">
              <Sunrise className="size-4" />
              Günlük Komuta Merkezi
            </div>
            <h1 className="app-text mt-3 text-3xl font-semibold tracking-[-0.04em]">
              Bugün
            </h1>
            <p className="app-muted mt-2 capitalize">{summary.dateLabel}</p>
            <p className="app-muted mt-3 max-w-2xl text-sm leading-6">
              Finans, görev, takvim ve bildirim kayıtların tek öncelik
              sırasıyla burada birleşir.
            </p>
          </div>
          <TodayActions
            existingNoteId={summary.existingDailyNote?.id ?? null}
          />
        </div>
      </section>

      {summary.moduleErrors.length > 0 ? (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--app-warning)_50%,var(--app-border))] bg-[color-mix(in_srgb,var(--app-warning)_8%,var(--app-surface))] px-4 py-3">
          <p className="app-text text-xs font-medium">
            Bazı bölümler geçici olarak eksik olabilir.
          </p>
          <p className="app-muted mt-1 text-xs">
            {summary.moduleErrors.join(" ")}
          </p>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card className="p-4" key={item.label}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="app-muted text-[10px] font-semibold uppercase tracking-[0.14em]">
                    {item.label}
                  </p>
                  <p className="app-text mt-2 text-2xl font-semibold">
                    {item.value}
                  </p>
                  <p className="app-muted mt-1 text-[11px]">{item.detail}</p>
                </div>
                <span className="app-surface-2 app-primary flex size-9 items-center justify-center rounded-xl">
                  <Icon className="size-4" />
                </span>
              </div>
            </Card>
          );
        })}
      </section>

      <Card className="overflow-hidden">
        <div className="app-border flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
          <div>
            <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.18em]">
              Öncelik Sırası
            </p>
            <h2 className="app-text mt-1 text-base font-semibold">
              İlk neye bakmalısın?
            </h2>
          </div>
          <ListChecks className="app-primary size-5" />
        </div>
        <div className="divide-y divide-[var(--app-border)]">
          {summary.priorities.length > 0 ? (
            summary.priorities.map((item, index) => (
              <Link
                className="group flex items-start gap-3 px-4 py-3 transition hover:bg-[var(--app-surface-2)] sm:px-5"
                href={item.href}
                key={item.id}
              >
                <span className="app-primary-bg mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="app-text text-sm font-medium">
                      {item.title}
                    </span>
                    <span className="app-surface-2 app-muted rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase">
                      {prioritySourceLabels[item.source]}
                    </span>
                  </span>
                  <span className="app-muted mt-1 block text-xs leading-5">
                    {item.reason}
                  </span>
                </span>
                <ArrowRight className="app-muted mt-1 size-4 shrink-0 transition group-hover:translate-x-0.5" />
              </Link>
            ))
          ) : (
            <p className="app-muted px-5 py-8 text-center text-sm">
              Bugün için acil bir öncelik görünmüyor.
            </p>
          )}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="app-border flex items-center justify-between border-b px-4 py-4 sm:px-5">
            <div>
              <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.18em]">
                Finans
              </p>
              <h2 className="app-text mt-1 text-base font-semibold">
                Borç ve Ödeme Takibi
              </h2>
            </div>
            <Link
              className="app-muted text-xs hover:text-[var(--text)]"
              href="/finance"
            >
              Tümünü Aç
            </Link>
          </div>
          <div className="space-y-2 p-4 sm:p-5">
            {[...summary.financeOverdue, ...summary.financeDueToday].length >
            0 ? (
              [...summary.financeOverdue, ...summary.financeDueToday].map(
                (item) => {
                  const isOverdue = summary.financeOverdue.some(
                    (entry) => entry.id === item.id,
                  );
                  return (
                    <Link
                      className="app-surface-2 app-border flex items-center justify-between gap-3 rounded-xl border p-3 transition hover:border-[var(--app-primary)]"
                      href={item.href}
                      key={item.id}
                    >
                      <span className="min-w-0">
                        <span className="app-text block truncate text-sm font-medium">
                          {item.title}
                        </span>
                        <span className="app-muted mt-1 block text-[11px]">
                          {isOverdue ? "Gecikmiş" : "Bugün vadesi geliyor"} ·{" "}
                          {formatTRY(item.remainingAmount)}
                        </span>
                      </span>
                      <ArrowRight className="app-muted size-4 shrink-0" />
                    </Link>
                  );
                },
              )
            ) : (
              <p className="app-muted py-6 text-center text-sm">
                Bugün veya geçmiş vadeli açık borç bulunmuyor.
              </p>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="app-border flex items-center justify-between border-b px-4 py-4 sm:px-5">
            <div>
              <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.18em]">
                Görevler
              </p>
              <h2 className="app-text mt-1 text-base font-semibold">
                Bugünkü Aksiyonlar
              </h2>
            </div>
            <Link
              className="app-muted text-xs hover:text-[var(--text)]"
              href="/tasks"
            >
              Tümünü Aç
            </Link>
          </div>
          <div className="space-y-2 p-4 sm:p-5">
            {[...summary.tasksOverdue, ...summary.tasksDueToday].length > 0 ? (
              [...summary.tasksOverdue, ...summary.tasksDueToday].map((item) => (
                <Link
                  className="app-surface-2 app-border flex items-center justify-between gap-3 rounded-xl border p-3 transition hover:border-[var(--app-primary)]"
                  href={item.href}
                  key={item.id}
                >
                  <span className="min-w-0">
                    <span className="app-text block truncate text-sm font-medium">
                      {item.title}
                    </span>
                    <span className="app-muted mt-1 block text-[11px]">
                      {summary.tasksOverdue.some(
                        (entry) => entry.id === item.id,
                      )
                        ? "Gecikmiş görev"
                        : "Bugün tamamlanmalı"}
                    </span>
                  </span>
                  <ArrowRight className="app-muted size-4 shrink-0" />
                </Link>
              ))
            ) : (
              <p className="app-muted py-6 text-center text-sm">
                Bugün veya geçmiş tarihli açık görev bulunmuyor.
              </p>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="app-border flex items-center justify-between border-b px-4 py-4 sm:px-5">
            <div>
              <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.18em]">
                Takvim
              </p>
              <h2 className="app-text mt-1 text-base font-semibold">
                Bugünün Planı
              </h2>
            </div>
            <Link
              className="app-muted text-xs hover:text-[var(--text)]"
              href="/calendar"
            >
              Takvimi Aç
            </Link>
          </div>
          <div className="space-y-2 p-4 sm:p-5">
            {summary.calendarItems.length > 0 ? (
              summary.calendarItems.map((item) => (
                <Link
                  className="app-surface-2 app-border flex items-center gap-3 rounded-xl border p-3 transition hover:border-[var(--app-primary)]"
                  href={item.href}
                  key={item.id}
                >
                  <span className="app-primary min-w-14 text-xs font-semibold">
                    {formatTime(item.startAt, item.allDay)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="app-text block truncate text-sm font-medium">
                      {item.title}
                    </span>
                    {item.description ? (
                      <span className="app-muted mt-1 block truncate text-[11px]">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))
            ) : (
              <p className="app-muted py-6 text-center text-sm">
                Bugün için takvim kaydı bulunmuyor.
              </p>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="app-border flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
            <div>
              <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.18em]">
                Bildirimler
              </p>
              <h2 className="app-text mt-1 text-base font-semibold">
                Okunmamış Uyarılar
              </h2>
            </div>
            <OpenNotificationsButton />
          </div>
          <div className="space-y-2 p-4 sm:p-5">
            {summary.unreadNotifications.length > 0 ? (
              summary.unreadNotifications.slice(0, 8).map((item) => (
                <Link
                  className="app-surface-2 app-border block rounded-xl border p-3 transition hover:border-[var(--app-primary)]"
                  href={item.action_url ?? "/dashboard"}
                  key={item.id}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="app-text truncate text-sm font-medium">
                      {item.title}
                    </span>
                    <span className="app-muted shrink-0 text-[10px]">
                      {formatDate(item.created_at)}
                    </span>
                  </span>
                  <span className="app-muted mt-1 block line-clamp-2 text-[11px] leading-5">
                    {item.message}
                  </span>
                </Link>
              ))
            ) : (
              <p className="app-muted py-6 text-center text-sm">
                Okunmamış bildirim bulunmuyor.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
