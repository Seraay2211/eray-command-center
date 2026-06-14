"use client";

import {
  Archive,
  ClipboardCopy,
  Edit3,
  FilePlus2,
  FileText,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { ReportTypeBadge } from "@/components/reports/report-type-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ReportWithSources } from "@/types";

interface ReportDetailPanelProps {
  isBusy: boolean;
  onArchive: (report: ReportWithSources) => void;
  onClose: () => void;
  onCopy: (report: ReportWithSources) => void;
  onCreate: () => void;
  onDelete: (report: ReportWithSources) => void;
  onEdit: (report: ReportWithSources) => void;
  onSaveAsNote: (report: ReportWithSources) => void;
  report: ReportWithSources | null;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function ReportDetailPanel({
  isBusy,
  onArchive,
  onClose,
  onCopy,
  onCreate,
  onDelete,
  onEdit,
  onSaveAsNote,
  report,
}: ReportDetailPanelProps) {
  if (!report) {
    return (
      <Card className="hidden min-h-[520px] flex-col items-center justify-center p-8 text-center xl:flex">
        <span className="flex size-14 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/[0.07] text-violet-300">
          <FileText className="size-6" />
        </span>
        <h2 className="mt-5 text-base font-semibold text-zinc-200">Bir rapor seç</h2>
        <p className="mt-2 max-w-sm text-xs leading-6 text-zinc-600">
          Raporu okumak, düzenlemek veya not olarak kaydetmek için soldaki listeden bir kayıt seç.
        </p>
        <Button className="mt-5" onClick={onCreate} size="sm">
          <FilePlus2 className="size-3.5" />
          Yeni Rapor Oluştur
        </Button>
      </Card>
    );
  }

  return (
    <Card className="app-surface fixed inset-0 z-[70] flex flex-col overflow-hidden rounded-none xl:sticky xl:top-24 xl:z-auto xl:max-h-[calc(100vh-7rem)] xl:min-h-[620px] xl:rounded-2xl">
      <div className="app-border safe-top flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">Rapor okuma modu</p>
          <h2 className="mt-1 truncate text-lg font-semibold text-zinc-100">{report.title}</h2>
        </div>
        <button aria-label="Rapor detayını kapat" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-200" onClick={onClose} type="button">
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <ReportTypeBadge reportType={report.report_type} />
          <ReportStatusBadge status={report.status} />
          {report.ai_generated ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
              <Sparkles className="size-3" /> AI ile oluşturuldu
            </span>
          ) : null}
        </div>

        <div>
          <h3 className="app-text break-words text-2xl font-semibold leading-tight tracking-tight">{report.title}</h3>
          {report.summary ? (
            <p className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-sm leading-7 text-zinc-400">{report.summary}</p>
          ) : null}
        </div>

        <article className="whitespace-pre-wrap break-words font-mono text-xs leading-7 text-zinc-300">
          {report.content}
        </article>

        {report.sources.length > 0 ? (
          <div className="border-t border-white/[0.055] pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Rapor kaynakları</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {report.sources.map((source) => (
                <span className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-[10px] text-zinc-400" key={source.id}>
                  {source.source_type === "note" ? "Not" : "Görev"}: {source.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-2 border-t border-white/[0.055] pt-5 text-[10px] text-zinc-600 sm:grid-cols-2">
          <span>Oluşturuldu: {formatDate(report.created_at)}</span>
          <span className="sm:text-right">Güncellendi: {formatDate(report.updated_at)}</span>
          {report.source_date ? <span>Kaynak tarihi: {report.source_date}</span> : null}
          {report.period_start || report.period_end ? (
            <span className="sm:text-right">Dönem: {report.period_start ?? "?"} - {report.period_end ?? "?"}</span>
          ) : null}
        </div>
      </div>

      <div className="app-border app-surface safe-bottom grid grid-cols-2 gap-2 border-t px-4 py-4 sm:flex sm:flex-wrap sm:justify-end sm:px-6">
        <Button className="w-full sm:w-auto" disabled={isBusy} onClick={() => onCopy(report)} size="sm" variant="secondary">
          <ClipboardCopy className="size-3.5" /> Kopyala
        </Button>
        <Button className="w-full sm:w-auto" disabled={isBusy} onClick={() => onSaveAsNote(report)} size="sm" variant="secondary">
          <FilePlus2 className="size-3.5" /> Nota Kaydet
        </Button>
        {report.status !== "archived" ? (
          <Button className="w-full sm:w-auto" disabled={isBusy} onClick={() => onArchive(report)} size="sm" variant="secondary">
            <Archive className="size-3.5" /> Arşivle
          </Button>
        ) : null}
        <Button className="w-full sm:w-auto" disabled={isBusy} onClick={() => onEdit(report)} size="sm" variant="secondary">
          <Edit3 className="size-3.5" /> Düzenle
        </Button>
        <Button className="col-span-2 w-full border-rose-400/15 text-rose-300 hover:bg-rose-500/[0.08] sm:w-auto" disabled={isBusy} onClick={() => onDelete(report)} size="sm" variant="secondary">
          <Trash2 className="size-3.5" /> Sil
        </Button>
      </div>
    </Card>
  );
}
