"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ClipboardCopy,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AiReportGenerator } from "@/components/reports/ai-report-generator";
import { DeleteReportDialog } from "@/components/reports/delete-report-dialog";
import { ReportCard } from "@/components/reports/report-card";
import { ReportDetailPanel } from "@/components/reports/report-detail-panel";
import { ReportForm } from "@/components/reports/report-form";
import {
  ReportsToolbar,
  type ReportsDateFilter,
  type ReportsSort,
} from "@/components/reports/reports-toolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSettings } from "@/components/providers/settings-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { trackRecentItem } from "@/lib/recent-items";
import { createNote } from "@/features/notes/actions";
import {
  archiveReport,
  createReport,
  deleteReport,
  getReports,
  updateReport,
} from "@/services/reports-service";
import type {
  CreateReportInput,
  NoteWithRelations,
  ReportStatus,
  ReportType,
  ReportWithSources,
  TaskWithCategory,
} from "@/types";

interface ReportsClientProps {
  initialAiOpen: boolean;
  initialError: string;
  initialManualOpen: boolean;
  initialNotes: NoteWithRelations[];
  initialReportId: string;
  initialReports: ReportWithSources[];
  initialTimestamp: number;
  initialSourceError: string;
  initialTasks: TaskWithCategory[];
  initialType: ReportType;
}

export function ReportsClient({
  initialAiOpen,
  initialError,
  initialManualOpen,
  initialNotes,
  initialReportId,
  initialReports,
  initialTimestamp,
  initialSourceError,
  initialTasks,
  initialType,
}: ReportsClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const isEnglish = settings.language === "en";
  const initialSelected = initialReports.find(
    (report) => report.id === initialReportId,
  );
  const [reports, setReports] = useState(initialReports);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    initialSelected?.id ?? null,
  );
  const [detailError, setDetailError] = useState(
    initialReportId && !initialSelected
      ? "Bağlantıdaki rapor bulunamadı veya artık erişilebilir değil."
      : "",
  );
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | ReportType>("all");
  const [status, setStatus] = useState<"active" | "all" | ReportStatus>(
    "active",
  );
  const [dateFilter, setDateFilter] =
    useState<ReportsDateFilter>("all");
  const [sort, setSort] = useState<ReportsSort>("updated");
  const [isFormOpen, setIsFormOpen] = useState(initialManualOpen);
  const [isAiOpen, setIsAiOpen] = useState(initialAiOpen);
  const [editingReport, setEditingReport] =
    useState<ReportWithSources | null>(null);
  const [deletingReport, setDeletingReport] =
    useState<ReportWithSources | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyReportId, setBusyReportId] = useState("");
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState(initialError);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | null>(null);
  const [visibleState, setVisibleState] = useState({
    count: 50,
    key: "",
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialReports.length >= 50);
  const debouncedQuery = useDebounce(query, 250);

  const schemaMissing = pageError.includes("phase-7-reports.sql");
  const isDevelopment = process.env.NODE_ENV === "development";
  const selectedReport =
    reports.find((report) => report.id === selectedReportId) ?? null;

  useEffect(
    () => () => {
      if (noticeTimer.current !== null) {
        window.clearTimeout(noticeTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedReport) {
      return;
    }

    trackRecentItem({
      href: `/reports?report=${encodeURIComponent(selectedReport.id)}`,
      id: selectedReport.id,
      title: selectedReport.title,
      type: "report",
    });
  }, [selectedReport]);

  const filteredReports = useMemo(() => {
    const normalized = debouncedQuery.trim().toLocaleLowerCase("tr-TR");
    const dateThreshold =
      dateFilter === "today"
        ? initialTimestamp - 24 * 60 * 60 * 1000
        : dateFilter === "7days"
          ? initialTimestamp - 7 * 24 * 60 * 60 * 1000
          : dateFilter === "30days"
            ? initialTimestamp - 30 * 24 * 60 * 60 * 1000
            : 0;

    return reports
      .filter((report) => {
        const matchesQuery =
          !normalized ||
          report.title.toLocaleLowerCase("tr-TR").includes(normalized) ||
          report.content.toLocaleLowerCase("tr-TR").includes(normalized) ||
          report.summary?.toLocaleLowerCase("tr-TR").includes(normalized);
        const matchesType = type === "all" || report.report_type === type;
        const matchesStatus =
          status === "all" ||
          (status === "active" && report.status !== "archived") ||
          report.status === status;
        const matchesDate =
          !dateThreshold ||
          new Date(report.updated_at).getTime() >= dateThreshold;

        return matchesQuery && matchesType && matchesStatus && matchesDate;
      })
      .sort((first, second) => {
        if (sort === "oldest") {
          return (
            new Date(first.created_at).getTime() -
            new Date(second.created_at).getTime()
          );
        }
        const firstDate = sort === "newest" ? first.created_at : first.updated_at;
        const secondDate =
          sort === "newest" ? second.created_at : second.updated_at;
        return new Date(secondDate).getTime() - new Date(firstDate).getTime();
      });
  }, [dateFilter, debouncedQuery, initialTimestamp, reports, sort, status, type]);
  const filterKey = useMemo(
    () => [dateFilter, debouncedQuery, sort, status, type].join("|"),
    [dateFilter, debouncedQuery, sort, status, type],
  );
  const visibleCount =
    visibleState.key === filterKey ? visibleState.count : 50;
  const visibleReports = useMemo(
    () => filteredReports.slice(0, visibleCount),
    [filteredReports, visibleCount],
  );

  const replaceParams = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(changes).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.replace(
        params.toString() ? `${pathname}?${params.toString()}` : pathname,
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  function showNotice(message: string) {
    if (noticeTimer.current !== null) {
      window.clearTimeout(noticeTimer.current);
    }
    setNotice(message);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3200);
  }

  function selectReport(report: ReportWithSources) {
    setDetailError("");
    setSelectedReportId(report.id);
    trackRecentItem({
      href: `/reports?report=${encodeURIComponent(report.id)}`,
      id: report.id,
      title: report.title,
      type: "report",
    });
    replaceParams({ report: report.id });
  }

  function closeDetail() {
    setSelectedReportId(null);
    setDetailError("");
    replaceParams({ report: null });
  }

  function openManualReport() {
    setEditingReport(null);
    setFormError("");
    setIsFormOpen(true);
    replaceParams({ new: "1", type: null });
  }

  function openEditReport(report: ReportWithSources) {
    setEditingReport(report);
    setFormError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingReport(null);
    setFormError("");
    replaceParams({ new: null, type: null });
  }

  function openAiReport(reportType: ReportType = "custom") {
    setIsAiOpen(true);
    replaceParams({ new: "ai", type: reportType });
  }

  function closeAiReport() {
    setIsAiOpen(false);
    replaceParams({ new: null, type: null });
  }

  async function handleCopy(report: ReportWithSources) {
    try {
      await navigator.clipboard.writeText(report.content);
      showNotice("Rapor panoya kopyalandı.");
    } catch {
      setPageError("Rapor panoya kopyalanamadı.");
    }
  }

  async function handleSave(input: CreateReportInput) {
    setIsSaving(true);
    setFormError("");
    const result = editingReport
      ? await updateReport(editingReport.id, input)
      : await createReport(input);
    setIsSaving(false);

    if (result.error || !result.data) {
      setFormError(result.error ?? "Rapor kaydedilemedi.");
      return;
    }

    const savedReport = result.data;
    setReports((current) =>
      editingReport
        ? current.map((report) =>
            report.id === savedReport.id ? savedReport : report,
          )
        : [savedReport, ...current],
    );
    setSelectedReportId(savedReport.id);
    setPageError("");
    showNotice(editingReport ? "Rapor güncellendi." : "Rapor oluşturuldu.");
    setIsFormOpen(false);
    setEditingReport(null);
    replaceParams({ new: null, type: null, report: savedReport.id });
  }

  async function handleSaveAiReport(
    input: CreateReportInput,
  ): Promise<boolean> {
    const result = await createReport(input);
    if (result.error || !result.data) {
      setPageError(result.error ?? "AI raporu kaydedilemedi.");
      return false;
    }

    const savedReport = result.data;
    setReports((current) => [savedReport, ...current]);
    setSelectedReportId(savedReport.id);
    showNotice("AI raporu taslak olarak kaydedildi.");
    replaceParams({ new: null, type: null, report: savedReport.id });
    return true;
  }

  async function handleSaveAsNote(
    title: string,
    content: string,
  ): Promise<boolean> {
    const result = await createNote({
      title: `[Rapor] ${title}`.slice(0, 200),
      content,
      categoryId: null,
      tags: ["rapor"],
      isPinned: false,
    });

    if (result.error) {
      setPageError(result.error);
      return false;
    }

    showNotice("Rapor yeni not olarak kaydedildi.");
    return true;
  }

  async function handleArchive(report: ReportWithSources) {
    setBusyReportId(report.id);
    const result = await archiveReport(report.id);
    setBusyReportId("");

    if (result.error || !result.data) {
      setPageError(result.error ?? "Rapor arşivlenemedi.");
      return;
    }

    const archived = result.data;
    setReports((current) =>
      current.map((item) => (item.id === archived.id ? archived : item)),
    );
    showNotice("Rapor arşivlendi.");
  }

  async function performDelete(reportToDelete: ReportWithSources) {
    const reportId = reportToDelete.id;
    setIsDeleting(true);
    const result = await deleteReport(reportId);
    setIsDeleting(false);

    if (result.error) {
      setPageError(result.error);
      setDeletingReport(null);
      return;
    }

    setReports((current) => current.filter((report) => report.id !== reportId));
    if (selectedReportId === reportId) closeDetail();
    setDeletingReport(null);
    showNotice("Rapor silindi.");
  }

  function requestDelete(report: ReportWithSources) {
    if (settings.confirm_before_delete) {
      setDeletingReport(report);
      return;
    }

    void performDelete(report);
  }

  async function handleDelete() {
    if (deletingReport) await performDelete(deletingReport);
  }

  async function handleLoadMore() {
    setIsLoadingMore(true);
    const result = await getReports({
      limit: 50,
      offset: reports.length,
    });
    setIsLoadingMore(false);

    if (result.error || !result.data) {
      setPageError(result.error ?? "Daha fazla rapor yuklenemedi.");
      return;
    }

    const nextReports = result.data;

    setReports((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      return [
        ...current,
        ...nextReports.filter((item) => !existingIds.has(item.id)),
      ];
    });
    setHasMore(nextReports.length === 50);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">{isEnglish ? "Analysis" : "Analiz"}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{isEnglish ? "Reports" : "Raporlar"}</h1>
          <p className="mt-2 text-sm text-zinc-500">{isEnglish ? "Manage daily operations, executive summaries and personal progress reports." : "Günlük operasyon, yönetici özeti ve kişisel ilerleme raporlarını buradan yönet."}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:flex">
          <Button disabled={schemaMissing} onClick={openManualReport} variant="secondary"><Plus className="size-4" /> {isEnglish ? "New Report" : "Yeni Rapor"}</Button>
          <Button disabled={schemaMissing} onClick={() => openAiReport("custom")}><Sparkles className="size-4" /> {isEnglish ? "Create AI Report" : "AI Rapor Oluştur"}</Button>
          <Button disabled={schemaMissing} onClick={() => openAiReport("daily")} variant="secondary">Günlük Rapor</Button>
          <Button disabled={schemaMissing} onClick={() => openAiReport("weekly")} variant="secondary">Haftalık Özet</Button>
        </div>
      </div>

      {notice ? (
        <div className="app-surface fixed inset-x-3 top-20 z-[120] flex items-center gap-2 rounded-xl border border-emerald-400/15 px-4 py-3 text-xs font-medium text-emerald-500 shadow-2xl sm:left-auto sm:right-4" role="status">
          <CheckCircle2 className="size-4" /> {notice}
        </div>
      ) : null}

      {schemaMissing ? (
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="flex size-11 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-500/[0.08] text-amber-300"><AlertCircle className="size-5" /></span>
            <h2 className="app-text mt-5 text-lg font-semibold">Rapor alanı hazırlanıyor</h2>
            <p className="app-muted mt-2 text-sm leading-6">
              Rapor kayıtları şu anda yüklenemiyor. Birazdan tekrar kontrol edebilirsin.
            </p>
            {isDevelopment ? (
              <p className="app-muted mt-3 text-xs leading-5">
                Geliştirme notu: <code className="app-surface-2 app-primary rounded px-1.5 py-0.5 font-mono text-xs">database/phase-7-reports.sql</code>
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              {isDevelopment ? (
                <Button onClick={() => { navigator.clipboard.writeText("database/phase-7-reports.sql"); showNotice("Kurulum notu kopyalandı."); }} variant="secondary"><ClipboardCopy className="size-4" /> Kurulum notunu kopyala</Button>
              ) : null}
              <Button onClick={() => router.refresh()}><RefreshCw className="size-4" /> Tekrar dene</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {pageError || initialSourceError ? (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-4 text-xs leading-5 text-rose-200" role="alert">
              <span className="flex gap-2.5"><AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />{pageError || initialSourceError}</span>
              {pageError ? <button className="text-rose-300/60 hover:text-rose-200" onClick={() => setPageError("")} type="button">Kapat</button> : null}
            </div>
          ) : null}

          <ReportsToolbar dateFilter={dateFilter} onDateFilterChange={setDateFilter} onQueryChange={setQuery} onSortChange={setSort} onStatusChange={setStatus} onTypeChange={setType} query={query} resultCount={filteredReports.length} sort={sort} status={status} type={type} />

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(440px,1.05fr)]">
            <div>
              {filteredReports.length ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    {visibleReports.map((report) => (
                      <ReportCard isSelected={selectedReportId === report.id} key={report.id} onCopy={handleCopy} onDelete={requestDelete} onEdit={openEditReport} onSelect={selectReport} report={report} />
                    ))}
                  </div>
                  {filteredReports.length > visibleReports.length ? (
                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={() =>
                          setVisibleState({
                            count: visibleCount + 50,
                            key: filterKey,
                          })
                        }
                        size="sm"
                        variant="secondary"
                      >
                        Daha fazla göster
                      </Button>
                    </div>
                  ) : null}
                  {filteredReports.length === visibleReports.length && hasMore ? (
                    <div className="mt-4 flex justify-center">
                      <Button disabled={isLoadingMore} onClick={() => void handleLoadMore()} size="sm" variant="secondary">
                        {isLoadingMore ? "Yükleniyor..." : "50 rapor daha yükle"}
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <Card className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
                  <span className="app-primary-bg flex size-14 items-center justify-center rounded-2xl"><BarChart3 className="size-6" /></span>
                  <h2 className="app-text mt-5 text-lg font-semibold">Henüz rapor yok</h2>
                  <p className="app-muted mt-2 max-w-md text-sm leading-6">Notlarından, görevlerinden veya günlük akışından düzenli raporlar oluşturabilirsin.</p>
                  <Button className="mt-6" onClick={() => openAiReport("daily")}><Sparkles className="size-4" /> Rapor Oluştur</Button>
                </Card>
              )}
            </div>
            <ReportDetailPanel isBusy={busyReportId === selectedReport?.id} onArchive={handleArchive} onClose={closeDetail} onCopy={handleCopy} onCreate={openManualReport} onDelete={requestDelete} onEdit={openEditReport} onSaveAsNote={(report) => { void handleSaveAsNote(report.title, report.content); }} report={selectedReport} />
          </div>
          {detailError ? <p className="text-xs text-rose-300">{detailError}</p> : null}
        </div>
      )}

      <ReportForm error={formError} isOpen={isFormOpen && !schemaMissing} isSaving={isSaving} key={`${isFormOpen}-${editingReport?.id ?? "new"}`} onClose={closeForm} onSubmit={handleSave} report={editingReport} />
      <AiReportGenerator initialTimestamp={initialTimestamp} initialType={initialType} isOpen={isAiOpen && !schemaMissing} key={`${isAiOpen}-${initialType}`} notes={initialNotes} onClose={closeAiReport} onSaveNote={handleSaveAsNote} onSaveReport={handleSaveAiReport} tasks={initialTasks} />
      <DeleteReportDialog isDeleting={isDeleting} onCancel={() => setDeletingReport(null)} onConfirm={handleDelete} report={deletingReport} />
    </div>
  );
}
