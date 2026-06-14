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
  Target,
  WalletCards,
} from "lucide-react";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { RecentNoteCard } from "@/components/dashboard/recent-note-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskItem } from "@/components/dashboard/task-item";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InstallHintCard } from "@/components/pwa/install-hint-card";
import { getAiProviderDescription, getAiProviderLabel, resolveAiProvider } from "@/lib/ai/config";
import { aiCommands, quickActions } from "@/lib/mock-data";
import { REPORT_TYPE_LABELS } from "@/lib/reports";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { formatTRY } from "@/lib/utils/currency";
import { generateFinanceAlerts } from "@/lib/notifications/finance-alerts";
import { getDashboardData } from "@/services/dashboard-service";
import type { DashboardStats, StatItem } from "@/types";

export const metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

function getTodayHeading(): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date());
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
      description:
        stats.totalNotes > 0
          ? "Çalışma alanındaki aktif notlar"
          : "Henüz kayıtlı not bulunmuyor",
      icon: FileText,
      trend: stats.todayNotes > 0 ? `${stats.todayNotes} bugün` : undefined,
    },
    {
      title: "Açık Görev",
      value: String(stats.openTasks),
      description:
        stats.openTasks > 0
          ? "Tamamlanmayı bekleyen görevler"
          : "Henüz açık görev bulunmuyor",
      icon: ClipboardList,
    },
    {
      title: "Bugünkü Kayıt",
      value: String(stats.todayNotes),
      description:
        stats.todayNotes > 0
          ? "Bugün oluşturulan notlar"
          : "Bugün henüz yeni not yok",
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

function getFallbackStats(
  aiProviderLabel: string,
  aiProviderDescription: string,
): StatItem[] {
  return [
    {
      title: "Toplam Not",
      value: "--",
      description: "Bağlantı bekleniyor",
      icon: FileText,
    },
    {
      title: "Açık Görev",
      value: "--",
      description: "Bağlantı kurulunca görünecek",
      icon: ClipboardList,
    },
    {
      title: "Bugünkü Kayıt",
      value: "--",
      description: "Bağlantı kurulunca görünecek",
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
  const [dashboardResult] = await Promise.all([
    getDashboardData(),
    generateFinanceAlerts(),
  ]);
  const dashboard = dashboardResult.data;
  const aiProvider = resolveAiProvider();
  const aiProviderLabel = getAiProviderLabel(aiProvider);
  const aiProviderDescription = getAiProviderDescription(aiProvider);
  const stats = dashboard
    ? buildStatItems(dashboard.stats, aiProviderLabel, aiProviderDescription)
    : getFallbackStats(aiProviderLabel, aiProviderDescription);
  const isSupabaseConfigured = hasSupabaseEnv();
  const databaseStatus = !isSupabaseConfigured
    ? "Bağlantı bekleniyor"
    : dashboardResult.error
      ? dashboardResult.error.includes("schema.sql")
        ? "Kurulum bekleniyor"
        : "Bağlantı sorunu"
      : "Bağlı";
  const databaseStatusTone = !isSupabaseConfigured
    ? "text-zinc-600"
    : dashboardResult.error
      ? "text-amber-300"
      : "text-emerald-400";

  return (
    <div className="space-y-6 sm:space-y-8" data-dashboard-root>
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111114]/80 px-5 py-6 sm:px-7 sm:py-8">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-violet-500/[0.12] blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-px w-56 bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/[0.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
              <span className="size-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_#a78bfa]" />
              Kişisel çalışma alanı
            </div>
            <h1 className="max-w-2xl text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl lg:text-[34px]">
              Eray Command Center
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
              Notlarını, görevlerini ve günlük operasyon akışını tek merkezden
              takip et. Panel gerçek çalışma alanı verilerinle güncelleniyor.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className={buttonClassName({
                className: "w-full sm:w-auto",
                variant: "secondary",
              })}
              href="/today"
            >
              <Sunrise className="size-4" />
              Bugün
            </Link>
            <Link
              className={buttonClassName({
                className: "w-full sm:w-auto",
                variant: "secondary",
              })}
              href="/notes?new=1"
            >
              <Plus className="size-4" />
              Yeni Not
            </Link>
            <Link
              className={buttonClassName({
                className: "w-full sm:w-auto",
                variant: "secondary",
              })}
              href="/tasks?new=1"
            >
              <Plus className="size-4" />
              Yeni Görev
            </Link>
            <Link
              data-dashboard-section="ai"
              className={buttonClassName({
                className: "w-full sm:w-auto",
              })}
              href="/ai?action=summarize"
            >
              <Sparkles className="size-4" />
              AI ile Özetle
            </Link>
          </div>
        </div>
      </section>

      <InstallHintCard />

      <section>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div
              data-dashboard-section={item.title === "AI Modu" ? "ai" : undefined}
              key={item.title}
            >
              <StatCard item={item} />
            </div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                  Kısayollar
                </p>
                <h2 className="mt-1 text-base font-semibold text-zinc-200">
                  Hızlı aksiyonlar
                </h2>
              </div>
              <span className="hidden text-[11px] text-zinc-700 sm:block">
                Sık kullanılan işlemler
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quickActions.map((action) => (
                <QuickActionCard action={action} key={action.title} />
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-3">
            <section data-dashboard-section="calendar">
              <Card className="h-full p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                      Günlük plan
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-zinc-200">
                      Bugünün Planı
                    </h2>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] app-border app-surface-2 app-muted">
                      <CalendarDays className="size-3" />
                      {dashboard?.plannerStats.today ?? 0} plan
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] app-border app-surface-2 app-muted">
                      <CheckSquare2 className="size-3" />
                      {dashboard?.todayTodoStats.pending ?? 0} bekleyen
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {dashboardResult.error ? (
                    <div className="rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-4 text-xs leading-6 text-rose-200">
                      {dashboardResult.error}
                    </div>
                  ) : dashboard?.todayPlannerEvents.length ? (
                    dashboard.todayPlannerEvents.map((event) => (
                      <Link
                        className="block rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 transition hover:border-violet-400/20 hover:bg-violet-500/[0.04]"
                        href={`/calendar?event=${encodeURIComponent(event.id)}`}
                        key={event.id}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-300">
                            {event.all_day
                              ? "Tüm gun"
                              : new Intl.DateTimeFormat("tr-TR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "Europe/Istanbul",
                                }).format(new Date(event.start_at))}
                          </span>
                          <span className="text-[10px] text-zinc-700">
                            {event.status === "done"
                              ? "Tamamlandi"
                              : event.status === "in_progress"
                                ? "Devam ediyor"
                                : "Planlandi"}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-medium text-zinc-200">
                          {event.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                          {event.description?.trim() || "Açıklama eklenmedi."}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-4">
                      <p className="text-sm font-semibold text-zinc-200">
                        Bugün için plan yok
                      </p>
                      <p className="mt-2 text-xs leading-6 text-zinc-500">
                        Takvim modülüyle günlük akışına odak blokları ve hatırlatmalar ekleyebilirsin.
                      </p>
                      <Link
                        className={buttonClassName({
                          className: "mt-4 h-9",
                          variant: "secondary",
                        })}
                        href="/calendar?new=1"
                      >
                        Plan oluştur
                      </Link>
                    </div>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    className={buttonClassName({
                      className: "h-9",
                      variant: "secondary",
                    })}
                    href="/calendar?todo=1"
                  >
                    <CheckSquare2 className="size-3.5" />
                    Yeni To-Do
                  </Link>
                  <Link
                    className={buttonClassName({
                      className: "h-9",
                      variant: "secondary",
                    })}
                    href="/calendar?new=1"
                  >
                    <Plus className="size-3.5" />
                    Yeni Plan
                  </Link>
                </div>
              </Card>
            </section>

            <section data-dashboard-section="notes">
              <Card className="h-full p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                      Kayıtlar
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-zinc-200">
                      Son notlar
                    </h2>
                  </div>
                  <Link
                    className="flex items-center gap-1 text-xs font-medium text-zinc-600 transition hover:text-violet-300"
                    href="/notes"
                  >
                    Tümünü gör
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
                <div className="mt-3">
                  {dashboardResult.error ? (
                    <div className="rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-4 text-xs leading-6 text-rose-200">
                      {dashboardResult.error}
                    </div>
                  ) : dashboard?.recentNotes.length ? (
                    dashboard.recentNotes.map((note) => (
                      <RecentNoteCard key={note.id} note={note} />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-5 text-sm text-zinc-500">
                      <p className="font-medium text-zinc-200">
                        Henüz not yok
                      </p>
                      <p className="mt-2 leading-6">
                        İlk notunu oluşturduğunda burada son kayıtlarını kısa
                        özetleriyle göreceksin.
                      </p>
                      <Link
                        className={buttonClassName({
                          className: "mt-4 h-9",
                          variant: "secondary",
                        })}
                        href="/notes?new=1"
                      >
                        İlk notunu oluştur
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            </section>

            <section data-dashboard-section="tasks">
              <Card className="h-full p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                      {getTodayHeading()}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-zinc-200">
                      Görevler
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[10px] text-zinc-600">
                    <Clock3 className="size-3" />
                    {dashboard?.stats.openTasks ?? 0} açık
                  </div>
                </div>
                <div className="mt-3">
                  {dashboardResult.error ? (
                    <div className="rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-4 text-xs leading-6 text-rose-200">
                      {dashboardResult.error}
                    </div>
                  ) : dashboard?.openTasks.length ? (
                    dashboard.openTasks.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-4">
                      <p className="text-sm font-semibold text-zinc-200">
                        Henüz açık görev yok
                      </p>
                      <p className="mt-2 text-xs leading-6 text-zinc-500">
                        Yeni bir görev oluşturarak günlük operasyon akışını
                        burada takip etmeye başla.
                      </p>
                      <Link
                        className={buttonClassName({
                          className: "mt-4 h-9",
                          variant: "secondary",
                        })}
                        href="/tasks?new=1"
                      >
                        İlk görevini oluştur
                      </Link>
                    </div>
                  )}
                </div>
                <Link
                  className="mt-3 flex h-9 items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.08] text-xs font-medium text-zinc-600 transition hover:border-violet-400/25 hover:bg-violet-500/[0.04] hover:text-violet-300"
                  href="/tasks"
                >
                  Görev panosuna git
                  <ArrowRight className="size-3.5" />
                </Link>
              </Card>
            </section>
          </div>

          <section data-dashboard-section="finance">
            <Card className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <span className="app-primary flex size-10 items-center justify-center rounded-xl bg-violet-500/10">
                    <WalletCards className="size-[18px]" />
                  </span>
                  <div>
                    <p className="app-muted text-[10px] font-semibold uppercase tracking-[0.18em]">
                      Finans kontrolü
                    </p>
                    <h2 className="app-text mt-1 text-base font-semibold">
                      Borç ve Ödeme Özeti
                    </h2>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className={buttonClassName({ size: "sm", variant: "secondary" })}
                    href="/finance?new=1"
                  >
                    <Plus className="size-3.5" />
                    Yeni Borç
                  </Link>
                  <Link
                    className={buttonClassName({ size: "sm", variant: "secondary" })}
                    href="/finance?action=summary"
                  >
                    <Sparkles className="size-3.5" />
                    Finans Özeti
                  </Link>
                </div>
              </div>
              {dashboard?.financeSummary.available ? (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="app-surface-2 rounded-xl border p-3">
                    <p className="app-muted text-[10px]">Kalan borç</p>
                    <p className="app-text mt-1 text-sm font-semibold">
                      {formatTRY(dashboard.financeSummary.remainingDebt)}
                    </p>
                  </div>
                  <div className="app-surface-2 rounded-xl border p-3">
                    <p className="app-muted text-[10px]">Bu ay ödenecek</p>
                    <p className="app-text mt-1 text-sm font-semibold">
                      {formatTRY(dashboard.financeSummary.dueThisMonth)}
                    </p>
                  </div>
                  <div className="app-surface-2 rounded-xl border p-3">
                    <p className="app-muted text-[10px]">Kritik kayıt</p>
                    <p className="mt-1 text-sm font-semibold text-rose-400">
                      {dashboard.financeSummary.criticalCount}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="app-muted mt-4 text-xs">
                  Finans modülü SQL kurulumu tamamlandığında özet burada görünecek.
                </p>
              )}
              {dashboard?.financeSummary.upcomingDebts.length ? (
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {dashboard.financeSummary.upcomingDebts.map((debt) => (
                    <Link
                      className="app-surface-2 rounded-xl border p-3 transition hover:border-[color-mix(in_srgb,var(--primary)_28%,var(--border))]"
                      href={`/finance?debt=${encodeURIComponent(debt.id)}`}
                      key={debt.id}
                    >
                      <p className="app-text truncate text-xs font-medium">{debt.title}</p>
                      <p className="app-muted mt-1 text-[10px]">
                        {formatTRY(debt.remainingAmount)} · {debt.dueDate ?? "Vade yok"}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : null}
            </Card>
          </section>

          <section data-dashboard-section="reports">
            <Card className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                    <BarChart3 className="size-[18px]" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                      Rapor Merkezi
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-zinc-200">
                      Son raporlar
                    </h2>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[10px] text-zinc-500">
                    {dashboard?.stats.totalReports ?? 0} rapor
                  </span>
                  <span className="rounded-full border border-violet-400/15 bg-violet-500/[0.07] px-2.5 py-1 text-[10px] text-violet-300">
                    {dashboard?.stats.aiReports ?? 0} AI
                  </span>
                  <Link
                    className="ml-1 flex items-center gap-1 text-xs font-medium text-zinc-600 transition hover:text-violet-300"
                    href="/reports"
                  >
                    Tümünü gör
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </div>

              {dashboardResult.error ? (
                <div className="mt-4 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-4 text-xs leading-6 text-rose-200">
                  Rapor verileri alınamadı. Faz 7 veritabanı kurulumunu kontrol edin.
                </div>
              ) : dashboard?.recentReports.length ? (
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  {dashboard.recentReports.map((report) => (
                    <Link
                      className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 transition hover:border-violet-400/20 hover:bg-violet-500/[0.04]"
                      href={`/reports?report=${encodeURIComponent(report.id)}`}
                      key={report.id}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-300">
                          {REPORT_TYPE_LABELS[report.reportType]}
                        </span>
                        <span className="text-[10px] text-zinc-700">
                          {report.date}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-zinc-300 transition group-hover:text-white">
                        {report.title}
                      </p>
                      {report.aiGenerated ? (
                        <span className="mt-3 inline-flex items-center gap-1 text-[10px] text-zinc-600">
                          <Sparkles className="size-3 text-violet-400" />
                          AI ile üretildi
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-4 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      Henüz rapor yok
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Not ve görevlerinden ilk günlük raporunu oluşturabilirsin.
                    </p>
                  </div>
                  <Link
                    className={buttonClassName({
                      className: "h-9 shrink-0",
                      variant: "secondary",
                    })}
                    href="/reports?new=ai&type=daily"
                  >
                    <Sparkles className="size-3.5" />
                    AI raporu oluştur
                  </Link>
                </div>
              )}
            </Card>
          </section>
        </div>

        <aside className="grid gap-4 md:grid-cols-3 2xl:sticky 2xl:top-24 2xl:grid-cols-1">
          <Card className="relative overflow-hidden p-5">
            <div className="absolute -right-12 -top-12 size-36 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                  <Target className="size-[18px]" />
                </span>
                <span className="font-mono text-[10px] text-zinc-700">
                  PIN /{" "}
                  {String(dashboard?.pinnedSummary.count ?? 0).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Sabitlenen notlar
              </p>
              <h3 className="mt-2 text-base font-semibold leading-6 text-zinc-100">
                {dashboard?.pinnedSummary.latestNote
                  ? dashboard.pinnedSummary.latestNote.title
                  : "Henüz sabitlenen not yok."}
              </h3>
              <p className="mt-3 text-xs leading-6 text-zinc-500">
                {dashboard?.pinnedSummary.latestNote
                  ? dashboard.pinnedSummary.latestNote.preview
                  : "Önemli gördüğün notları sabitleyerek bu alanı canlı bir odak kartına dönüştürebilirsin."}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {dashboard?.pinnedSummary.latestNote ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/15 bg-violet-500/[0.07] px-2.5 py-1 text-[10px] font-medium text-violet-300">
                    <Pin className="size-3" />
                    {dashboard.pinnedSummary.latestNote.date}
                  </span>
                ) : null}
                <Link
                  className="text-xs font-medium text-violet-300 transition hover:text-violet-200"
                  href="/notes"
                >
                  Notlara git
                </Link>
              </div>
            </div>
          </Card>

          <Card className="p-5" data-dashboard-section="ai">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
                <Bot className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">
                  Hızlı AI komutları
                </h3>
                <p className="text-[10px] text-zinc-700">
                  Hazır aksiyonlar
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {aiCommands.map((command) => {
                const Icon = command.icon;

                return (
                  <Link
                    className="group flex items-center gap-3 rounded-lg border border-transparent px-2.5 py-2.5 text-left transition hover:border-white/[0.06] hover:bg-white/[0.03]"
                    href={command.href}
                    key={command.label}
                  >
                    <Icon className="size-3.5 text-zinc-600 transition group-hover:text-violet-400" />
                    <span className="flex-1 text-xs font-medium text-zinc-500 transition group-hover:text-zinc-200">
                      {command.label}
                    </span>
                    <span className="text-[10px] text-zinc-700 transition group-hover:text-zinc-500">
                      Hazır
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">
                Sistem durumu
              </h3>
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                Stabil
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-zinc-600">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  Arayüz
                </span>
                <span className="text-zinc-400">Hazır</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-zinc-600">
                  <CheckCircle2
                    className={`size-3.5 ${
                      dashboardResult.error ? "text-amber-400" : "text-emerald-500"
                    }`}
                  />
                  Veritabanı
                </span>
                <span className={databaseStatusTone}>{databaseStatus}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-zinc-600">
                  <Sparkles className="size-3.5 text-zinc-600" />
                  AI servisi
                </span>
                <span
                  className={
                    aiProvider === "gemini"
                      ? "text-emerald-400"
                      : "text-amber-300"
                  }
                >
                  {getAiProviderLabel(aiProvider)}
                </span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
