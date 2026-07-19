import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  CheckSquare2,
  CircleDollarSign,
  FilePenLine,
  Gauge,
  ListChecks,
  ShieldAlert,
} from "lucide-react";
import { AiDailyPlan } from "@/components/dashboard/ai-daily-plan";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MASKED_TRY_VALUE } from "@/lib/privacy";
import type {
  DashboardCommandStats,
  DashboardPriorityItem,
  FinanceDashboardSummary,
} from "@/types";

interface CommandSummaryCardProps {
  financeSummary: FinanceDashboardSummary;
  isPrivacyEnabled: boolean;
  openTasksCount: number;
  priorities: DashboardPriorityItem[];
  stats: DashboardCommandStats;
}

const sourceConfig = {
  finance: { icon: CircleDollarSign, label: "Finans" },
  task: { icon: CheckSquare2, label: "Görev" },
  calendar: { icon: CalendarDays, label: "Takvim" },
} as const;

function clampScore(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

function maskFinanceAmount(value: string, shouldMask: boolean): string {
  return shouldMask ? value.replace(/₺[\d.,]+/g, MASKED_TRY_VALUE) : value;
}

export function CommandSummaryCard({
  financeSummary,
  isPrivacyEnabled,
  openTasksCount,
  priorities,
  stats,
}: CommandSummaryCardProps) {
  const overdueFinanceCount =
    stats.overdueDebts + financeSummary.overdueInstallmentCount;
  const dueTodayFinanceCount = financeSummary.dueTodayInstallmentCount;
  const score = clampScore(
    100 -
      stats.overdueTasks * 8 -
      overdueFinanceCount * 12 -
      dueTodayFinanceCount * 6 -
      Math.max(openTasksCount - 5, 0) * 2,
  );
  const financeStatus =
    overdueFinanceCount > 0 || stats.criticalDebts > 0
      ? "Kritik"
      : dueTodayFinanceCount > 0 || stats.dueThisWeekDebts > 0
        ? "Dikkat"
        : "Rahat";
  const taskStatus =
    stats.overdueTasks >= 3 || openTasksCount >= 10
      ? "Sıkışık"
      : stats.overdueTasks > 0 || stats.todayTasks >= 3 || openTasksCount >= 5
        ? "Yoğun"
        : "Sakin";
  const financeAlert =
    overdueFinanceCount > 0
      ? "Gecikmiş ödeme bulunuyor, finans bölümünü kontrol et."
      : dueTodayFinanceCount > 0
        ? `Bugün ödenmesi gereken ${dueTodayFinanceCount} kayıt var.`
        : stats.dueThisWeekDebts > 0
          ? `Bu hafta takip edilmesi gereken ${stats.dueThisWeekDebts} ödeme var.`
          : "Bugün ödeme baskısı yok.";
  const taskPressure =
    stats.overdueTasks > 0
      ? "Geciken görevler birikmiş. Önce en eski kaydı kapat."
      : stats.todayTasks > 0
        ? "Bugün tamamlanması gereken görevler var."
        : "Bugün sakin görünüyor.";
  const focusItems = priorities.slice(0, 3);
  const mainFocus = focusItems[0]?.title ?? "Bugün için net bir odak seç.";

  return (
    <Card className="relative overflow-hidden rounded-[1.75rem] border-[color-mix(in_srgb,var(--primary)_24%,var(--border))] p-4 shadow-xl shadow-[color-mix(in_srgb,var(--primary)_7%,transparent)] sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--primary)_44%,transparent),transparent)]" />

      <div className="relative space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="app-primary-bg flex size-11 shrink-0 items-center justify-center rounded-2xl">
              <ShieldAlert className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.16em]">
                Günlük Kontrol
              </p>
              <h2 className="app-text mt-1 text-xl font-semibold">
                Günlük Komuta
              </h2>
              <p className="app-muted mt-1 text-xs leading-5">
                Bugün dikkat etmen gereken işleri tek bakışta gör.
              </p>
            </div>
          </div>

          <div className="app-surface-2 app-border flex w-full items-center gap-4 rounded-2xl border p-3 lg:w-auto lg:min-w-60">
            <span className="app-primary-bg flex size-11 shrink-0 items-center justify-center rounded-xl">
              <Gauge className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="app-muted text-[10px] font-medium">
                  Bugünün skoru
                </span>
                <strong className="app-text text-xl">{score}</strong>
              </div>
              <div className="app-surface mt-2 h-1.5 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-[width]"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="app-surface-2 rounded-2xl border p-3">
            <p className="app-muted text-[10px]">Finans durumu</p>
            <p className="app-text mt-1 text-sm font-semibold">{financeStatus}</p>
          </div>
          <div className="app-surface-2 rounded-2xl border p-3">
            <p className="app-muted text-[10px]">Görev durumu</p>
            <p className="app-text mt-1 text-sm font-semibold">{taskStatus}</p>
          </div>
          <div className="app-surface-2 min-w-0 rounded-2xl border p-3">
            <p className="app-muted text-[10px]">Bugünün ana odağı</p>
            <p className="app-text mt-1 truncate text-sm font-semibold">
              {mainFocus}
            </p>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="app-surface-2 rounded-2xl border p-3.5 sm:p-4">
            <div className="flex items-center gap-2">
              <ListChecks className="app-primary size-4" />
              <h3 className="app-text text-sm font-semibold">Bugünün Odakları</h3>
            </div>
            {focusItems.length > 0 ? (
              <div className="mt-3 space-y-2">
                {focusItems.map((item) => {
                  const config = sourceConfig[item.source];
                  const Icon = config.icon;
                  return (
                    <Link
                      className="app-surface group flex min-w-0 items-start gap-3 rounded-xl border p-3 transition hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]"
                      href={item.href}
                      key={item.id}
                    >
                      <Icon className="app-primary mt-0.5 size-4 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="app-primary text-[9px] font-semibold uppercase tracking-[0.12em]">
                          {config.label}
                        </span>
                        <span className="app-text mt-0.5 block truncate text-xs font-semibold">
                          {item.title}
                        </span>
                        <span className="app-muted mt-1 block line-clamp-1 text-[10px]">
                          {maskFinanceAmount(
                            item.description,
                            isPrivacyEnabled && item.source === "finance",
                          )}
                        </span>
                      </span>
                      <span className="app-muted flex shrink-0 items-center gap-1 text-[10px] font-medium group-hover:text-[var(--primary)]">
                        İncele
                        <ArrowUpRight className="size-3" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="app-surface mt-3 rounded-xl border border-dashed p-4 text-center">
                <p className="app-text text-xs font-semibold">
                  Bugün için net bir odak seç.
                </p>
                <p className="app-muted mt-1 text-[10px] leading-5">
                  Yeni görev veya plan ekleyerek günün yönünü belirleyebilirsin.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Link
              className="app-surface-2 block rounded-2xl border p-3.5 transition hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]"
              href="/finance"
            >
              <p className="app-primary text-[10px] font-semibold">Finans Uyarısı</p>
              <p className="app-text mt-1 text-xs leading-5">{financeAlert}</p>
            </Link>
            <Link
              className="app-surface-2 block rounded-2xl border p-3.5 transition hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]"
              href="/tasks"
            >
              <p className="app-primary text-[10px] font-semibold">Görev Baskısı</p>
              <p className="app-text mt-1 text-xs leading-5">{taskPressure}</p>
            </Link>
          </div>
        </div>

        <div className="app-surface-2 rounded-2xl border p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Bot className="app-primary mt-0.5 size-4 shrink-0" />
              <div>
                <p className="app-text text-sm font-semibold">Günü netleştir</p>
                <p className="app-muted mt-1 text-xs leading-5">
                  Kısa bir yorum oluştur veya günün notunu yazmaya başla.
                </p>
              </div>
            </div>
            <Link
              className={buttonClassName({
                className: "w-full shrink-0 sm:w-auto",
                size: "sm",
                variant: "secondary",
              })}
              href="/ai?action=daily_summary"
            >
              <FilePenLine className="size-4" />
              Gün Sonu Notu Yaz
            </Link>
          </div>
          <AiDailyPlan />
        </div>
      </div>
    </Card>
  );
}
