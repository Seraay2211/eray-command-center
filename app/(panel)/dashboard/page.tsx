import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  CheckSquare2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  Pin,
  Plus,
  Sparkles,
  Sunrise,
} from "lucide-react";
import { CommandSummaryCard } from "@/components/dashboard/command-summary-card";
import { DashboardErrorState } from "@/components/dashboard/dashboard-error-state";
import { DashboardPersonalizedArea } from "@/components/dashboard/dashboard-personalized-area";
import { DashboardWidgetSection } from "@/components/dashboard/dashboard-widget-section";
import { DailyJournalShortcut } from "@/components/dashboard/daily-journal-shortcut";
import { FinanceRadar } from "@/components/dashboard/finance-radar";
import { NotificationsPreviewCard } from "@/components/dashboard/notifications-preview-card";
import { PriorityList } from "@/components/dashboard/priority-list";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { QuickCaptureCard } from "@/components/dashboard/quick-capture-card";
import { RecentNoteCard } from "@/components/dashboard/recent-note-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskItem } from "@/components/dashboard/task-item";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { InstallHintCard } from "@/components/pwa/install-hint-card";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getAiProviderDescription,
  getAiProviderLabel,
  resolveAiProvider,
} from "@/lib/ai/config";
import { aiCommands, quickActions } from "@/lib/mock-data";
import { REPORT_TYPE_LABELS } from "@/lib/reports";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { generateFinanceAlerts } from "@/lib/notifications/finance-alerts";
import { getDashboardData } from "@/services/dashboard-service";
import { getNotifications } from "@/services/notifications-service";
import { getUserSettings } from "@/services/settings-service";
import type { DashboardStats, StatItem } from "@/types";

export const metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

function getDateLabel(): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
    weekday: "long",
    year: "numeric",
  }).format(new Date());
}

function getGreeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Europe/Istanbul",
    }).format(new Date()),
  );

  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

function buildStatItems(
  stats: DashboardStats,
  aiProviderLabel: string,
  aiProviderDescription: string,
): StatItem[] {
  return [
    {
      title: "Toplam Not",
      value: String(stats.totalNotes),
      description: "Aktif çalışma kayıtları",
      icon: FileText,
      trend: stats.todayNotes > 0 ? `${stats.todayNotes} bugün` : undefined,
    },
    {
      title: "Açık Görev",
      value: String(stats.openTasks),
      description: "Tamamlanmayı bekleyen işler",
      icon: ClipboardList,
    },
    {
      title: "Bugünkü Kayıt",
      value: String(stats.todayNotes),
      description: "Bugün oluşturulan notlar",
      icon: FileText,
    },
    {
      title: "AI Modu",
      value: aiProviderLabel,
      description: aiProviderDescription,
      icon: Sparkles,
    },
  ];
}

export default async function DashboardPage() {
  const [
    dashboardResult,
    settingsResult,
    financeAlertsResult,
    notificationsResult,
  ] = await Promise.all([
    getDashboardData(),
    getUserSettings(),
    generateFinanceAlerts(),
    getNotifications(6),
  ]);
  void financeAlertsResult;
  const dashboard = dashboardResult.data;

  if (!dashboard) {
    return (
      <DashboardErrorState
        message={dashboardResult.error ?? "Lütfen bağlantını kontrol edip tekrar dene."}
      />
    );
  }

  const aiProvider = resolveAiProvider();
  const aiProviderLabel = getAiProviderLabel(aiProvider);
  const displayName = settingsResult.data?.display_name?.trim() || "Eray";
  const stats = buildStatItems(
    dashboard.stats,
    aiProviderLabel,
    getAiProviderDescription(aiProvider),
  );
  const isSupabaseConfigured = hasSupabaseEnv();
  const databaseStatus = isSupabaseConfigured ? "Bağlı" : "Bağlantı bekleniyor";
  const showTechnicalStatus = process.env.NODE_ENV === "development";

  return (
    <div className="space-y-6 sm:space-y-8" data-dashboard-root>
      <header className="app-card relative overflow-hidden rounded-2xl border p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="app-primary mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
              <Sunrise className="size-4" />
              {getDateLabel()}
            </div>
            <h1 className="app-text text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {getGreeting()}, {displayName}
            </h1>
            <p className="app-muted mt-3 max-w-xl text-sm leading-6">
              Günün görevlerini, planlarını ve finans risklerini tek ekrandan
              kontrol et.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Link
              className={buttonClassName({
                className: "w-full",
                variant: "secondary",
              })}
              href="/notes?quick=1"
            >
              <Plus className="size-4" />
              Hızlı Kayıt
            </Link>
            <Link
              className={buttonClassName({
                className: "w-full",
                variant: "secondary",
              })}
              href="/tasks?new=1"
            >
              <Plus className="size-4" />
              Yeni Görev
            </Link>
            <Link
              className={buttonClassName({ className: "w-full" })}
              href="/calendar?new=1"
            >
              <Plus className="size-4" />
              Yeni Plan
            </Link>
          </div>
        </div>
      </header>

      <OnboardingCard
        checklist={{
          hasDashboardPreferences: Boolean(
            settingsResult.data?.dashboard_preferences,
          ),
          hasFinance:
            dashboard.financeSummary.remainingDebt > 0 ||
            dashboard.financeSummary.lastPayment !== null ||
            dashboard.financeSummary.upcomingDebts.length > 0,
          hasNotes: dashboard.stats.totalNotes > 0,
          hasTasks:
            dashboard.stats.openTasks > 0 ||
            dashboard.commandStats.todayTasks > 0 ||
            dashboard.commandStats.overdueTasks > 0,
          hasThemeChoice:
            Boolean(settingsResult.data?.app_theme) &&
            settingsResult.data?.app_theme !== "command_dark",
        }}
      />
      <InstallHintCard />
      <DashboardPersonalizedArea>
        <DashboardWidgetSection widgetId="command_summary">
          <CommandSummaryCard stats={dashboard.commandStats} />
        </DashboardWidgetSection>

        <DashboardWidgetSection widgetId="overview_stats">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <div
                data-dashboard-section={
                  item.title === "AI Modu" ? "ai" : undefined
                }
                key={item.title}
              >
                <StatCard item={item} />
              </div>
            ))}
          </section>
        </DashboardWidgetSection>

        <DashboardWidgetSection widgetId="priority_finance">
          <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <PriorityList items={dashboard.priorities} />
            <FinanceRadar summary={dashboard.financeSummary} />
          </section>
        </DashboardWidgetSection>

        <DashboardWidgetSection widgetId="daily_flow">
          <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="p-4 sm:p-5" data-dashboard-section="calendar">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="app-primary-bg flex size-9 items-center justify-center rounded-xl">
                <CalendarDays className="size-4" />
              </span>
              <div>
                <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
                  Günlük Akış
                </p>
                <h2 className="app-text mt-1 text-base font-semibold">
                  Bugünkü Plan
                </h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="app-surface-2 app-muted rounded-full border px-2.5 py-1 text-[10px]">
                {dashboard.todayPlannerEvents.length} plan
              </span>
              <span className="app-surface-2 app-muted rounded-full border px-2.5 py-1 text-[10px]">
                {dashboard.todayTodoStats.pending} To-Do
              </span>
            </div>
          </div>

          {dashboard.todayPlannerEvents.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {dashboard.todayPlannerEvents.map((event) => (
                <Link
                  className="app-surface-2 rounded-xl border p-3 transition hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]"
                  href={`/calendar?event=${encodeURIComponent(event.id)}`}
                  key={event.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="app-primary text-[10px] font-semibold">
                      {event.all_day
                        ? "Tüm gün"
                        : new Intl.DateTimeFormat("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Europe/Istanbul",
                          }).format(new Date(event.start_at))}
                    </span>
                    <span className="app-muted text-[9px]">
                      {event.status === "done"
                        ? "Tamamlandı"
                        : event.status === "in_progress"
                          ? "Devam ediyor"
                          : "Planlandı"}
                    </span>
                  </div>
                  <p className="app-text mt-2 line-clamp-2 text-xs font-semibold">
                    {event.title}
                  </p>
                  <p className="app-muted mt-1 line-clamp-2 text-[11px] leading-5">
                    {event.description?.trim() || "Açıklama eklenmedi."}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="app-surface-2 mt-4 rounded-xl border border-dashed p-5">
              <p className="app-text text-sm font-semibold">
                Bugün için plan yok
              </p>
              <p className="app-muted mt-1 text-xs leading-5">
                Gününe bir toplantı, odak bloğu veya hatırlatma ekleyebilirsin.
              </p>
            </div>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href="/calendar?todo=1"
            >
              <CheckSquare2 className="size-4" />
              Yeni To-Do
            </Link>
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href="/calendar?new=1"
            >
              <Plus className="size-4" />
              Yeni Plan
            </Link>
          </div>
        </Card>

            <QuickCaptureCard />
          </section>
        </DashboardWidgetSection>

        <DashboardWidgetSection widgetId="daily_journal">
          <DailyJournalShortcut />
        </DashboardWidgetSection>

        <DashboardWidgetSection widgetId="notifications">
          <NotificationsPreviewCard
            notifications={notificationsResult.data ?? []}
          />
        </DashboardWidgetSection>

        <DashboardWidgetSection widgetId="quick_actions">
          <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.16em]">
              Kısayollar
            </p>
            <h2 className="app-text mt-1 text-base font-semibold">
              Hızlı İşlemler
            </h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <QuickActionCard action={action} key={action.title} />
          ))}
        </div>
          </section>
        </DashboardWidgetSection>

        <DashboardWidgetSection widgetId="activity">
          <section className="grid gap-6 xl:grid-cols-3">
        <Card className="p-4 sm:p-5" data-dashboard-section="notes">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
                Kayıtlar
              </p>
              <h2 className="app-text mt-1 text-base font-semibold">
                Son Notlar
              </h2>
            </div>
            <Link className="app-primary text-xs font-medium" href="/notes">
              Tümünü gör
            </Link>
          </div>
          <div className="mt-3">
            {dashboard.recentNotes.length > 0 ? (
              dashboard.recentNotes.map((note) => (
                <RecentNoteCard key={note.id} note={note} />
              ))
            ) : (
              <div className="app-surface-2 rounded-xl border border-dashed p-5">
                <p className="app-text text-sm font-semibold">Henüz not yok</p>
                <p className="app-muted mt-1 text-xs leading-5">
                  İlk notunu oluşturduğunda son kayıtların burada görünecek.
                </p>
                <Link
                  className={buttonClassName({
                    className: "mt-4",
                    size: "sm",
                    variant: "secondary",
                  })}
                  href="/notes?editor=new"
                >
                  İlk Notu Oluştur
                </Link>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-5" data-dashboard-section="tasks">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
                Operasyon
              </p>
              <h2 className="app-text mt-1 text-base font-semibold">
                Açık Görevler
              </h2>
            </div>
            <span className="app-surface-2 app-muted rounded-full border px-2.5 py-1 text-[10px]">
              {dashboard.stats.openTasks} açık
            </span>
          </div>
          <div className="mt-3">
            {dashboard.openTasks.length > 0 ? (
              dashboard.openTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))
            ) : (
              <div className="app-surface-2 rounded-xl border border-dashed p-5">
                <p className="app-text text-sm font-semibold">
                  Açık görev bulunmuyor
                </p>
                <p className="app-muted mt-1 text-xs leading-5">
                  Yeni görev ekleyerek günlük iş akışını planla.
                </p>
              </div>
            )}
          </div>
          {dashboard.upcomingTasks.length > 0 ? (
            <p className="app-muted mt-3 flex items-center gap-2 text-[10px]">
              <Clock3 className="size-3.5" />
              Önümüzdeki 7 günde {dashboard.commandStats.upcomingTasks} görev var.
            </p>
          ) : null}
          <Link
            className={buttonClassName({
              className: "mt-4 w-full",
              size: "sm",
              variant: "secondary",
            })}
            href="/tasks"
          >
            Görev Panosuna Git
          </Link>
        </Card>

        <Card className="p-4 sm:p-5" data-dashboard-section="reports">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
                Analiz
              </p>
              <h2 className="app-text mt-1 text-base font-semibold">
                Son Raporlar
              </h2>
            </div>
            <BarChart3 className="app-primary size-4" />
          </div>
          {dashboard.recentReports.length > 0 ? (
            <div className="mt-4 space-y-2">
              {dashboard.recentReports.map((report) => (
                <Link
                  className="app-surface-2 block rounded-xl border p-3 transition hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]"
                  href={`/reports?report=${encodeURIComponent(report.id)}`}
                  key={report.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="app-primary text-[9px] font-semibold uppercase">
                      {REPORT_TYPE_LABELS[report.reportType]}
                    </span>
                    <span className="app-muted text-[9px]">{report.date}</span>
                  </div>
                  <p className="app-text mt-2 line-clamp-2 text-xs font-semibold">
                    {report.title}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="app-surface-2 mt-4 rounded-xl border border-dashed p-5">
              <p className="app-text text-sm font-semibold">Henüz rapor yok</p>
              <p className="app-muted mt-1 text-xs leading-5">
                Günlük verilerinden ilk raporunu oluşturabilirsin.
              </p>
              <Link
                className={buttonClassName({
                  className: "mt-4",
                  size: "sm",
                  variant: "secondary",
                })}
                href="/reports?new=ai&type=daily"
              >
                <Sparkles className="size-3.5" />
                AI Raporu Oluştur
              </Link>
            </div>
          )}
        </Card>
          </section>
        </DashboardWidgetSection>

        <DashboardWidgetSection widgetId="focus_tools">
          <section
            className={
              showTechnicalStatus
                ? "grid gap-4 md:grid-cols-3"
                : "grid gap-4 md:grid-cols-2"
            }
          >
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <Pin className="app-primary size-4" />
                <span className="app-muted font-mono text-[10px]">
                  {dashboard.pinnedSummary.count} sabitli
                </span>
              </div>
              <h2 className="app-text mt-4 text-sm font-semibold">
                {dashboard.pinnedSummary.latestNote?.title ??
                  "Henüz sabitlenen not yok"}
              </h2>
              <p className="app-muted mt-2 line-clamp-3 text-xs leading-5">
                {dashboard.pinnedSummary.latestNote?.preview ??
                  "Önemli bir notu sabitleyerek odak kartını kullanabilirsin."}
              </p>
              <Link
                className="app-primary mt-4 inline-flex text-xs font-medium"
                href="/notes"
              >
                Notlara Git
              </Link>
            </Card>

            <Card className="p-5" data-dashboard-section="ai">
              <div className="flex items-center gap-2">
                <Bot className="app-primary size-4" />
                <h2 className="app-text text-sm font-semibold">
                  Hızlı AI Komutları
                </h2>
              </div>
              <div className="mt-3 space-y-1">
                {aiCommands.slice(0, 4).map((command) => {
                  const Icon = command.icon;
                  return (
                    <Link
                      className="app-button-ghost flex items-center gap-3 rounded-lg px-2 py-2.5 text-xs"
                      href={command.href}
                      key={command.label}
                    >
                      <Icon className="size-3.5" />
                      {command.label}
                      <ChevronRight className="ml-auto size-3.5" />
                    </Link>
                  );
                })}
              </div>
            </Card>

            {showTechnicalStatus ? (
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="app-text text-sm font-semibold">
                    Sistem Durumu
                  </h2>
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--success)]">
                    <span className="size-1.5 rounded-full bg-[var(--success)]" />
                    Stabil
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="app-muted flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-[var(--success)]" />
                      Veritabanı
                    </span>
                    <span className="app-text">{databaseStatus}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="app-muted flex items-center gap-2">
                      <Sparkles className="size-3.5" />
                      AI Servisi
                    </span>
                    <span className="app-text">{aiProviderLabel}</span>
                  </div>
                </div>
                <Link
                  className={buttonClassName({
                    className: "mt-5 w-full",
                    size: "sm",
                    variant: "secondary",
                  })}
                  href="/today"
                >
                  Bugün Merkezine Git
                  <ArrowRight className="size-3.5" />
                </Link>
              </Card>
            ) : null}
          </section>
        </DashboardWidgetSection>
      </DashboardPersonalizedArea>
    </div>
  );
}
