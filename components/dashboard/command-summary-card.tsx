import {
  AlertTriangle,
  CalendarDays,
  CheckSquare2,
  ClockAlert,
  CreditCard,
  ShieldAlert,
} from "lucide-react";
import { AiDailyPlan } from "@/components/dashboard/ai-daily-plan";
import { Card } from "@/components/ui/card";
import type { DashboardCommandStats } from "@/types";

interface CommandSummaryCardProps {
  stats: DashboardCommandStats;
}

export function CommandSummaryCard({ stats }: CommandSummaryCardProps) {
  const hasActivity =
    stats.todayTasks > 0 ||
    stats.overdueTasks > 0 ||
    stats.todayCalendar > 0 ||
    stats.dueThisWeekDebts > 0;
  const summary = hasActivity
    ? `Bugün ${stats.todayTasks} görevin, ${stats.todayCalendar} takvim kaydın ve bu hafta yaklaşan ${stats.dueThisWeekDebts} ödemen var.`
    : "Bugün için yoğun bir kayıt görünmüyor. Yeni görev veya not ekleyerek günü planlayabilirsin.";
  const metrics = [
    {
      icon: CheckSquare2,
      label: "Bugünkü Görev",
      value: stats.todayTasks,
    },
    {
      icon: ClockAlert,
      label: "Geciken Görev",
      value: stats.overdueTasks,
    },
    {
      icon: CalendarDays,
      label: "Takvim Kaydı",
      value: stats.todayCalendar,
    },
    {
      icon: CreditCard,
      label: "Bu Hafta Ödeme",
      value: stats.dueThisWeekDebts,
    },
  ];

  return (
    <Card className="relative overflow-hidden p-5 sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="app-primary-bg flex size-10 items-center justify-center rounded-xl">
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.16em]">
                  Günlük Kontrol
                </p>
                <h2 className="app-text mt-1 text-xl font-semibold">
                  Bugünün Komuta Özeti
                </h2>
              </div>
            </div>
            <p className="app-muted mt-4 text-sm leading-6">{summary}</p>
          </div>

          {stats.criticalDebts > 0 || stats.overdueDebts > 0 ? (
            <div className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] p-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-[var(--danger)]">
                <AlertTriangle className="size-4" />
                Finans Uyarısı
              </p>
              <p className="app-muted mt-1 text-[11px] leading-5">
                {stats.overdueDebts} geciken, {stats.criticalDebts} kritik borç
                kaydı bulunuyor.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                className="app-surface-2 rounded-xl border p-3"
                key={metric.label}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="app-muted text-[10px] font-medium">
                    {metric.label}
                  </span>
                  <Icon className="app-primary size-3.5" />
                </div>
                <p className="app-text mt-2 text-xl font-semibold">
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>

        <AiDailyPlan />
      </div>
    </Card>
  );
}
