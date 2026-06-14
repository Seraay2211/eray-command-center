"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Check, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import {
  REPORT_STATUS_OPTIONS,
  REPORT_TYPE_OPTIONS,
} from "@/lib/reports";
import type {
  CreateReportInput,
  ReportStatus,
  ReportType,
  ReportWithSources,
} from "@/types";

interface ReportFormProps {
  error: string;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: CreateReportInput) => void;
  report: ReportWithSources | null;
}

const fieldClassName =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-violet-400/45 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/10 disabled:cursor-wait disabled:opacity-60";

export function ReportForm({
  error,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  report,
}: ReportFormProps) {
  const [title, setTitle] = useState(report?.title ?? "");
  const [content, setContent] = useState(report?.content ?? "");
  const [summary, setSummary] = useState(report?.summary ?? "");
  const [reportType, setReportType] = useState<ReportType>(
    report?.report_type ?? "custom",
  );
  const [status, setStatus] = useState<ReportStatus>(
    report?.status ?? "draft",
  );
  const [sourceDate, setSourceDate] = useState(report?.source_date ?? "");
  const [periodStart, setPeriodStart] = useState(report?.period_start ?? "");
  const [periodEnd, setPeriodEnd] = useState(report?.period_end ?? "");

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) onClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      title,
      content,
      report_type: reportType,
      status,
      source_date: sourceDate || null,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      summary: summary || null,
      ai_generated: report?.ai_generated ?? false,
      sources: report?.sources.map((source) => ({
        source_type: source.source_type as "note" | "task",
        source_id: source.source_id,
      })),
    });
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Rapor formunu kapat"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        disabled={isSaving}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-labelledby="report-form-title"
        aria-modal="true"
        className="app-surface safe-bottom absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l app-border shadow-[-30px_0_80px_rgba(0,0,0,0.4)]"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
              {report ? "Rapor düzenleme" : "Manuel rapor"}
            </p>
            <h2
              className="mt-1 text-lg font-semibold text-zinc-100"
              id="report-form-title"
            >
              {report ? "Raporu düzenle" : "Yeni rapor oluştur"}
            </h2>
          </div>
          <button
            aria-label="Rapor formunu kapat"
            className="flex size-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-200"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400" htmlFor="report-title">
                Başlık <span className="text-rose-400">*</span>
              </label>
              <input
                autoFocus
                className={`${fieldClassName} h-11`}
                disabled={isSaving}
                id="report-title"
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Rapor başlığını yaz..."
                required
                value={title}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-400">Rapor tipi</p>
                <DarkSelect
                  ariaLabel="Rapor tipi"
                  disabled={isSaving}
                  onChange={(value) => setReportType(value as ReportType)}
                  options={REPORT_TYPE_OPTIONS}
                  value={reportType}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-400">Durum</p>
                <DarkSelect
                  ariaLabel="Rapor durumu"
                  disabled={isSaving}
                  onChange={(value) => setStatus(value as ReportStatus)}
                  options={REPORT_STATUS_OPTIONS}
                  value={status}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-xs font-medium text-zinc-400">
                Kaynak tarihi
                <input
                  className={`${fieldClassName} mt-2 h-11 [color-scheme:dark]`}
                  disabled={isSaving}
                  onChange={(event) => setSourceDate(event.target.value)}
                  type="date"
                  value={sourceDate}
                />
              </label>
              <label className="text-xs font-medium text-zinc-400">
                Dönem başlangıcı
                <input
                  className={`${fieldClassName} mt-2 h-11 [color-scheme:dark]`}
                  disabled={isSaving}
                  onChange={(event) => setPeriodStart(event.target.value)}
                  type="date"
                  value={periodStart}
                />
              </label>
              <label className="text-xs font-medium text-zinc-400">
                Dönem bitişi
                <input
                  className={`${fieldClassName} mt-2 h-11 [color-scheme:dark]`}
                  disabled={isSaving}
                  onChange={(event) => setPeriodEnd(event.target.value)}
                  type="date"
                  value={periodEnd}
                />
              </label>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400" htmlFor="report-summary">
                Kısa özet
              </label>
              <textarea
                className={`${fieldClassName} min-h-24 resize-y py-3 leading-6`}
                disabled={isSaving}
                id="report-summary"
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Raporun kısa yönetici özetini yaz..."
                value={summary}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400" htmlFor="report-content">
                İçerik <span className="text-rose-400">*</span>
              </label>
              <textarea
                className={`${fieldClassName} min-h-80 resize-y py-3 font-mono text-xs leading-6`}
                disabled={isSaving}
                id="report-content"
                onChange={(event) => setContent(event.target.value)}
                placeholder="# Genel Durum..."
                required
                value={content}
              />
            </div>

            {error ? (
              <div className="flex gap-2.5 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-3 text-xs leading-5 text-rose-200" role="alert">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
                {error}
              </div>
            ) : null}
          </div>

          <div className="app-surface safe-bottom grid grid-cols-2 gap-2 border-t app-border px-5 py-4 sm:flex sm:justify-end sm:px-6">
            <Button disabled={isSaving} onClick={onClose} type="button" variant="secondary">
              İptal
            </Button>
            <Button disabled={isSaving || !title.trim() || !content.trim()} type="submit">
              {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {isSaving ? "Kaydediliyor..." : "Raporu Kaydet"}
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}
